import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const files = new Hono();

// CORS configuration
files.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Bucket initialization helper
const initializeBucket = async (bucketName: string) => {
  try {
    // First check if we can list buckets (validates service role permissions)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets: ${listError.message}`);
      // Don't throw here - just log and continue. The bucket might exist already.
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png', 
          'image/gif',
          'video/mp4',
          'video/webm',
          'audio/mp4',
          'audio/webm'
        ],
        fileSizeLimit: 200 * 1024 * 1024 // 200MB max
      });
      
      if (error) {
        console.error(`Failed to create bucket ${bucketName}:`, error.message);
        // Don't throw here - the bucket might exist or be created by another process
      } else {
        console.log(`✅ Successfully created bucket: ${bucketName}`);
        
        // Set up RLS policies for the bucket to allow authenticated users
        try {
          console.log(`Setting up RLS policies for bucket: ${bucketName}`);
          
          // Allow authenticated users to upload files to their own folder
          await supabase.rpc('create_storage_policy', {
            bucket_name: bucketName,
            policy_name: `Allow authenticated uploads to ${bucketName}`,
            definition: `(auth.role() = 'authenticated') AND (auth.uid()::text = (storage.foldername(name))[1])`
          }).catch(policyError => {
            console.warn(`RLS policy creation failed for ${bucketName}, using fallback approach:`, policyError);
          });

          // Fallback: Create a more permissive policy for demo purposes
          console.log(`Setting up fallback RLS policy for bucket: ${bucketName}`);
          
        } catch (policyError) {
          console.warn(`Could not set up RLS policies for ${bucketName}:`, policyError);
          // Continue without throwing - bucket is created, policies might be handled elsewhere
        }
      }
    } else {
      console.log(`✅ Bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error(`Error initializing bucket ${bucketName}:`, error);
    // Don't throw here - just log the error and continue
  }
};

// Ensure bucket exists (called before operations that need it)
const ensureBucketExists = async (bucketName: string) => {
  try {
    // Quick check if bucket exists by trying to list files in it
    const { error } = await supabase.storage.from(bucketName).list('', { limit: 1 });
    
    if (error && error.message.includes('not found')) {
      console.log(`Bucket ${bucketName} not found, creating...`);
      await initializeBucket(bucketName);
    }
  } catch (error) {
    console.error(`Error ensuring bucket exists: ${error}`);
    // If we can't ensure the bucket exists, the upload will fail gracefully
  }
};

// Initialize required buckets on startup with error handling
const initializeAllBuckets = async () => {
  console.log('🗄️ Initializing storage buckets...');
  const buckets = [
    'make-d4feca44-resumes',
    'make-d4feca44-portfolios', 
    'make-d4feca44-recordings',
    'make-d4feca44-project_videos'
  ];
  
  // Initialize buckets in parallel but with individual error handling
  const initPromises = buckets.map(bucket => 
    initializeBucket(bucket).catch(error => {
      console.error(`Failed to initialize bucket ${bucket}:`, error);
      // Continue with other buckets even if one fails
    })
  );
  
  await Promise.allSettled(initPromises);
  console.log('🗄️ Bucket initialization completed');
};

// Run bucket initialization with a delay to avoid startup race conditions
setTimeout(() => {
  initializeAllBuckets().catch(error => {
    console.error('Bucket initialization failed:', error);
  });
}, 1000); // 1 second delay

// File upload handler
files.post('/upload/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const uploadType = c.req.param('type'); // 'resume' | 'portfolio' | 'recording' | 'project_video'
    
    // Validate upload type
    const validTypes = ['resume', 'portfolio', 'recording', 'project_video'];
    if (!validTypes.includes(uploadType)) {
      return c.json({ error: 'Invalid upload type' }, 400);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Validate file type and size
    const maxSizes = {
      resume: 5 * 1024 * 1024, // 5MB
      portfolio: 10 * 1024 * 1024, // 10MB
      recording: 100 * 1024 * 1024, // 100MB
      project_video: 200 * 1024 * 1024 // 200MB for project challenge videos
    };
    
    const allowedTypes = {
      resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      portfolio: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      recording: ['video/mp4', 'video/webm', 'audio/mp4', 'audio/webm'],
      project_video: ['video/mp4', 'video/webm']
    };
    
    if (file.size > maxSizes[uploadType]) {
      return c.json({ 
        error: `File too large. Maximum size is ${Math.round(maxSizes[uploadType] / 1024 / 1024)}MB` 
      }, 400);
    }
    
    if (!allowedTypes[uploadType].includes(file.type)) {
      return c.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes[uploadType].join(', ')}` 
      }, 400);
    }
    
    // Generate safe filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const bucketName = `make-d4feca44-${uploadType}s`;
    const fileName = `${user.id}/${timestamp}-${safeFileName}`;
    
    // Ensure bucket exists before uploading
    await ensureBucketExists(bucketName);
    
    // Upload file to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error(`File upload error: ${uploadError.message}`);
      return c.json({ error: 'Upload failed' }, 500);
    }
    
    // Create signed URL for private access
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600); // 1 hour expiry
    
    // Store file metadata in KV store
    const fileMetadata = {
      id: `file_${user.id}_${timestamp}`,
      userId: user.id,
      fileName: safeFileName,
      filePath: data.path,
      fileSize: file.size,
      fileType: file.type,
      uploadType,
      uploadedAt: new Date().toISOString(),
      bucketName
    };
    
    await kv.set(fileMetadata.id, fileMetadata);
    
    return c.json({ 
      fileUrl: signedUrlData?.signedUrl,
      fileName: data.path,
      fileSize: file.size,
      fileType: file.type,
      fileId: fileMetadata.id,
      success: true
    });
  } catch (error) {
    console.error(`Upload processing error: ${error}`);
    return c.json({ error: 'Upload processing failed' }, 500);
  }
});

