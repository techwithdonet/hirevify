/**
 * ATS Upload Diagnostic Tool
 * Quick diagnostic to identify file upload issues
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { FileText, Upload, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { productionFileStorage } from '../utils/ats/productionFileStorage';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function ATSUploadDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults([]);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const runDiagnostic = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: File validation
      addResult({
        step: 'File Validation',
        status: 'success',
        message: `File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
      });

      // Step 2: Storage availability check
      try {
        const isAvailable = await productionFileStorage.isStorageAvailable();
        addResult({
          step: 'Storage Availability',
          status: isAvailable ? 'success' : 'error',
          message: isAvailable ? 'Storage service is available' : 'Storage service is not available'
        });
      } catch (error) {
        addResult({
          step: 'Storage Availability',
          status: 'error',
          message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Step 3: Upload attempt
      try {
        const uploadResult = await productionFileStorage.uploadResumeFile(
          selectedFile,
          'diagnostic-user',
          'diagnostic-candidate'
        );

        if (uploadResult.success) {
          addResult({
            step: 'File Upload',
            status: 'success',
            message: 'File uploaded successfully',
            details: {
              filePath: uploadResult.filePath,
              signedUrl: uploadResult.signedUrl ? 'Generated' : 'Not generated',
              metadata: uploadResult.metadata
            }
          });
        } else if (uploadResult.isLocalProcessing) {
          addResult({
            step: 'File Upload',
            status: 'warning',
            message: 'Upload failed but local processing will continue',
            details: {
              error: uploadResult.error,
              localProcessing: true,
              metadata: uploadResult.metadata
            }
          });
        } else {
          addResult({
            step: 'File Upload',
            status: 'error',
            message: `Upload failed: ${uploadResult.error}`,
            details: uploadResult
          });
        }
      } catch (error) {
        addResult({
          step: 'File Upload',
          status: 'error',
          message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        });
      }

      // Step 4: Direct server endpoint test
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', 'diagnostic-user');
        formData.append('candidateId', 'diagnostic-candidate');

        const response = await fetch('https://lfwfwnqoioqyxnbzlnje.supabase.co/functions/v1/make-server-d4feca44/files/ats-upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          addResult({
            step: 'Direct Server Upload',
            status: result.success ? 'success' : 'warning',
            message: result.success ? 'Server upload successful' : `Server upload failed: ${result.error}`,
            details: result
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          addResult({
            step: 'Direct Server Upload',
            status: 'error',
            message: `Server responded with status: ${response.status}`,
            details: { status: response.status, error: errorData }
          });
        }
      } catch (error) {
        addResult({
          step: 'Direct Server Upload',
          status: 'error',
          message: `Direct server upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        });
      }

      // Step 5: Server connectivity check
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          addResult({
            step: 'Server Connectivity',
            status: 'success',
            message: 'Server is reachable'
          });
        } else {
          addResult({
            step: 'Server Connectivity',
            status: 'warning',
            message: `Server responded with status: ${response.status}`
          });
        }
      } catch (error) {
        addResult({
          step: 'Server Connectivity',
          status: 'error',
          message: `Server connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Step 6: Environment check
      try {
        // Check if we're in the right environment
        const isDev = window.location.hostname === 'localhost';
        const isProduction = window.location.hostname.includes('vercel') || window.location.hostname.includes('supabase');
        
        addResult({
          step: 'Environment Check',
          status: 'info' as any,
          message: `Environment: ${isDev ? 'Development' : isProduction ? 'Production' : 'Unknown'}`,
          details: {
            hostname: window.location.hostname,
            origin: window.location.origin,
            isDev,
            isProduction
          }
        });
      } catch (error) {
        addResult({
          step: 'Environment Check',
          status: 'warning',
          message: `Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          ATS Upload Diagnostic
        </h1>
        <p className="text-gray-600">
          Test file upload functionality and identify any issues
        </p>
      </div>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            File Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90
                cursor-pointer"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
            />
            
            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Type: {selectedFile.type}
                </div>
              </div>
            )}

            <Button
              onClick={runDiagnostic}
              disabled={!selectedFile || isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Run Upload Diagnostic
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.step}</span>
                    </div>
                    <Badge className={getStatusBadge(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                  
                  {result.details && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-medium mb-1">Details</summary>
                      <pre className="bg-gray-100 rounded p-2 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {results.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Summary:</strong> {results.filter(r => r.status === 'success').length} successful, {' '}
            {results.filter(r => r.status === 'error').length} errors, {' '}
            {results.filter(r => r.status === 'warning').length} warnings
          </AlertDescription>
        </Alert>
      )}

      {/* Direct ATS Scanner Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test ATS Scanner Directly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              After running diagnostics, you can test the actual ATS scanner functionality:
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.href = '/?screen=functional-ats'}
                variant="outline"
              >
                Test Functional ATS Scanner
              </Button>
              <Button
                onClick={() => window.location.href = '/?screen=accuracy-first-ats'}
                variant="outline"
              >
                Test Accuracy-First ATS Scanner
              </Button>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Quick Access URLs:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Functional ATS Scanner: <code>/?screen=functional-ats</code></li>
                <li>• Accuracy-First Scanner: <code>/?screen=accuracy-first-ats</code></li>
                <li>• Upload Diagnostic: <code>/?diagnostic=ats</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





