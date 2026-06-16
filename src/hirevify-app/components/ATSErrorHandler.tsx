/**
 * ATS Error Handler Component
 * 
 * Provides user-friendly error messages and helpful suggestions
 * for ATS scanning errors.
 */

import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  FileText, 
  Upload, 
  ExternalLink, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface ATSErrorHandlerProps {
  error: string;
  fileName?: string;
  fileType?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export function ATSErrorHandler({ 
  error, 
  fileName, 
  fileType, 
  onRetry, 
  onClear 
}: ATSErrorHandlerProps) {
  
  // Analyze error type and provide specific guidance
  const getErrorInfo = (errorMessage: string) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('pdf')) {
      return {
        type: 'PDF Processing Error',
        severity: 'warning' as const,
        icon: <FileText className="w-5 h-5" />,
        suggestions: [
          'Convert your PDF to a .txt file using any PDF reader',
          'Copy and paste the content from PDF into a new .txt file',
          'Try the Professional ATS Scanner for advanced PDF processing',
          'Ensure your PDF contains selectable text (not just images)'
        ],
        quickFix: 'Use File ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â€š¬Ã‚ Ãƒ¢Ã¢â€š¬Ã¢â€ž¢ Save As ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â€š¬Ã‚ Ãƒ¢Ã¢â€š¬Ã¢â€ž¢ Plain Text (.txt) in your PDF reader'
      };
    }
    
    if (message.includes('word') || message.includes('doc')) {
      return {
        type: 'Word Document Error',
        severity: 'warning' as const,
        icon: <FileText className="w-5 h-5" />,
        suggestions: [
          'Save your Word document as a .txt file',
          'Copy and paste the content into a new .txt file',
          'Try the Professional ATS Scanner for advanced Word processing',
          'Ensure the document is not password protected'
        ],
        quickFix: 'In Word: File ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â€š¬Ã‚ Ãƒ¢Ã¢â€š¬Ã¢â€ž¢ Save As ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â€š¬Ã‚ Ãƒ¢Ã¢â€š¬Ã¢â€ž¢ Plain Text (*.txt)'
      };
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        type: 'Processing Timeout',
        severity: 'error' as const,
        icon: <AlertTriangle className="w-5 h-5" />,
        suggestions: [
          'Try uploading a smaller file (under 5MB)',
          'Check your internet connection',
          'Refresh the page and try again',
          'Convert to .txt format for faster processing'
        ],
        quickFix: 'Reduce file size or convert to .txt format'
      };
    }
    
    if (message.includes('binary') || message.includes('format')) {
      return {
        type: 'File Format Error',
        severity: 'error' as const,
        icon: <XCircle className="w-5 h-5" />,
        suggestions: [
          'Upload files in .txt, .pdf, or .docx format',
          'Convert your file to plain text (.txt)',
          'Ensure the file is not corrupted',
          'Try the Professional ATS Scanner for more format support'
        ],
        quickFix: 'Convert to .txt format for best compatibility'
      };
    }
    
    if (message.includes('empty') || message.includes('insufficient')) {
      return {
        type: 'Content Error',
        severity: 'warning' as const,
        icon: <AlertTriangle className="w-5 h-5" />,
        suggestions: [
          'Ensure your resume contains sufficient text content',
          'Check that the file is not empty or corrupted',
          'Make sure the resume includes standard sections (experience, education, etc.)',
          'Try copying content into a new .txt file'
        ],
        quickFix: 'Verify the file contains your resume content'
      };
    }
    
    // Default error info
    return {
      type: 'Processing Error',
      severity: 'error' as const,
      icon: <XCircle className="w-5 h-5" />,
      suggestions: [
        'Try uploading the file in .txt format',
        'Ensure the file is not corrupted',
        'Check that the file contains resume content',
        'Try the Professional ATS Scanner for advanced processing'
      ],
      quickFix: 'Convert to .txt format and try again'
    };
  };

  const errorInfo = getErrorInfo(error);
  
  return (
    <div className="space-y-6">
      {/* Main Error Alert */}
      <Alert variant={errorInfo.severity === 'error' ? 'destructive' : 'default'}>
        <div className="flex items-start gap-3">
          {errorInfo.icon}
          <div className="flex-1">
            <h4 className="font-medium mb-1">{errorInfo.type}</h4>
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* File Information */}
      {fileName && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File Name:</span>
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            {fileType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Type:</span>
                <Badge variant="outline">{fileType || 'Unknown'}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Fix */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Lightbulb className="w-4 h-4" />
            Quick Fix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-primary">
            {errorInfo.quickFix}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            How to Fix This
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorInfo.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Supported File Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium text-sm">Text Files</p>
              <p className="text-xs text-gray-600">.txt (Recommended)</p>
              <Badge className="mt-1 bg-green-100 text-green-800 border-green-200">
                Best Support
              </Badge>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-medium text-sm">PDF Files</p>
              <p className="text-xs text-gray-600">.pdf</p>
              <Badge className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                Basic Support
              </Badge>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium text-sm">Word Documents</p>
              <p className="text-xs text-gray-600">.doc, .docx</p>
              <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-200">
                Limited Support
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="flex-1">
            <ArrowRight className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        <Button variant="outline" className="flex-1" asChild>
          <a href="?screen=professional-ats">
            <ExternalLink className="w-4 h-4 mr-2" />
            Use Professional ATS Scanner
          </a>
        </Button>
        
        {onClear && (
          <Button variant="outline" onClick={onClear}>
            Upload Different File
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          ÃƒÆ’Ã‚°Ãƒâ€¦Ã‚¸Ãƒ¢Ã¢â€š¬Ã¢â€ž¢Ãƒâ€šÃ‚¡ <strong>Pro Tip:</strong> For best results, save your resume as a .txt file. 
          This ensures 100% compatibility and fastest processing.
        </p>
      </div>
    </div>
  );
}








