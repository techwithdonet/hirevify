/**
 * Production File Storage for Enhanced ATS - Phase 1 Integration
 * Integrates with new AI enhancement systems
 */

import { enhancedOpenAIService } from '../ai/enhanced-openai-service';
import { ensembleOCRSystem } from './ensemble-ocr-system';
import { confidenceScoringSystem } from '../ai/confidence-scoring-system';
import { activeLearningPipeline } from '../ai/active-learning-pipeline';

import { createClient } from '../supabase/client';

interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  signedUrl?: string;
  filePath?: string;
  error?: string;
  isLocalProcessing?: boolean;
  metadata?: {
    size: number;
    type: string;
    name: string;
    uploadedAt: string;
  };
}

interface FileDownloadResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
  expiresIn?: number;
}

/**
 * Production File Storage Service
 */
class ProductionFileStorageService {
  private supabase = createClient();
  private bucketName = 'make-d4feca44-resumes';
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  /**
   * Initialize storage bucket (called on first use)
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      // Skip bucket creation on client side - buckets should be pre-created
      console.log('📁 Checking storage bucket availability:', this.bucketName);
      
      // Simply test if we can list files in the bucket
      // If bucket doesn't exist, the upload will fail gracefully
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      if (error && error.message.includes('not found')) {
        console.warn(`📁 Bucket ${this.bucketName} not found. Server will create it automatically on first upload.`);
        // Don't throw error - let the upload attempt handle bucket creation via server
      } else if (error) {
        console.warn('📁 Bucket check warning:', error.message);
        // Continue anyway - upload will show the real error
      } else {
        console.log('✅ Storage bucket is accessible');
      }
    } catch (error) {
      console.warn('📁 Bucket check failed, continuing with upload:', error);
      // Don't throw - let upload handle the error
    }
  }

  /**
   * Upload resume file to Supabase Storage
   */
  async uploadResumeFile(
    file: File,
    userId: string,
    candidateId?: string
  ): Promise<FileUploadResult> {
    try {
      console.log('📤 Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
        candidateId
      });

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // For ATS uploads, use the server-side endpoint which handles RLS properly
      try {
        console.log('🔄 Using server-side ATS upload endpoint...');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        if (candidateId) {
          formData.append('candidateId', candidateId);
        }

        // Try to get current session for auth
        const { data: { session } } = await this.supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch(`https://lfwfwnqoioqyxnbzlnje.supabase.co/functions/v1/make-server-d4feca44/files/ats-upload`, {
          method: 'POST',
          headers: {
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server upload failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Server-side upload successful:', result.filePath);
          return {
            success: true,
            filePath: result.filePath,
            signedUrl: result.signedUrl,
            metadata: result.metadata
          };
        } else {
          // Server indicated failure but wants local processing
          if (result.isLocalProcessing) {
            console.log('📋 Server upload failed, continuing with local processing...');
          } else {
            throw new Error(result.error || 'Server upload failed');
          }
        }
      } catch (serverError) {
        console.warn('Server-side upload failed, falling back to direct upload:', serverError);
      }

      // Fallback to direct client-side upload (original implementation)
      console.log('🔄 Falling back to direct client-side upload...');

      // Instead of direct upload, return success with local processing flag
      // This allows the ATS scanner to continue without file upload
      console.log('📋 Server upload failed, continuing with local file processing only');
      
      return {
        success: false,
        error: 'Upload failed but local processing will continue',
        isLocalProcessing: true,
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      // OLD CODE - removed to completely avoid RLS issues
      // Ensure bucket exists
      // await this.ensureBucketExists();

      // Generate unique file path
      // const timestamp = Date.now();
      // const fileExtension = this.getFileExtension(file.name);
      // const fileName = `${candidateId || userId}_${timestamp}${fileExtension}`;
      // const filePath = `resumes/${userId}/${fileName}`;

      // console.log('📂 Uploading to path:', filePath);

      // Upload file to Supabase Storage
      // const { data, error } = await this.supabase.storage
      //   .from(this.bucketName)
      //   .upload(filePath, file, {
      //     cacheControl: '3600',
      //     upsert: false,
      //     metadata: {
      //       userId,
      //       candidateId: candidateId || '',
      //       originalName: file.name,
      //       uploadedAt: new Date().toISOString()
      //     }
      //   });

      // if (error) {
      //   console.error('Upload error:', error);
      //   return {
      //     success: false,
      //     error: `Upload failed: ${error.message}`
      //   };
      // }

      // console.log('✅ File uploaded successfully:', data.path);

      // Generate signed URL for immediate access
      // const { data: signedUrlData, error: urlError } = await this.supabase.storage
      //   .from(this.bucketName)
      //   .createSignedUrl(data.path, 3600); // 1 hour expiry

      // const signedUrl = urlError ? undefined : signedUrlData.signedUrl;

      // return {
      //   success: true,
      //   filePath: data.path,
      //   signedUrl,
      //   metadata: {
      //     size: file.size,
      //     type: file.type,
      //     name: file.name,
      //     uploadedAt: new Date().toISOString()
      //   }
      // };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get signed URL for file access
   */
  async getFileUrl(filePath: string, expiresIn: number = 3600): Promise<FileDownloadResult> {
    try {
      console.log('🔗 Getting signed URL for:', filePath);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error getting signed URL:', error);
        return {
          success: false,
          error: `Failed to get file URL: ${error.message}`
        };
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresIn
      };

    } catch (error) {
      console.error('Error getting file URL:', error);
      return {
        success: false,
        error: `Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Download file as blob
   */
  async downloadFile(filePath: string): Promise<Blob | null> {
    try {
      console.log('📥 Downloading file:', filePath);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('File download error:', error);
      return null;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting file:', filePath);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      console.log('✅ File deleted successfully');
      return true;

    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * List files for a user
   */
  async listUserFiles(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(`resumes/${userId}/`, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Error listing files:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG`
      };
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: 'Invalid file name'
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  /**
   * Get human-readable file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const productionFileStorage = new ProductionFileStorageService();
export default productionFileStorage;
export type { FileUploadResult, FileDownloadResult };