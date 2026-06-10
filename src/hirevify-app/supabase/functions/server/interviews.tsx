import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const interviews = new Hono();

// CORS configuration
interviews.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to enrich interview data
const enrichInterviewData = async (interview: any) => {
  try {
    const [application, candidate, recruiter] = await Promise.all([
      interview.applicationId ? kv.get(interview.applicationId) : null,
      interview.candidateId ? kv.get(`user:${interview.candidateId}`) : null,
      interview.recruiterId ? kv.get(`user:${interview.recruiterId}`) : null,
    ]);

    const project = application?.projectId ? await kv.get(application.projectId) : null;

    return {
      ...interview,
      application,
      project,
      candidate,
      recruiter
    };
  } catch (error) {
    console.error('Error enriching interview data:', error);
    return interview;
  }
};

// Helper function to send notification
const sendNotification = async (userId: string, notification: any) => {
  try {
    const userNotifications = await kv.get(`notifications:${userId}`) || [];
    userNotifications.unshift(notification);
    await kv.set(`notifications:${userId}`, userNotifications.slice(0, 50));
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Schedule interview
interviews.post('/schedule', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { 
      applicationId, 
      candidateId, 
      scheduledAt, 
      type, 
      meetingLink, 
      duration, 
      notes,
      title,
      description 
    } = await c.req.json();

    // Validate required fields
    if (!applicationId || !candidateId || !scheduledAt || !type) {
      return c.json({ 
        error: 'Missing required fields: applicationId, candidateId, scheduledAt, type' 
      }, 400);
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(scheduledAt);
    if (scheduledTime <= new Date()) {
      return c.json({ error: 'Interview must be scheduled for a future time' }, 400);
    }

    const interviewId = `interview_${crypto.randomUUID()}`;
    
    const interview = {
      id: interviewId,
      applicationId,
      candidateId,
      recruiterId: user.id,
      scheduledAt: scheduledTime.toISOString(),
      type, // 'video', 'phone', 'in-person', 'one-way'
      meetingLink: meetingLink || null,
      duration: duration || 60, // minutes
      status: 'scheduled',
      title: title || 'Interview',
      description: description || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      feedback: null,
      recording: null,
      completedAt: null
    };
    
    await kv.set(interviewId, interview);
    
    // Update application with interview info
    try {
      const application = await kv.get(applicationId);
      if (application) {
        application.interviews = [...(application.interviews || []), interviewId];
        application.status = 'interview';
        application.interviewScheduledAt = scheduledTime.toISOString();
        application.updatedAt = new Date().toISOString();
        await kv.set(applicationId, application);
      }
    } catch (appError) {
      console.warn('Failed to update application with interview info:', appError);
    }
    
    // Get additional data for notifications
    const [candidate, project] = await Promise.all([
      kv.get(`user:${candidateId}`).catch(() => null),
      applicationId ? kv.get(applicationId).then(app => app?.projectId ? kv.get(app.projectId) : null).catch(() => null) : null
    ]);
    
    // Send notifications to both parties
    const scheduledDateStr = scheduledTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Notification for candidate
    await sendNotification(candidateId, {
      id: crypto.randomUUID(),
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your interview for "${project?.title || 'the position'}" has been scheduled for ${scheduledDateStr}`,
      data: { 
        interviewId, 
        applicationId,
        scheduledAt: scheduledTime.toISOString(),
        meetingLink 
      },
      createdAt: new Date().toISOString(),
      read: false
    });
    
    // Notification for recruiter (reminder)
    await sendNotification(user.id, {
      id: crypto.randomUUID(),
      type: 'interview_reminder',
      title: 'Interview Scheduled',
      message: `Interview with ${candidate?.name || 'candidate'} scheduled for ${scheduledDateStr}`,
      data: { 
        interviewId, 
        applicationId,
        scheduledAt: scheduledTime.toISOString(),
        meetingLink 
      },
      createdAt: new Date().toISOString(),
      read: false
    });
    
    // Return enriched interview data
    const enrichedInterview = await enrichInterviewData(interview);
    
    return c.json({ 
      interview: enrichedInterview,
      success: true 
    });
  } catch (error) {
    console.error(`Interview scheduling error: ${error}`);
    return c.json({ error: 'Failed to schedule interview' }, 500);
  }
});

// Get interviews for user
interviews.get('/', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const status = c.req.query('status'); // scheduled, completed, cancelled
    const type = c.req.query('type'); // video, phone, in-person, one-way
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get all interviews and filter for this user
    const allInterviews = await kv.getByPrefix('interview_');
    
    // Filter interviews for this user (either as recruiter or candidate)
    let userInterviews = allInterviews.filter(interview => 
      interview.recruiterId === user.id || interview.candidateId === user.id
    );

    // Apply filters
    if (status) {
      userInterviews = userInterviews.filter(interview => interview.status === status);
    }
    
    if (type) {
      userInterviews = userInterviews.filter(interview => interview.type === type);
    }
    
    // Sort by scheduled date (most recent first)
    userInterviews.sort((a, b) => 
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
    
    // Apply pagination
    const paginatedInterviews = userInterviews.slice(offset, offset + limit);
    
    // Enrich with application and project data
    const enrichedInterviews = await Promise.all(
      paginatedInterviews.map(enrichInterviewData)
    );
    
    return c.json({ 
      interviews: enrichedInterviews,
      total: userInterviews.length,
      limit,
      offset,
      hasMore: offset + limit < userInterviews.length,
      success: true
    });
  } catch (error) {
    console.error(`Interviews fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch interviews' }, 500);
  }
});

// Get specific interview
interviews.get('/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const interviewId = c.req.param('id');
    
    if (!interviewId) {
      return c.json({ error: 'Interview ID is required' }, 400);
    }

    const interview = await kv.get(interviewId);
    
    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404);
    }
    
    // Verify user is involved in this interview
    if (interview.recruiterId !== user.id && interview.candidateId !== user.id) {
      return c.json({ error: 'Not authorized to view this interview' }, 403);
    }
    
    // Enrich with additional data
    const enrichedInterview = await enrichInterviewData(interview);
    
    return c.json({ 
      interview: enrichedInterview,
      success: true 
    });
  } catch (error) {
    console.error(`Interview fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch interview' }, 500);
  }
});

// Update interview status/feedback
interviews.put('/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const interviewId = c.req.param('id');
    const updates = await c.req.json();
    
    if (!interviewId) {
      return c.json({ error: 'Interview ID is required' }, 400);
    }

    const interview = await kv.get(interviewId);
    
    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404);
    }
    
    // Verify user is involved in this interview
    if (interview.recruiterId !== user.id && interview.candidateId !== user.id) {
      return c.json({ error: 'Not authorized to update this interview' }, 403);
    }
    
    // Handle status changes
    const statusChanged = updates.status && updates.status !== interview.status;
    
    const updatedInterview = {
      ...interview,
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(updates.status === 'completed' && !interview.completedAt && {
        completedAt: new Date().toISOString()
      })
    };
    
    await kv.set(interviewId, updatedInterview);
    
    // Handle status change notifications
    if (statusChanged) {
      const [candidate, recruiter] = await Promise.all([
        kv.get(`user:${interview.candidateId}`).catch(() => null),
        kv.get(`user:${interview.recruiterId}`).catch(() => null)
      ]);

      if (updates.status === 'completed') {
        // Notify the other party about completion
        const otherUserId = user.id === interview.recruiterId ? interview.candidateId : interview.recruiterId;
        const isRecruiterCompleting = user.id === interview.recruiterId;
        
        await sendNotification(otherUserId, {
          id: crypto.randomUUID(),
          type: 'interview_completed',
          title: 'Interview Completed',
          message: isRecruiterCompleting 
            ? 'Your interview has been completed. You will be notified of the next steps soon.'
            : `Interview with ${candidate?.name || 'candidate'} has been marked as completed.`,
          data: { interviewId },
          createdAt: new Date().toISOString(),
          read: false
        });
      } else if (updates.status === 'cancelled') {
        // Notify both parties about cancellation
        const cancelledBy = user.id === interview.recruiterId ? 'recruiter' : 'candidate';
        const message = `Interview scheduled for ${new Date(interview.scheduledAt).toLocaleString()} has been cancelled by the ${cancelledBy}.`;
        
        const otherUserId = user.id === interview.recruiterId ? interview.candidateId : interview.recruiterId;
        
        await sendNotification(otherUserId, {
          id: crypto.randomUUID(),
          type: 'interview_cancelled',
          title: 'Interview Cancelled',
          message,
          data: { interviewId },
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }
    
    // Enrich the updated interview data
    const enrichedInterview = await enrichInterviewData(updatedInterview);
    
    return c.json({ 
      interview: enrichedInterview,
      success: true 
    });
  } catch (error) {
    console.error(`Interview update error: ${error}`);
    return c.json({ error: 'Failed to update interview' }, 500);
  }
});

// Cancel interview
interviews.delete('/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const interviewId = c.req.param('id');
    const { reason } = await c.req.json();
    
    if (!interviewId) {
      return c.json({ error: 'Interview ID is required' }, 400);
    }

    const interview = await kv.get(interviewId);
    
    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404);
    }
    
    // Verify user is involved in this interview
    if (interview.recruiterId !== user.id && interview.candidateId !== user.id) {
      return c.json({ error: 'Not authorized to cancel this interview' }, 403);
    }

    // Can only cancel if interview is scheduled or in progress
    if (!['scheduled', 'in_progress'].includes(interview.status)) {
      return c.json({ error: 'Cannot cancel interview in current status' }, 400);
    }
    
    // Update interview status
    const updatedInterview = {
      ...interview,
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledBy: user.id,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(interviewId, updatedInterview);
    
    // Send notification to the other party
    const otherUserId = user.id === interview.recruiterId ? interview.candidateId : interview.recruiterId;
    const cancelledBy = user.id === interview.recruiterId ? 'recruiter' : 'candidate';
    
    await sendNotification(otherUserId, {
      id: crypto.randomUUID(),
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `Interview scheduled for ${new Date(interview.scheduledAt).toLocaleString()} has been cancelled by the ${cancelledBy}.${reason ? ` Reason: ${reason}` : ''}`,
      data: { interviewId, reason },
      createdAt: new Date().toISOString(),
      read: false
    });
    
    return c.json({ 
      interview: updatedInterview,
      success: true 
    });
  } catch (error) {
    console.error(`Interview cancellation error: ${error}`);
    return c.json({ error: 'Failed to cancel interview' }, 500);
  }
});

// Record interview (for recording URL storage)
interviews.post('/:id/recording', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const interviewId = c.req.param('id');
    const { recordingUrl, duration, transcript, notes } = await c.req.json();
    
    if (!interviewId) {
      return c.json({ error: 'Interview ID is required' }, 400);
    }

    if (!recordingUrl) {
      return c.json({ error: 'Recording URL is required' }, 400);
    }

    const interview = await kv.get(interviewId);
    
    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404);
    }
    
    // Verify user is the recruiter for this interview
    if (interview.recruiterId !== user.id) {
      return c.json({ error: 'Only the recruiter can add recordings to interviews' }, 403);
    }
    
    const updatedInterview = {
      ...interview,
      recording: {
        url: recordingUrl,
        duration: duration || null,
        transcript: transcript || null,
        notes: notes || null,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id
      },
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(interviewId, updatedInterview);
    
    // Notify candidate that recording is available (if applicable)
    if (interview.candidateId) {
      await sendNotification(interview.candidateId, {
        id: crypto.randomUUID(),
        type: 'interview_recording_available',
        title: 'Interview Recording Available',
        message: 'The recording of your interview is now available for review.',
        data: { interviewId },
        createdAt: new Date().toISOString(),
        read: false
      });
    }
    
    return c.json({ 
      interview: updatedInterview,
      success: true 
    });
  } catch (error) {
    console.error(`Interview recording error: ${error}`);
    return c.json({ error: 'Failed to save interview recording' }, 500);
  }
});

// Get interview statistics
interviews.get('/stats/overview', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all interviews for this user
    const allInterviews = await kv.getByPrefix('interview_');
    const userInterviews = allInterviews.filter(interview => 
      interview.recruiterId === user.id || interview.candidateId === user.id
    );
    
    // Calculate statistics
    const stats = {
      total: userInterviews.length,
      scheduled: userInterviews.filter(i => i.status === 'scheduled').length,
      completed: userInterviews.filter(i => i.status === 'completed').length,
      cancelled: userInterviews.filter(i => i.status === 'cancelled').length,
      inProgress: userInterviews.filter(i => i.status === 'in_progress').length,
      byType: {
        video: userInterviews.filter(i => i.type === 'video').length,
        phone: userInterviews.filter(i => i.type === 'phone').length,
        inPerson: userInterviews.filter(i => i.type === 'in-person').length,
        oneWay: userInterviews.filter(i => i.type === 'one-way').length,
      },
      upcomingThisWeek: userInterviews.filter(i => {
        if (i.status !== 'scheduled') return false;
        const scheduledDate = new Date(i.scheduledAt);
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return scheduledDate >= now && scheduledDate <= weekFromNow;
      }).length
    };
    
    return c.json({ 
      stats,
      success: true 
    });
  } catch (error) {
    console.error(`Interview stats error: ${error}`);
    return c.json({ error: 'Failed to fetch interview statistics' }, 500);
  }
});

// Health check endpoint
interviews.get('/health', (c) => {
  return c.json({ status: 'Interviews service is running' });
});

export default interviews;




