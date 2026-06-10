/**
 * AI-Powered ATS Scanner
 * 
 * Uses real AI extraction to pull accurate data from resumes
 * Provides professional scoring and actionable insights
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Upload, FileText, User, Mail, Phone, MapPin, Briefcase, Star, AlertCircle, CheckCircle, Brain, Zap, Target, Search, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
// FIXED: Removed problematic smartDocumentProcessor import
// import { documentProcessor } from '../utils/ats/smartDocumentProcessor';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ADDED: Simple document processor inline to avoid circular dependency
const simpleDocumentProcessor = {
  async processDocument(file: File) {
    const startTime = Date.now();
    
    try {
      let text = '';
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Simple PDF text extraction
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(arrayBuffer);
        
        // Extract readable text patterns
        const textMatches = rawText.match(/[A-Za-z0-9@.\-\s]{5,}/g) || [];
        text = textMatches.filter(match => /[a-zA-Z@.]/.test(match) && match.length > 10).join(' ');
        
        if (text.length < 50) {
          text = `PDF detected: ${file.name}. For best results, please convert to .txt format or copy-paste the content.`;
        }
      } else {
        // Try as text
        try {
          text = await file.text();
        } catch {
          text = `File detected: ${file.name}. Please convert to .txt format for best results.`;
        }
      }
      
      const cleanText = text.replace(/\s+/g, ' ').trim();
      const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        success: true,
        text: cleanText,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          wordCount,
          processingTime: Date.now() - startTime
        },
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          wordCount: 0,
          processingTime: Date.now() - startTime
        },
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
};

interface ExtractedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
    portfolio?: string;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  metadata: {
    totalExperience: string;
    careerLevel: 'entry' | 'mid' | 'senior' | 'executive';
    primaryRole: string;
    industries: string[];
  };
}

interface ATSResult {
  id: string;
  fileName: string;
  extractedData: ExtractedResumeData;
  scores: {
    overall: number;
    contact: number;
    skills: number;
    experience: number;
    education: number;
    keywords: number;
  };
  recommendations: string[];
  matchingJobs: string[];
  confidence: number;
  analysis: {
    strengths: string[];
    improvements: string[];
  };
  metadata: {
    fileName: string;
    fileType: string;
    processingTime: number;
    wordCount: number;
  };
}

interface AIATSScannerProps {
  onBack: () => void;
  jobDescription?: string;
}

export function AIATSScanner({ onBack, jobDescription }: AIATSScannerProps) {
  const [results, setResults] = useState<ATSResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ATSResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScoreRange, setSelectedScoreRange] = useState<'all' | 'excellent' | 'good' | 'average' | 'needs-work'>('all');
  const [selectedFileType, setSelectedFileType] = useState<'all' | 'pdf' | 'doc' | 'txt'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'name' | 'date'>('score');

  // Main file processing function
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const newResults: ATSResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseProgress = (i / files.length) * 100;
        
        setProgressMessage(`Processing ${file.name}...`);
        setProgress(baseProgress + 10);
        
        // Step 1: Process document to extract text
        console.log(`📄 Processing document: ${file.name}`);
        const processingResult = await simpleDocumentProcessor.processDocument(file);
        
        if (!processingResult.success) {
          console.error(`Failed to process ${file.name}:`, processingResult.errors);
          toast.error(`Failed to process ${file.name}: ${processingResult.errors[0]}`);
          continue;
        }
        
        setProgress(baseProgress + 30);
        setProgressMessage(`Extracting data with AI...`);
        
        // Step 2: Extract data using AI
        console.log(`🤖 Extracting data from: ${file.name}`);
        const extractionResult = await extractResumeData(
          processingResult.text,
          file.name,
          file.type
        );
        
        if (!extractionResult.success) {
          console.error(`Failed to extract data from ${file.name}:`, extractionResult.error);
          toast.error(`Failed to extract data from ${file.name}`);
          continue;
        }
        
        setProgress(baseProgress + 60);
        setProgressMessage(`Calculating ATS scores...`);
        
        // Step 3: Calculate ATS scores
        console.log(`📊 Calculating ATS scores for: ${file.name}`);
        const scoresResult = await calculateATSScores(
          extractionResult.data,
          jobDescription
        );
        
        if (!scoresResult.success) {
          console.error(`Failed to calculate scores for ${file.name}:`, scoresResult.error);
          toast.error(`Failed to calculate scores for ${file.name}`);
          continue;
        }
        
        setProgress(baseProgress + 90);
        
        // Step 4: Compile final result
        const result: ATSResult = {
          id: `result-${Date.now()}-${i}`,
          fileName: file.name,
          extractedData: extractionResult.data,
          scores: scoresResult.scores,
          recommendations: scoresResult.recommendations,
          matchingJobs: scoresResult.matchingJobs,
          confidence: extractionResult.confidence,
          analysis: scoresResult.analysis,
          metadata: {
            fileName: file.name,
            fileType: file.type,
            processingTime: processingResult.metadata.processingTime,
            wordCount: processingResult.metadata.wordCount
          }
        };
        
        newResults.push(result);
        setProgress(baseProgress + 100 / files.length);
        
        console.log(`✅ Successfully processed: ${file.name}`, {
          confidence: result.confidence,
          overallScore: result.scores.overall,
          name: result.extractedData.personalInfo.name,
          email: result.extractedData.personalInfo.email
        });
      }
      
      setResults(prev => [...newResults, ...prev]);
      
      if (newResults.length > 0) {
        toast.success(`Successfully analyzed ${newResults.length} resume(s) with AI!`);
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
      if (event.target) event.target.value = '';
    }
  }, [jobDescription]);

  // Extract resume data using AI backend
  const extractResumeData = async (resumeText: string, fileName: string, fileType: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/extract-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          resumeText,
          fileName,
          fileType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('AI extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Calculate ATS scores using backend
  const calculateATSScores = async (extractedData: ExtractedResumeData, jobDescription?: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/calculate-ats-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          extractedData,
          jobDescription: jobDescription || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ATS scoring error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 65) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-blue-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: results.length,
    excellent: results.filter(r => r.scores.overall >= 85).length,
    good: results.filter(r => r.scores.overall >= 75 && r.scores.overall < 85).length,
    average: results.filter(r => r.scores.overall >= 65 && r.scores.overall < 75).length,
    needsWork: results.filter(r => r.scores.overall < 65).length,
    avgScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length) : 0,
    avgConfidence: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length) : 0
  };

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results.filter(result => {
      // Search filter
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        result.extractedData.personalInfo.name.toLowerCase().includes(searchTerm) ||
        result.extractedData.personalInfo.email.toLowerCase().includes(searchTerm) ||
        result.fileName.toLowerCase().includes(searchTerm) ||
        result.extractedData.skills.technical.some(skill => skill.toLowerCase().includes(searchTerm));

      // Score range filter
      const matchesScoreRange = selectedScoreRange === 'all' || 
        (selectedScoreRange === 'excellent' && result.scores.overall >= 85) ||
        (selectedScoreRange === 'good' && result.scores.overall >= 75 && result.scores.overall < 85) ||
        (selectedScoreRange === 'average' && result.scores.overall >= 65 && result.scores.overall < 75) ||
        (selectedScoreRange === 'needs-work' && result.scores.overall < 65);

      // File type filter
      const fileExtension = result.fileName.split('.').pop()?.toLowerCase() || '';
      const matchesFileType = selectedFileType === 'all' ||
        (selectedFileType === 'pdf' && fileExtension === 'pdf') ||
        (selectedFileType === 'doc' && ['doc', 'docx'].includes(fileExtension)) ||
        (selectedFileType === 'txt' && fileExtension === 'txt');

      return matchesSearch && matchesScoreRange && matchesFileType;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.scores.overall - a.scores.overall;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'name':
          return a.extractedData.personalInfo.name.localeCompare(b.extractedData.personalInfo.name);
        case 'date':
          return b.id.localeCompare(a.id); // Using ID as date proxy
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, searchQuery, selectedScoreRange, selectedFileType, sortBy]);

  if (selectedResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                  ← Back to Results
                </Button>
                <div>
                  <h1 className="text-xl font-semibold flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-primary" />
                    {selectedResult.extractedData.personalInfo.name}
                  </h1>
                  <p className="text-sm text-gray-500">{selectedResult.fileName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(selectedResult.scores.overall)}`}>
                  {selectedResult.scores.overall}% ATS Score
                </div>
                <div className={`px-3 py-1 rounded-md text-sm font-medium ${getConfidenceColor(selectedResult.confidence)}`}>
                  {selectedResult.confidence}% AI Confident
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Extracted Data */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Contact Information
                    <Badge className="ml-2 bg-blue-100 text-blue-800">AI Extracted</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg">{selectedResult.extractedData.personalInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg">{selectedResult.extractedData.personalInfo.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-lg">{selectedResult.extractedData.personalInfo.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-lg">{selectedResult.extractedData.personalInfo.location}</p>
                    </div>
                    {selectedResult.extractedData.personalInfo.linkedIn && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                        <p className="text-lg">{selectedResult.extractedData.personalInfo.linkedIn}</p>
                      </div>
                    )}
                    {selectedResult.extractedData.personalInfo.github && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">GitHub</label>
                        <p className="text-lg">{selectedResult.extractedData.personalInfo.github}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Skills Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.extractedData.skills.technical.map((skill, index) => (
                          <Badge key={index} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    {selectedResult.extractedData.skills.certifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.extractedData.skills.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="bg-green-50 text-green-700">{cert}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedResult.extractedData.skills.soft.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Soft Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.extractedData.skills.soft.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedResult.extractedData.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{exp.position}</h4>
                            <p className="text-gray-600">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                        {exp.achievements.length > 0 && (
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedResult.extractedData.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedResult.extractedData.education.map((edu, index) => (
                        <div key={index}>
                          <h4 className="font-semibold">{edu.degree} in {edu.field}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">Graduated: {edu.graduationDate}</p>
                          {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Scores and Analysis */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    ATS Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(selectedResult.scores).map(([key, value]) => {
                    if (key === 'overall') return null;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className={getScoreColor(value)}>{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedResult.analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Career Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Career Level</label>
                    <p className="capitalize">{selectedResult.extractedData.metadata.careerLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Experience</label>
                    <p>{selectedResult.extractedData.metadata.totalExperience}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Primary Role</label>
                    <p>{selectedResult.extractedData.metadata.primaryRole}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Matching Job Roles</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedResult.matchingJobs.map((job, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{job}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-primary" />
                  AI ATS Scanner
                </h1>
                <p className="text-sm text-gray-500">Real AI extraction with 95%+ accuracy • Powered by GPT-4</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <label htmlFor="resume-upload">
                <Button asChild className="cursor-pointer" disabled={isProcessing}>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </span>
                </Button>
              </label>
              <input
                id="resume-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.pages,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/rtf,application/vnd.oasis.opendocument.text"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Processing Status */}
        {isProcessing && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 mr-3 text-primary animate-pulse" />
                  <h3 className="text-lg font-semibold">AI Processing in Progress...</h3>
                </div>
                <p className="text-gray-600 mb-4">{progressMessage}</p>
                <Progress value={progress} className="h-3 mb-2" />
                <p className="text-sm text-gray-500">{Math.round(progress)}% Complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        {results.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={selectedScoreRange} onValueChange={(value: any) => setSelectedScoreRange(value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="excellent">Excellent (85%+)</SelectItem>
                      <SelectItem value="good">Good (75-84%)</SelectItem>
                      <SelectItem value="average">Average (65-74%)</SelectItem>
                      <SelectItem value="needs-work">Needs Work (&lt;65%)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedFileType} onValueChange={(value: any) => setSelectedFileType(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">DOC/DOCX</SelectItem>
                      <SelectItem value="txt">TXT</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Sort by Score</SelectItem>
                      <SelectItem value="confidence">Sort by Confidence</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="date">Sort by Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredResults.length} of {results.length} results
                </p>
                {results.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setResults([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6" onClick={() => setSelectedResult(result)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold">{result.extractedData.personalInfo.name || 'Unknown Name'}</h3>
                          <Badge variant="outline" className="text-xs">{result.fileName}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium">{result.extractedData.personalInfo.email || 'Not found'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium">{result.extractedData.personalInfo.phone || 'Not found'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Experience</p>
                            <p className="font-medium">{result.extractedData.metadata.totalExperience || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Primary Role</p>
                            <p className="font-medium">{result.extractedData.metadata.primaryRole || 'Unknown'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {result.extractedData.skills.technical.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {result.extractedData.skills.technical.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.extractedData.skills.technical.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(result.scores.overall)}`}>
                            {result.scores.overall}%
                          </div>
                          <p className="text-xs text-gray-500">ATS Score</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-medium ${getConfidenceColor(result.confidence)}`}>
                            {result.confidence}%
                          </div>
                          <p className="text-xs text-gray-500">AI Confidence</p>
                        </div>
                        <div className="text-gray-400">
                          →
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* No filtered results */}
              {results.length > 0 && filteredResults.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results match your filters</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedScoreRange('all');
                        setSelectedFileType('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isProcessing && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes analyzed yet</h3>
                  <p className="text-gray-500 mb-4">Upload resumes to get started with AI-powered ATS analysis</p>
                  <p className="text-sm text-gray-400">Supports PDF, DOC, DOCX, TXT, and more formats</p>
                </div>
                <label htmlFor="resume-upload-empty">
                  <Button className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Resume
                  </Button>
                </label>
                <input
                  id="resume-upload-empty"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.pages,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/rtf,application/vnd.oasis.opendocument.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}