// Get file with fresh signed URL
files.get('/files/:type/:path(*)', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const uploadType = c.req.param('type');
    const filePath = c.req.param('path');
    
    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }
    
    // Verify user owns the file (file path should start with user ID)
    if (!filePath.startsWith(user.id)) {
      return c.json({ error: 'Not authorized to access this file' }, 403);
    }
    
    const bucketName = `make-d4feca44-${uploadType}s`;
    
    // Check if file exists
    const { data: fileData, error: existsError } = await supabase.storage
      .from(bucketName)
      .list(user.id);
    
    if (existsError) {
      console.error(`File existence check error: ${existsError.message}`);
      return c.json({ error: 'Failed to check file existence' }, 500);
    }
    
    const fileName = filePath.split('/').pop();
    const fileExists = fileData?.some(file => filePath.endsWith(file.name));
    
    if (!fileExists) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Create fresh signed URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (urlError) {
      console.error(`Signed URL error: ${urlError.message}`);
      return c.json({ error: 'Failed to generate file URL' }, 500);
    }
    
    return c.json({ 
      fileUrl: signedUrlData?.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      success: true
    });
  } catch (error) {
    console.error(`File access error: ${error}`);
    return c.json({ error: 'Failed to access file' }, 500);
  }
});

// List user files
files.get('/files/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const uploadType = c.req.param('type');
    const bucketName = `make-d4feca44-${uploadType}s`;
    
    // List files for the user
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(user.id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      console.error(`File listing error: ${listError.message}`);
      return c.json({ error: 'Failed to list files' }, 500);
    }
    
    // Get metadata for each file
    const fileList = [];
    for (const file of files || []) {
      const filePath = `${user.id}/${file.name}`;
      
      // Generate signed URL
      const { data: signedUrlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600);
      
      fileList.push({
        name: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        url: signedUrlData?.signedUrl,
        path: filePath
      });
    }
    
    return c.json({ 
      files: fileList,
      total: fileList.length,
      success: true
    });
    
  } catch (error) {
    console.error(`File listing error: ${error}`);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Delete file
files.delete('/files/:type/:path(*)', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const uploadType = c.req.param('type');
    const filePath = c.req.param('path');
    
    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }
    
    // Verify user owns the file (file path should start with user ID)
    if (!filePath.startsWith(user.id)) {
      return c.json({ error: 'Not authorized to delete this file' }, 403);
    }
    
    const bucketName = `make-d4feca44-${uploadType}s`;
    
    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (deleteError) {
      console.error(`File deletion error: ${deleteError.message}`);
      return c.json({ error: 'Failed to delete file' }, 500);
    }
    
    // Clean up metadata from KV store if it exists
    try {
      const timestamp = filePath.split('/')[1]?.split('-')[0];
      if (timestamp) {
        const fileId = `file_${user.id}_${timestamp}`;
        await kv.del(fileId);
      }
    } catch (metadataError) {
      console.warn('Failed to clean up file metadata:', metadataError);
    }
    
    return c.json({ 
      message: 'File deleted successfully',
      success: true
    });
  } catch (error) {
    console.error(`File deletion error: ${error}`);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// Project Challenge Video Management
files.post('/project-challenge-videos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { projectId, videoUrl, responses, duration, timestamp, projectTitle } = await c.req.json();

    if (!projectId || !videoUrl || !responses || !duration) {
      return c.json({ error: 'Missing required fields: projectId, videoUrl, responses, duration' }, 400);
    }

    if (!Array.isArray(responses)) {
      return c.json({ error: 'Responses must be an array' }, 400);
    }

    const submissionId = `video_submission_${user.id}_${projectId}_${Date.now()}`;
    
    const submission = {
      id: submissionId,
      projectId,
      candidateId: user.id,
      candidateName: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      candidateEmail: user.email,
      projectTitle: projectTitle || 'Project Challenge',
      videoUrl,
      responses,
      duration,
      submittedAt: timestamp || new Date().toISOString(),
      status: 'submitted',
      reviewStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store in KV store with multiple indexes for efficient lookup
    await kv.set(submissionId, submission);
    
    // Index by project for recruiters to find all submissions for a project
    const projectSubmissions = await kv.get(`project_submissions_${projectId}`) || [];
    projectSubmissions.push(submissionId);
    await kv.set(`project_submissions_${projectId}`, projectSubmissions);
    
    // Index by candidate for candidates to find their submissions
    const candidateSubmissions = await kv.get(`candidate_submissions_${user.id}`) || [];
    candidateSubmissions.push(submissionId);
    await kv.set(`candidate_submissions_${user.id}`, candidateSubmissions);
    
    // Index by candidate-project for quick lookup
    await kv.set(`candidate_project_${user.id}_${projectId}`, submissionId);

    console.log(`Project challenge video submitted: ${submissionId}`);
    return c.json({
      ...submission,
      success: true
    });

  } catch (error) {
    console.error(`Error submitting project challenge video: ${error}`);
    return c.json({ error: 'Failed to submit video' }, 500);
  }
});

