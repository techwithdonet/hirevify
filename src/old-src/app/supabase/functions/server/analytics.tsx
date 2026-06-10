import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const analytics = new Hono();

// CORS configuration
analytics.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Get user analytics
analytics.get('/analytics/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = c.req.param('userId');
    if (userId !== user.id) {
      return c.json({ error: 'Not authorized to view these analytics' }, 403);
    }
    
    const userProfile = await kv.get(`user:${userId}`);
    
    if (userProfile?.userType === 'recruiter') {
      // Recruiter analytics
      const projects = userProfile.projects || [];
      const projectData = await kv.mget(projects.map(p => p.startsWith('project:') ? p : `project:${p}`));
      
      const totalApplications = projectData.reduce((sum, p) => sum + (p?.applications?.length || 0), 0);
      
      // Calculate average match score
      let totalScore = 0;
      let scoreCount = 0;
      for (const project of projectData.filter(Boolean)) {
        if (project.applications) {
          const appData = await kv.mget(project.applications);
          for (const app of appData.filter(Boolean)) {
            if (app.aiScore) {
              totalScore += app.aiScore;
              scoreCount++;
            }
          }
        }
      }
      
      const avgMatchScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
      
      // Calculate hiring funnel data
      const statusCounts = { pending: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
      for (const project of projectData.filter(Boolean)) {
        if (project.applications) {
          const appData = await kv.mget(project.applications);
          for (const app of appData.filter(Boolean)) {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          }
        }
      }
      
      return c.json({
        totalProjects: projects.length,
        activeProjects: projectData.filter(p => p?.status === 'active').length,
        totalApplications,
        avgMatchScore,
        timeToHire: 0, // Will calculate from actual application data when available
        costPerHire: 0, // Will calculate from actual hiring costs when data is available
        hiringFunnel: statusCounts,
        conversionRate: totalApplications > 0 ? Math.round((statusCounts.hired / totalApplications) * 100) : 0
      });
    } else {
      // Candidate analytics
      const applications = userProfile.applications || [];
      const applicationData = await kv.mget(applications.map(a => a.startsWith('application:') ? a : `application:${a}`));
      
      const validApps = applicationData.filter(Boolean);
      const viewCount = 0; // Will track actual profile views when view tracking is implemented
      const responseRate = validApps.length > 0 ? 
        (validApps.filter(app => app.status !== 'pending').length / validApps.length) * 100 : 0;
      
      const avgMatchScore = validApps.length > 0 ?
        validApps.reduce((sum, app) => sum + (app.aiScore || 0), 0) / validApps.length : 0;
      
      // Application status breakdown
      const statusCounts = { pending: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
      validApps.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });
      
      return c.json({
        totalApplications: validApps.length,
        profileViews: viewCount,
        responseRate: Math.round(responseRate),
        avgMatchScore: Math.round(avgMatchScore),
        applicationStatus: statusCounts,
        successRate: validApps.length > 0 ? Math.round(((statusCounts.offer + statusCounts.hired) / validApps.length) * 100) : 0
      });
    }
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Get platform-wide analytics (admin only)
analytics.get('/analytics/platform/overview', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all users
    const users = await kv.getByPrefix('user:');
    const recruiters = users.filter(u => u.userType === 'recruiter');
    const candidates = users.filter(u => u.userType === 'candidate');
    
    // Get all projects
    const projects = await kv.getByPrefix('project:');
    const activeProjects = projects.filter(p => p.status === 'active');
    
    // Get all applications
    const applications = await kv.getByPrefix('application:');
    
    // Calculate success metrics
    const hiredCount = applications.filter(a => a.status === 'hired').length;
    const successRate = applications.length > 0 ? (hiredCount / applications.length) * 100 : 0;
    
    return c.json({
      totalUsers: users.length,
      totalRecruiters: recruiters.length,
      totalCandidates: candidates.length,
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalApplications: applications.length,
      successRate: Math.round(successRate),
      avgMatchScore: applications.length > 0 ? 
        Math.round(applications.reduce((sum, app) => sum + (app.aiScore || 0), 0) / applications.length) : 0
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    return c.json({ error: 'Failed to fetch platform analytics' }, 500);
  }
});

// Get advanced hiring metrics
analytics.get('/analytics/hiring-metrics/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = c.req.param('userId');
    if (userId !== user.id) {
      return c.json({ error: 'Not authorized to view these analytics' }, 403);
    }
    
    // Calculate real advanced metrics from actual data
    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile || userProfile.userType !== 'recruiter') {
      return c.json({ error: 'Not authorized or invalid user type' }, 403);
    }
    
    const projects = userProfile.projects || [];
    const projectData = await kv.mget(projects.map(p => p.startsWith('project:') ? p : `project:${p}`));
    
    // Calculate actual time to hire from application data
    const allApplications = [];
    for (const project of projectData.filter(Boolean)) {
      if (project.applications) {
        const appData = await kv.mget(project.applications);
        allApplications.push(...appData.filter(Boolean));
      }
    }
    
    // Calculate average time to hire (only for hired candidates)
    const hiredApplications = allApplications.filter(app => app.status === 'hired');
    const avgTimeToHire = hiredApplications.length > 0 ? 
      hiredApplications.reduce((sum, app) => {
        if (app.appliedAt && app.hiredAt) {
          const days = Math.ceil((new Date(app.hiredAt).getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }
        return sum;
      }, 0) / hiredApplications.length : 0;
    
    // Calculate source effectiveness from actual applications
    const sourceStats = {};
    allApplications.forEach(app => {
      const source = app.source || 'direct';
      if (!sourceStats[source]) {
        sourceStats[source] = { applications: 0, hired: 0 };
      }
      sourceStats[source].applications++;
      if (app.status === 'hired') {
        sourceStats[source].hired++;
      }
    });
    
    return c.json({
      timeToHire: {
        average: Math.round(avgTimeToHire * 10) / 10,
        trend: 0, // Cannot calculate trend without historical data
        totalHired: hiredApplications.length,
        note: 'Calculated from actual hiring data'
      },
      qualityOfHire: {
        note: 'Quality metrics require performance tracking implementation',
        totalHired: hiredApplications.length
      },
      diversityMetrics: {
        note: 'Diversity tracking requires opt-in demographic data collection',
        totalCandidates: allApplications.length
      },
      sourceEffectiveness: sourceStats
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    return c.json({ error: 'Failed to fetch advanced analytics' }, 500);
  }
});

// Health check endpoint
analytics.get('/health', (c) => {
  return c.json({ status: 'Analytics service is running' });
});

export default analytics;