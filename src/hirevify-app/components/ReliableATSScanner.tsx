/**
 * Reliable ATS Scanner - Simple, Fast, and Effective
 * 
 * This component focuses on delivering consistent results with real resumes.
 * It uses a simplified parsing approach that prioritizes reliability over complexity.
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Upload, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Award,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Zap,
  Download,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { ReliableDocumentParser, type ReliableResumeData } from '../utils/ats/reliableDocumentParser';

interface ReliableATSScannerProps {
  onBack?: () => void;
  userType?: 'recruiter' | 'candidate';
}

interface ScanResult {
  fileName: string;
  data: ReliableResumeData;
  processingTime: number;
  rawText: string;
}

export function ReliableATSScanner({ onBack, userType = 'candidate' }: ReliableATSScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple file validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setScanResult(null);
    
    toast.success(`File "${file.name}" ready for processing`);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processResume = async () => {
    if (!uploadedFile) {
      setError('Please select a file to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    const startTime = Date.now();

    try {
      console.log('Starting resume processing for:', uploadedFile.name);
      
      // Show progress - File validation
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize parser
      setProgress(20);
      const parser = new ReliableDocumentParser();
      
      // Parse document
      setProgress(30);
      console.log('Parsing document...');
      const result = await parser.parseDocument(uploadedFile);
      
      setProgress(70);
      console.log('Document parsed successfully');

      // Get raw text for display (optional, don't fail if this doesn't work)
      setProgress(80);
      let rawText = 'Raw text preview not available';
      try {
        const reader = new FileReader();
        rawText = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('Timeout'));
          }, 5000);
          
          reader.onload = (e) => {
            clearTimeout(timeout);
            resolve(e.target?.result as string || '');
          };
          reader.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to read file'));
          };
          reader.readAsText(uploadedFile);
        });
      } catch (rawTextError) {
        console.warn('Could not get raw text preview:', rawTextError);
        // Don't fail the whole process for this
      }

      const processingTime = Date.now() - startTime;

      const scanResult = {
        fileName: uploadedFile.name,
        data: result,
        processingTime,
        rawText
      };

      setScanResult(scanResult);
      setProgress(100);
      
      console.log('Resume processing completed in', processingTime, 'ms');
      toast.success(`Resume processed successfully in ${processingTime}ms!`);
      
    } catch (error: any) {
      console.error('Resume processing error:', error);
      
      let errorMessage = error.message || 'Failed to process resume';
      
      // Provide more helpful error messages
      if (errorMessage.includes('binary data')) {
        errorMessage = 'This file format is not supported. Please save your resume as a .txt file and try again.';
      } else if (errorMessage.includes('insufficient')) {
        errorMessage = 'The file appears to be empty or contains very little text. Please check that your resume has content.';
      } else if (errorMessage.includes('corrupted')) {
        errorMessage = 'The file appears to be corrupted. Please try saving your resume as a .txt file.';
      } else if (errorMessage.includes('size')) {
        errorMessage = 'File is too large. Please try with a smaller file (under 10MB).';
      }
      
      setError(errorMessage);
      toast.error('Processing failed', {
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setScanResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResults = () => {
    if (!scanResult) return;

    const results = {
      fileName: scanResult.fileName,
      processingTime: scanResult.processingTime,
      extractedData: scanResult.data,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-scan-${scanResult.fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  aria-label="Back to dashboard"
                  className="mt-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
                  <Target className="h-6 w-6 text-emerald-600" />
                  {userType === 'recruiter' ? 'Recruiter ATS Scanner' : 'Resume ATS Scanner'}
                </CardTitle>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Upload a real resume to extract structured data, inspect confidence, and export the scan results.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50 sm:p-8"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
            <p className="text-lg font-medium mb-2">
              {uploadedFile ? uploadedFile.name : 'Drop your resume here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Best with .TXT files. Also tries .PDF, .DOC, and .DOCX. Max 10MB.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              For best results, copy your resume text and save it as a .txt file.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              
              {uploadedFile && (
                <Button
                  onClick={processResume}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Scan Resume
                    </>
                  )}
                </Button>
              )}
              
              {(uploadedFile || scanResult) && (
                <Button
                  onClick={reset}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Processing resume... {progress}%
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {scanResult && (
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Extraction Results
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getConfidenceBadge(scanResult.data.extractionMetadata.confidence)}>
                  {scanResult.data.extractionMetadata.confidence}% Confidence
                </Badge>
                <Button onClick={downloadResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Processed in {scanResult.processingTime}ms using {scanResult.data.extractionMetadata.processingMethod}.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Name:</span>
                      <span>{scanResult.data.personalInfo.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(scanResult.data.personalInfo.name)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{scanResult.data.personalInfo.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(scanResult.data.personalInfo.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{scanResult.data.personalInfo.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(scanResult.data.personalInfo.phone)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{scanResult.data.personalInfo.location}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {scanResult.data.personalInfo.Link && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Link:</span>
                        <span className="text-blue-600">{scanResult.data.personalInfo.Link}</span>
                      </div>
                    )}
                    
                    {scanResult.data.personalInfo.GitBranch && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">GitBranch:</span>
                        <span className="text-blue-600">{scanResult.data.personalInfo.GitBranch}</span>
                      </div>
                    )}
                    
                    {scanResult.data.personalInfo.portfolio && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Portfolio:</span>
                        <span className="text-blue-600">{scanResult.data.personalInfo.portfolio}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {scanResult.data.professionalSummary !== 'Professional summary not found' && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Professional Summary</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {scanResult.data.professionalSummary}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                {scanResult.data.experience.length > 0 ? (
                  scanResult.data.experience.map((exp, index) => (
                    <Card key={exp.id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{exp.position}</h4>
                            <p className="text-muted-foreground">{exp.company}</p>
                          </div>
                          <Badge variant="outline">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </Badge>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No work experience found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                {scanResult.data.education.length > 0 ? (
                  scanResult.data.education.map((edu, index) => (
                    <Card key={edu.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{edu.degree}</h4>
                            <p className="text-muted-foreground">{edu.institution}</p>
                          </div>
                          {edu.graduationDate && (
                            <Badge variant="outline">{edu.graduationDate}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No education information found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.data.skills.technical.length > 0 ? (
                        scanResult.data.skills.technical.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None found</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.data.skills.soft.length > 0 ? (
                        scanResult.data.skills.soft.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None found</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Tools & Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.data.skills.tools.length > 0 ? (
                        scanResult.data.skills.tools.map((tool, index) => (
                          <Badge key={index} variant="secondary">{tool}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None found</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.data.skills.languages.length > 0 ? (
                        scanResult.data.skills.languages.map((language, index) => (
                          <Badge key={index} variant="outline">{language}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None found</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Tips Section */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>Best format:</strong> Copy your resume content and save it as a .txt file.</li>
            <li><strong>File size:</strong> Keep files under 10MB for optimal performance.</li>
            <li><strong>Structure:</strong> Use clear section headers such as Experience, Education, and Skills.</li>
            <li><strong>Dates:</strong> Include years in YYYY format, for example 2020-2023.</li>
            <li><strong>Contact info:</strong> Include email, phone, and location clearly.</li>
            <li><strong>Having issues?</strong> Try the Professional ATS Scanner for advanced file support.</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}