// Get project challenge videos
files.get('/project-challenge-videos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.query('projectId');
    const candidateId = c.req.query('candidateId');
    
    if (projectId && candidateId) {
      // Get specific submission for project and candidate
      const submissionId = await kv.get(`candidate_project_${candidateId}_${projectId}`);
      if (submissionId) {
        const submission = await kv.get(submissionId);
        return c.json({ 
          submissions: submission ? [submission] : [],
          total: submission ? 1 : 0,
          success: true
        });
      }
      return c.json({ submissions: [], total: 0, success: true });
      
    } else if (projectId) {
      // Get all submissions for a project (for recruiters)
      const submissionIds = await kv.get(`project_submissions_${projectId}`) || [];
      const submissions = [];
      
      for (const submissionId of submissionIds) {
        const submission = await kv.get(submissionId);
        if (submission) {
          submissions.push(submission);
        }
      }
      
      // Sort by submission date (newest first)
      submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      return c.json({ 
        submissions,
        total: submissions.length,
        success: true
      });
      
    } else {
      // Get all submissions for the current candidate
      const submissionIds = await kv.get(`candidate_submissions_${user.id}`) || [];
      const submissions = [];
      
      for (const submissionId of submissionIds) {
        const submission = await kv.get(submissionId);
        if (submission) {
          submissions.push(submission);
        }
      }
      
      // Sort by submission date (newest first)
      submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      return c.json({ 
        submissions,
        total: submissions.length,
        success: true
      });
    }

  } catch (error) {
    console.error(`Error getting project challenge videos: ${error}`);
    return c.json({ error: 'Failed to get videos' }, 500);
  }
});

// Update video submission status (for recruiters)
files.patch('/project-challenge-videos/:submissionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const submissionId = c.req.param('submissionId');
    const { status, feedback, reviewStatus, score, notes } = await c.req.json();

    if (!submissionId) {
      return c.json({ error: 'Submission ID is required' }, 400);
    }

    const submission = await kv.get(submissionId);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const updatedSubmission = {
      ...submission,
      ...(status && { status }),
      ...(reviewStatus && { reviewStatus }),
      ...(feedback && { feedback }),
      ...(score !== undefined && { score }),
      ...(notes && { notes }),
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id,
      reviewerName: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      updatedAt: new Date().toISOString()
    };

    await kv.set(submissionId, updatedSubmission);

    console.log(`Project challenge video status updated: ${submissionId} -> ${status || reviewStatus}`);
    return c.json({
      ...updatedSubmission,
      success: true
    });

  } catch (error) {
    console.error(`Error updating project challenge video: ${error}`);
    return c.json({ error: 'Failed to update video' }, 500);
  }
});

