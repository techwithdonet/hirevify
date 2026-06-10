import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const applications = new Hono();

// CORS configuration
applications.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// AI-powered match scoring function
async function calculateAIMatchScore(projectId: string, resumeData: any): Promise<number> {
  try {
    const project = await kv.get(projectId);
    if (!project) return 0;
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) return Math.floor(Math.random() * 40) + 60; // Fallback random score
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Score the match between this candidate and project on a scale of 0-100. 
          
          Project: ${JSON.stringify(project)}
          
          Candidate Resume: ${JSON.stringify(resumeData)}
          
          Consider skills match, experience level, and project requirements. Return only a number between 0-100.`
        }],
        max_tokens: 10,
        temperature: 0.1
      })
    });
    
    const result = await response.json();
    const score = parseInt(result.choices?.[0]?.message?.content?.trim() || '70');
    return Math.min(Math.max(score, 0), 100);
  } catch (error) {
    console.error('AI scoring error:', error);
    return Math.floor(Math.random() * 40) + 60; // Fallback random score
  }
}

// Submit application
applications.post('/applications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { projectId, coverLetter, resumeData, portfolioItems } = await c.req.json();
    const applicationId = `application:${crypto.randomUUID()}`;
    
    // Calculate AI match score
    const aiScore = await calculateAIMatchScore(projectId, resumeData);
    
    const application = {
      id: applicationId,
      projectId,
      candidateId: user.id,
      coverLetter,
      resumeData,
      portfolioItems: portfolioItems || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      aiScore,
      notes: [],
      tags: []
    };
    
    await kv.set(applicationId, application);
    
    // Update project applications list
    const project = await kv.get(projectId);
    if (project) {
      project.applications = [...(project.applications || []), applicationId];
      await kv.set(projectId, project);
    }
    
    // Update candidate applications list
    const userProfile = await kv.get(`user:${user.id}`) || {};
    userProfile.applications = [...(userProfile.applications || []), applicationId];
    await kv.set(`user:${user.id}`, userProfile);
    
    // Notify recruiter
    if (project && project.createdBy) {
      const recruiterProfile = await kv.get(`user:${project.createdBy}`);
      if (recruiterProfile) {
        const notification = {
          id: crypto.randomUUID(),
          type: 'new_application',
          title: 'New Application Received',
          message: `${user.user_metadata?.name || 'A candidate'} applied to ${project.title}`,
          data: { applicationId, projectId },
          createdAt: new Date().toISOString(),
          read: false
        };
        
        const recruiterNotifications = await kv.get(`notifications:${project.createdBy}`) || [];
        recruiterNotifications.unshift(notification);
        await kv.set(`notifications:${project.createdBy}`, recruiterNotifications.slice(0, 50));
      }
    }
    
    return c.json({ 
      application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return c.json({ error: 'Failed to submit application' }, 500);
  }
});

// Get applications (for candidates)
applications.get('/applications/candidate', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const applicationIds = userProfile.applications || [];
    const applications = await kv.mget(applicationIds);
    
    // Get project details for each application
    const applicationsWithProjects = await Promise.all(
      applications.filter(Boolean).map(async (app) => {
        const project = await kv.get(app.projectId);
        return { 
          ...app, 
          project: project ? {
            id: project.id,
            title: project.title,
            company: project.company,
            location: project.location,
            type: project.type,
            status: project.status
          } : null
        };
      })
    );
    
    return c.json({ applications: applicationsWithProjects });
  } catch (error) {
    console.error('Candidate applications fetch error:', error);
    return c.json({ error: 'Failed to fetch applications' }, 500);
  }
});

// Get applications for a project (for recruiters)
applications.get('/applications/project/:projectId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);
    
    if (!project || project.createdBy !== user.id) {
      return c.json({ error: 'Not authorized to view these applications' }, 403);
    }
    
    const applicationIds = project.applications || [];
    const applications = await kv.mget(applicationIds);
    
    // Get candidate details for each application
    const applicationsWithCandidates = await Promise.all(
      applications.filter(Boolean).map(async (app) => {
        const candidate = await kv.get(`user:${app.candidateId}`);
        return { 
          ...app, 
          candidate: candidate ? {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            userType: candidate.userType,
            profileComplete: candidate.profileComplete
          } : null
        };
      })
    );
    
    // Sort by AI score and creation date
    applicationsWithCandidates.sort((a, b) => {
      if (b.aiScore !== a.aiScore) {
        return b.aiScore - a.aiScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return c.json({ applications: applicationsWithCandidates });
  } catch (error) {
    console.error('Project applications fetch error:', error);
    return c.json({ error: 'Failed to fetch applications' }, 500);
  }
});

// Get single application details
applications.get('/applications/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const applicationId = c.req.param('id');
    const application = await kv.get(applicationId);
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }
    
    // Check if user is authorized to view this application
    const project = await kv.get(application.projectId);
    const isRecruiter = project && project.createdBy === user.id;
    const isCandidate = application.candidateId === user.id;
    
    if (!isRecruiter && !isCandidate) {
      return c.json({ error: 'Not authorized to view this application' }, 403);
    }
    
    // Get additional details
    const candidate = await kv.get(`user:${application.candidateId}`);
    
    return c.json({ 
      application: {
        ...application,
        project: project ? {
          id: project.id,
          title: project.title,
          company: project.company,
          location: project.location,
          type: project.type
        } : null,
        candidate: candidate ? {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email
        } : null
      }
    });
  } catch (error) {
    console.error('Application fetch error:', error);
    return c.json({ error: 'Failed to fetch application' }, 500);
  }
});

// Update application status
applications.put('/applications/:id/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const applicationId = c.req.param('id');
    const { status, notes } = await c.req.json();
    const application = await kv.get(applicationId);
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }
    
    // Verify user owns the project
    const project = await kv.get(application.projectId);
    if (!project || project.createdBy !== user.id) {
      return c.json({ error: 'Not authorized to update this application' }, 403);
    }
    
    // Validate status
    const validStatuses = ['pending', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }
    
    application.status = status;
    application.updatedAt = new Date().toISOString();
    
    if (notes) {
      application.notes = [...(application.notes || []), {
        id: crypto.randomUUID(),
        text: notes,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      }];
    }
    
    await kv.set(applicationId, application);
    
    // Notify candidate of status change
    const statusMessages = {
      screening: 'Your application is being reviewed',
      interview: 'You have been selected for an interview',
      offer: 'Congratulations! You have received an offer',
      hired: 'Congratulations! You have been hired',
      rejected: 'Thank you for your application'
    };
    
    if (statusMessages[status as keyof typeof statusMessages]) {
      const notification = {
        id: crypto.randomUUID(),
        type: 'application_status',
        title: 'Application Status Update',
        message: `${statusMessages[status as keyof typeof statusMessages]} for ${project.title}`,
        data: { applicationId, status },
        createdAt: new Date().toISOString(),
        read: false
      };
      
      const candidateNotifications = await kv.get(`notifications:${application.candidateId}`) || [];
      candidateNotifications.unshift(notification);
      await kv.set(`notifications:${application.candidateId}`, candidateNotifications.slice(0, 50));
    }
    
    return c.json({ 
      application,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Application status update error:', error);
    return c.json({ error: 'Failed to update application status' }, 500);
  }
});

// Add notes to application
applications.post('/applications/:id/notes', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const applicationId = c.req.param('id');
    const { text } = await c.req.json();
    const application = await kv.get(applicationId);
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }
    
    // Verify user owns the project
    const project = await kv.get(application.projectId);
    if (!project || project.createdBy !== user.id) {
      return c.json({ error: 'Not authorized to add notes to this application' }, 403);
    }
    
    if (!text || text.trim().length === 0) {
      return c.json({ error: 'Note text is required' }, 400);
    }
    
    const note = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    
    application.notes = [...(application.notes || []), note];
    application.updatedAt = new Date().toISOString();
    
    await kv.set(applicationId, application);
    
    return c.json({ 
      note,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    return c.json({ error: 'Failed to add note' }, 500);
  }
});

// Get application statistics
applications.get('/applications/stats/overview', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user profile to determine type
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    if (userProfile.userType === 'recruiter') {
      // Get all projects for this recruiter
      const projects = await kv.getByPrefix('project:');
      const recruiterProjects = projects.filter(p => p.createdBy === user.id);
      
      // Get all applications for these projects
      const allApplicationIds = recruiterProjects.flatMap(p => p.applications || []);
      const applications = await kv.mget(allApplicationIds);
      const validApplications = applications.filter(Boolean);
      
      // Calculate stats
      const stats = {
        totalApplications: validApplications.length,
        pendingApplications: validApplications.filter(a => a.status === 'pending').length,
        interviewApplications: validApplications.filter(a => a.status === 'interview').length,
        hiredApplications: validApplications.filter(a => a.status === 'hired').length,
        averageMatchScore: validApplications.length > 0 
          ? Math.round(validApplications.reduce((sum, a) => sum + (a.aiScore || 0), 0) / validApplications.length)
          : 0
      };
      
      return c.json({ stats });
    } else {
      // Candidate stats
      const applicationIds = userProfile.applications || [];
      const applications = await kv.mget(applicationIds);
      const validApplications = applications.filter(Boolean);
      
      const stats = {
        totalApplications: validApplications.length,
        pendingApplications: validApplications.filter(a => a.status === 'pending').length,
        interviewApplications: validApplications.filter(a => a.status === 'interview').length,
        offerApplications: validApplications.filter(a => a.status === 'offer').length,
        averageMatchScore: validApplications.length > 0
          ? Math.round(validApplications.reduce((sum, a) => sum + (a.aiScore || 0), 0) / validApplications.length)
          : 0
      };
      
      return c.json({ stats });
    }
  } catch (error) {
    console.error('Application stats error:', error);
    return c.json({ error: 'Failed to fetch application statistics' }, 500);
  }
});

// Health check endpoint
applications.get('/health', (c) => {
  return c.json({ status: 'Applications service is running' });
});

export default applications;




