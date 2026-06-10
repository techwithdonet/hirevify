import { projectId, publicAnonKey } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface ATSAnalysisResult {
  id: string;
  fileName: string;
  personalInfo: any;
  professionalSummary: string;
  skills: any;
  experience: any[];
  education: any[];
  atsScore: {
    overall: number;
    breakdown: any;
    recommendations: string[];
    strengths: string[];
    improvements: string[];
  };
  matchAnalysis: any;
  insights: any;
  processedAt: string;
}

export interface FileUploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export interface VideoSubmissionData {
  projectId: string;
  videoBlob: Blob;
  responses: QuestionResponse[];
  duration: number;
  timestamp: number;
}

export interface QuestionResponse {
  questionId: string;
  question: string;
  recordingStartTime: number;
  recordingEndTime: number;
  answered: boolean;
}

export interface ProjectChallengeVideoSubmission {
  id: string;
  projectId: string;
  candidateId: string;
  videoUrl: string;
  responses: QuestionResponse[];
  duration: number;
  submittedAt: number;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
}

export class FilesAPI {
  static async uploadFile(file: File, type: 'resume' | 'portfolio' | 'recording' | 'project_video', accessToken: string): Promise<FileUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload file')
    }

    return result
  }

  static async submitProjectChallengeVideo(submissionData: VideoSubmissionData, accessToken: string): Promise<ProjectChallengeVideoSubmission> {
    // First, upload the video file
    const videoFile = new File([submissionData.videoBlob], `project-${submissionData.projectId}-explanation.webm`, {
      type: 'video/webm'
    })

    const uploadResult = await this.uploadFile(videoFile, 'project_video', accessToken)

    // Then, submit the complete data
    const response = await fetch(`${API_BASE}/project-challenge-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        projectId: submissionData.projectId,
        videoUrl: uploadResult.fileUrl,
        responses: submissionData.responses,
        duration: submissionData.duration,
        timestamp: submissionData.timestamp
      })
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit project challenge video')
    }

    return result
  }

  static async getProjectChallengeVideos(projectId?: string, accessToken?: string): Promise<ProjectChallengeVideoSubmission[]> {
    const url = projectId 
      ? `${API_BASE}/project-challenge-videos?projectId=${projectId}`
      : `${API_BASE}/project-challenge-videos`

    const response = await fetch(url, {
      headers: accessToken ? {
        'Authorization': `Bearer ${accessToken}`
      } : {}
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get project challenge videos')
    }

    return result
  }

  static async getFile(type: string, path: string, accessToken: string): Promise<{ fileUrl: string }> {
    const response = await fetch(`${API_BASE}/files/${type}/${path}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get file')
    }

    return result
  }

  static async deleteFile(type: string, path: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/${type}/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete file')
    }
  }

  // ATS Processing Methods
  static async processResumeATS(
    file: File, 
    targetRole?: string, 
    targetIndustry?: string, 
    accessToken?: string
  ): Promise<ATSAnalysisResult> {
    console.log('🚀 FilesAPI.processResumeATS called with:', {
      fileName: file.name,
      fileSize: file.size,
      targetRole,
      targetIndustry,
      hasAccessToken: !!accessToken,
      tokenStart: accessToken?.substring(0, 20) + '...' || 'N/A'
    });
    
    if (!accessToken) {
      console.error('❌ No access token provided to processResumeATS');
      throw new Error('Authentication required. No access token provided.');
    }

    const formData = new FormData()
    formData.append('file', file)
    if (targetRole) formData.append('targetRole', targetRole)
    if (targetIndustry) formData.append('targetIndustry', targetIndustry)

    console.log('📤 Making ATS API request...');
    const response = await fetch(`${API_BASE}/ats/process-resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    })

    console.log('📥 ATS API response received:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    const result = await response.json()
    console.log('📊 ATS API result:', {
      hasResult: !!result,
      hasError: !!result.error,
      hasCode: !!result.code,
      hasMessage: !!result.message
    });
    
    if (!response.ok) {
      console.error('❌ ATS API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      
      // Enhanced error handling with specific guidance
      let errorMessage = 'Failed to process resume with ATS';
      let shouldRetryAuth = false;
      
      if (result.code === 401 || response.status === 401) {
        errorMessage = 'Authentication failed. Your session may have expired.';
        shouldRetryAuth = true;
        
        // Add specific guidance based on the error details
        if (result.details?.includes('Session not found')) {
          errorMessage += ' Please use the debug tools to fix authentication, or log out and log in again.';
        } else if (result.details?.includes('expired')) {
          errorMessage += ' Please log out and log in again to get a fresh session.';
        } else {
          errorMessage += ' Please try the authentication resolver in the debug tools.';
        }
      } else if (result.details) {
        errorMessage = `${result.error || 'ATS Error'}: ${result.details}`;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      }
      
      // Create enhanced error object with debugging info
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'ATSProcessingError';
      enhancedError.cause = {
        status: response.status,
        statusText: response.statusText,
        result,
        shouldRetryAuth,
        timestamp: new Date().toISOString()
      };
      
      throw enhancedError;
    }

    console.log('✅ ATS processing completed successfully');
    return result
  }

  static async bulkProcessResumes(
    files: File[], 
    jobDescription?: string,
    accessToken?: string
  ): Promise<ATSAnalysisResult[]> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file)
    })
    if (jobDescription) formData.append('jobDescription', jobDescription)

    const response = await fetch(`${API_BASE}/ats/bulk-process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`
      },
      body: formData
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to bulk process resumes')
    }

    return result
  }

  static async getATSHistory(accessToken: string): Promise<ATSAnalysisResult[]> {
    const response = await fetch(`${API_BASE}/ats/history`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get ATS history')
    }

    return result
  }
}