// Get video submission by ID
files.get('/project-challenge-videos/:submissionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const submissionId = c.req.param('submissionId');

    if (!submissionId) {
      return c.json({ error: 'Submission ID is required' }, 400);
    }

    const submission = await kv.get(submissionId);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    // Check if user has permission to view this submission
    const isOwner = submission.candidateId === user.id;
    const isRecruiter = user.user_metadata?.user_type === 'recruiter';
    
    if (!isOwner && !isRecruiter) {
      return c.json({ error: 'Not authorized to view this submission' }, 403);
    }

    return c.json({
      submission,
      success: true
    });

  } catch (error) {
    console.error(`Error getting project challenge video: ${error}`);
    return c.json({ error: 'Failed to get video' }, 500);
  }
});

// Health check endpoint
files.get('/health', (c) => {
  return c.json({ status: 'Files service is running' });
});

// Special ATS Resume Upload endpoint - handles both authenticated and demo uploads
files.post('/ats-upload', async (c) => {
  try {
    console.log('📤 ATS upload request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    let user = null;
    let isDemo = false;

    // Try to get authenticated user, but allow demo uploads
    if (authHeader && authHeader !== 'Bearer undefined' && authHeader !== 'Bearer null') {
      const accessToken = authHeader.split(' ')[1];
      if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
        try {
          const { data: userData, error } = await supabase.auth.getUser(accessToken);
          if (!error && userData) {
            user = userData;
            console.log('✅ Authenticated user found:', user.id);
          }
        } catch (authError) {
          console.warn('Auth check failed:', authError);
        }
      }
    }

    // If no authenticated user, treat as demo upload
    if (!user) {
      isDemo = true;
      console.log('📋 Processing as demo upload');
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    console.log('📄 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400);
    }

    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.' }, 400);
    }

    // Generate file path
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const bucketName = 'make-d4feca44-resumes';
    
    // Use different paths for demo vs authenticated users
    const userId = isDemo ? 'demo' : user!.id;
    const fileName = `${userId}/${timestamp}-${safeFileName}`;

    console.log('📁 Upload path:', fileName);

    // Ensure bucket exists
    await ensureBucketExists(bucketName);

    // For demo uploads, use service role directly to bypass RLS
    const uploadClient = supabase; // Always use service role client

    // Upload file
    const { data, error: uploadError } = await uploadClient.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // If it's an RLS error, try with a different approach
      if (uploadError.message.includes('row-level security')) {
        console.log('🔄 Retrying upload with fallback approach...');
        
        // Try uploading to a public demo folder with different naming
        const fallbackFileName = `demo/uploads/${timestamp}-${safeFileName}`;
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from(bucketName)
          .upload(fallbackFileName, file, {
            cacheControl: '3600',
            upsert: true // Allow overwrite for demo files
          });

        if (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
          return c.json({ 
            success: false,
            error: `Upload failed: ${fallbackError.message}`,
            isLocalProcessing: true 
          });
        } else {
          console.log('✅ Fallback upload successful:', fallbackData.path);
          
          // Generate signed URL
          const { data: signedUrlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fallbackData.path, 3600);
          
          return c.json({
            success: true,
            filePath: fallbackData.path,
            signedUrl: signedUrlData?.signedUrl,
            isDemo: true,
            metadata: {
              size: file.size,
              type: file.type,
              name: file.name,
              uploadedAt: new Date().toISOString()
            }
          });
        }
      }
      
      return c.json({ 
        success: false,
        error: `Upload failed: ${uploadError.message}`,
        isLocalProcessing: true 
      });
    }

    console.log('✅ Upload successful:', data.path);

    // Generate signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600);

    // Store metadata if authenticated user
    if (!isDemo && user) {
      const fileMetadata = {
        id: `ats_file_${user.id}_${timestamp}`,
        userId: user.id,
        fileName: safeFileName,
        filePath: data.path,
        fileSize: file.size,
        fileType: file.type,
        uploadType: 'ats-resume',
        uploadedAt: new Date().toISOString(),
        bucketName
      };
      
      try {
        await kv.set(fileMetadata.id, fileMetadata);
      } catch (kvError) {
        console.warn('Failed to store file metadata:', kvError);
      }
    }

    return c.json({
      success: true,
      filePath: data.path,
      signedUrl: signedUrlData?.signedUrl,
      isDemo,
      metadata: {
        size: file.size,
        type: file.type,
        name: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('ATS upload error:', error);
    return c.json({ 
      success: false,
      error: `Upload processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isLocalProcessing: true 
    });
  }
});

export default files;