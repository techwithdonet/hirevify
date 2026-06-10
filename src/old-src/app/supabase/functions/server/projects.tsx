import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const projects = new Hono();

// CORS configuration
projects.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to generate project ID
const generateProjectId = () => `project_${crypto.randomUUID()}`;

// Helper function to validate project data
const validateProjectData = (data: any) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Project title is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Project description is required');
  }
  
  if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
    errors.push('At least one skill is required');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Project title must be 100 characters or less');
  }
  
  if (data.description && data.description.length > 5000) {
    errors.push('Project description must be 5000 characters or less');
  }
  
  return errors;
};

// Helper function to enrich project data
const enrichProjectData = async (project: any) => {
  try {
    // Get creator info
    const creator = await kv.get(`user:${project.createdBy}`);
    
    // Get application count
    const applicationCount = project.applications ? project.applications.length : 0;
    
    // Calculate project score based on various factors
    const createdDate = new Date(project.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const freshnessFactor = Math.max(0, 1 - (daysSinceCreated / 30)); // Decreases over 30 days
    
    const projectScore = Math.min(100, Math.round(
      (project.views || 0) * 0.1 +
      applicationCount * 2 +
      (project.bookmarks || 0) * 1.5 +
      freshnessFactor * 20
    ));
    
    return {
      ...project,
      creator: creator ? {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        company: creator.company
      } : null,
      applicationCount,
      projectScore,
      isNew: daysSinceCreated <= 7,
      isUrgent: project.urgency === 'high' || project.deadline
    };
  } catch (error) {
    console.error('Error enriching project data:', error);
    return project;
  }
};

// Create new project
projects.post('/', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const projectData = await c.req.json();
    
    // Validate project data
    const validationErrors = validateProjectData(projectData);
    if (validationErrors.length > 0) {
      return c.json({ error: 'Validation failed', details: validationErrors }, 400);
    }
    
    const projectId = generateProjectId();
    
    const project = {
      id: projectId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: projectData.status || 'active',
      applications: [],
      views: 0,
      bookmarks: 0,
      featured: false,
      ...projectData,
      // Ensure critical fields can't be overridden
      id: projectId,
      createdBy: user.id
    };
    
    await kv.set(projectId, project);
    
    // Update user's projects list
    const userProfile = await kv.get(`user:${user.id}`) || {};
    userProfile.projects = [...(userProfile.projects || []), projectId];
    userProfile.projectsCount = (userProfile.projectsCount || 0) + 1;
    userProfile.lastProjectCreated = new Date().toISOString();
    await kv.set(`user:${user.id}`, userProfile);
    
    // Enrich the project data before returning
    const enrichedProject = await enrichProjectData(project);
    
    console.log(`✅ Project created successfully: ${projectId} by user ${user.id}`);
    
    return c.json({ 
      project: enrichedProject,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error(`❌ Project creation error: ${error}`);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Get projects with advanced filtering and search
projects.get('/', async (c) => {
  try {
    const searchQuery = c.req.query('search') || '';
    const skills = c.req.query('skills')?.split(',').filter(Boolean) || [];
    const location = c.req.query('location') || '';
    const type = c.req.query('type') || '';
    const budget = c.req.query('budget') || '';
    const status = c.req.query('status') || 'active';
    const sortBy = c.req.query('sortBy') || 'newest';
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); // Max 100 per page
    const userId = c.req.query('userId'); // For filtering user's own projects
    
    // Get all projects
    const allProjects = await kv.getByPrefix('project_');
    let projects = allProjects.filter(Boolean);
    
    // Apply filters
    projects = projects.filter(project => {
      if (!project) return false;
      
      // Status filter
      if (status && project.status !== status) return false;
      
      // User filter (for user's own projects)
      if (userId && project.createdBy !== userId) return false;
      
      // Only show active projects for public listings (unless specifically requesting other statuses)
      if (!userId && project.status !== 'active') return false;
      
      // Search filter
      const matchesSearch = !searchQuery || [
        project.title,
        project.description,
        project.company,
        ...(project.skills || [])
      ].some(field => 
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Skills filter
      const matchesSkills = !skills.length || 
        skills.some(skill => 
          project.skills?.some(pSkill => 
            pSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      
      // Location filter
      const matchesLocation = !location || 
        project.location?.toLowerCase().includes(location.toLowerCase()) ||
        project.remote === true;
      
      // Type filter
      const matchesType = !type || project.type === type;
      
      // Budget filter
      const matchesBudget = !budget || project.budgetRange === budget;
      
      return matchesSearch && matchesSkills && matchesLocation && matchesType && matchesBudget;
    });
    
    // Sort projects
    projects.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostApplied':
          return (b.applications?.length || 0) - (a.applications?.length || 0);
        case 'mostViewed':
          return (b.views || 0) - (a.views || 0);
        case 'budget':
          const budgetA = parseInt(a.budget?.replace(/[^\d]/g, '') || '0');
          const budgetB = parseInt(b.budget?.replace(/[^\d]/g, '') || '0');
          return budgetB - budgetA;
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });
    
    // Calculate pagination
    const totalCount = projects.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = projects.slice(startIndex, endIndex);
    
    // Enrich project data
    const enrichedProjects = await Promise.all(
      paginatedProjects.map(enrichProjectData)
    );
    
    console.log(`📋 Projects fetched: ${enrichedProjects.length}/${totalCount} (page ${page}/${totalPages})`);
    
    return c.json({ 
      projects: enrichedProjects,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        searchQuery,
        skills,
        location,
        type,
        budget,
        status,
        sortBy
      }
    });
  } catch (error) {
    console.error(`❌ Projects fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get single project by ID
projects.get('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const includeViews = c.req.query('includeViews') === 'true';
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }
    
    const project = await kv.get(projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    // Increment view count if requested (for public viewing)
    if (includeViews) {
      project.views = (project.views || 0) + 1;
      project.lastViewed = new Date().toISOString();
      await kv.set(projectId, project);
    }
    
    // Enrich project data
    const enrichedProject = await enrichProjectData(project);
    
    console.log(`👁️ Project viewed: ${projectId} (views: ${project.views})`);
    
    return c.json({ 
      project: enrichedProject
    });
  } catch (error) {
    console.error(`❌ Project fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Update project
projects.put('/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const projectId = c.req.param('id');
    const updates = await c.req.json();
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }
    
    const project = await kv.get(projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    if (project.createdBy !== user.id) {
      return c.json({ error: 'Not authorized to update this project' }, 403);
    }
    
    // Validate updates if they include critical fields
    if (updates.title || updates.description || updates.skills) {
      const validationErrors = validateProjectData({ ...project, ...updates });
      if (validationErrors.length > 0) {
        return c.json({ error: 'Validation failed', details: validationErrors }, 400);
      }
    }
    
    // Prevent overriding critical fields
    const { id, createdBy, createdAt, applications, views, bookmarks, ...allowedUpdates } = updates;
    
    const updatedProject = {
      ...project,
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(projectId, updatedProject);
    
    // Enrich project data before returning
    const enrichedProject = await enrichProjectData(updatedProject);
    
    console.log(`✏️ Project updated: ${projectId} by user ${user.id}`);
    
    return c.json({ 
      project: enrichedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error(`❌ Project update error: ${error}`);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Delete project (soft delete)
projects.delete('/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const projectId = c.req.param('id');
    const hardDelete = c.req.query('hard') === 'true'; // Admin feature
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }
    
    const project = await kv.get(projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    if (project.createdBy !== user.id) {
      return c.json({ error: 'Not authorized to delete this project' }, 403);
    }
    
    if (hardDelete) {
      // Hard delete - completely remove from storage
      await kv.del(projectId);
      
      // Remove from user's projects list
      const userProfile = await kv.get(`user:${user.id}`) || {};
      userProfile.projects = (userProfile.projects || []).filter(id => id !== projectId);
      userProfile.projectsCount = Math.max(0, (userProfile.projectsCount || 1) - 1);
      await kv.set(`user:${user.id}`, userProfile);
      
      console.log(`🗑️ Project hard deleted: ${projectId} by user ${user.id}`);
      
      return c.json({ message: 'Project permanently deleted' });
    } else {
      // Soft delete - mark as deleted
      const deletedProject = {
        ...project,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(projectId, deletedProject);
      
      console.log(`📥 Project soft deleted: ${projectId} by user ${user.id}`);
      
      return c.json({ message: 'Project deleted successfully' });
    }
  } catch (error) {
    console.error(`❌ Project deletion error: ${error}`);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// Bookmark/unbookmark project
projects.post('/:id/bookmark', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const projectId = c.req.param('id');
    const { action } = await c.req.json(); // 'bookmark' or 'unbookmark'
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }
    
    if (!['bookmark', 'unbookmark'].includes(action)) {
      return c.json({ error: 'Invalid action. Use "bookmark" or "unbookmark"' }, 400);
    }
    
    const project = await kv.get(projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    // Get user's bookmarks
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const bookmarkedProjects = userProfile.bookmarkedProjects || [];
    
    if (action === 'bookmark') {
      if (!bookmarkedProjects.includes(projectId)) {
        bookmarkedProjects.push(projectId);
        project.bookmarks = (project.bookmarks || 0) + 1;
      }
    } else {
      const index = bookmarkedProjects.indexOf(projectId);
      if (index > -1) {
        bookmarkedProjects.splice(index, 1);
        project.bookmarks = Math.max(0, (project.bookmarks || 1) - 1);
      }
    }
    
    // Update both user profile and project
    userProfile.bookmarkedProjects = bookmarkedProjects;
    await kv.set(`user:${user.id}`, userProfile);
    await kv.set(projectId, project);
    
    console.log(`🔖 Project ${action}ed: ${projectId} by user ${user.id}`);
    
    return c.json({ 
      message: `Project ${action}ed successfully`,
      isBookmarked: action === 'bookmark',
      bookmarkCount: project.bookmarks
    });
  } catch (error) {
    console.error(`❌ Project bookmark error: ${error}`);
    return c.json({ error: 'Failed to update bookmark' }, 500);
  }
});

// Get project statistics
projects.get('/stats/overview', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all projects for this user
    const allProjects = await kv.getByPrefix('project_');
    const userProjects = allProjects.filter(project => 
      project && project.createdBy === user.id
    );
    
    // Calculate statistics
    const stats = {
      totalProjects: userProjects.length,
      activeProjects: userProjects.filter(p => p.status === 'active').length,
      draftProjects: userProjects.filter(p => p.status === 'draft').length,
      completedProjects: userProjects.filter(p => p.status === 'completed').length,
      deletedProjects: userProjects.filter(p => p.status === 'deleted').length,
      totalViews: userProjects.reduce((sum, p) => sum + (p.views || 0), 0),
      totalApplications: userProjects.reduce((sum, p) => sum + (p.applications?.length || 0), 0),
      totalBookmarks: userProjects.reduce((sum, p) => sum + (p.bookmarks || 0), 0),
      averageApplicationsPerProject: userProjects.length > 0 
        ? Math.round(userProjects.reduce((sum, p) => sum + (p.applications?.length || 0), 0) / userProjects.length * 10) / 10
        : 0,
      projectsThisMonth: userProjects.filter(p => {
        const createdDate = new Date(p.createdAt);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      }).length
    };
    
    return c.json({ stats });
  } catch (error) {
    console.error(`❌ Project stats error: ${error}`);
    return c.json({ error: 'Failed to fetch project statistics' }, 500);
  }
});

// Search projects with advanced filters
projects.get('/search/advanced', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const skills = c.req.query('skills')?.split(',').filter(Boolean) || [];
    const minBudget = parseInt(c.req.query('minBudget') || '0');
    const maxBudget = parseInt(c.req.query('maxBudget') || '999999');
    const projectType = c.req.query('projectType');
    const duration = c.req.query('duration');
    const remote = c.req.query('remote') === 'true';
    const urgent = c.req.query('urgent') === 'true';
    const featured = c.req.query('featured') === 'true';
    
    // Get all active projects
    const allProjects = await kv.getByPrefix('project_');
    let projects = allProjects.filter(project => 
      project && project.status === 'active'
    );
    
    // Apply advanced filters
    projects = projects.filter(project => {
      // Text search across multiple fields
      const searchFields = [
        project.title,
        project.description,
        project.company,
        ...(project.skills || []),
        project.location
      ].join(' ').toLowerCase();
      
      const matchesQuery = !query || searchFields.includes(query.toLowerCase());
      
      // Skills filter with partial matching
      const matchesSkills = !skills.length || 
        skills.every(skill => 
          project.skills?.some(pSkill => 
            pSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      
      // Budget range filter
      const projectBudget = parseInt(project.budget?.replace(/[^\d]/g, '') || '0');
      const matchesBudget = projectBudget >= minBudget && projectBudget <= maxBudget;
      
      // Type filter
      const matchesType = !projectType || project.type === projectType;
      
      // Duration filter
      const matchesDuration = !duration || project.duration === duration;
      
      // Remote work filter
      const matchesRemote = !remote || project.remote === true;
      
      // Urgent projects filter
      const matchesUrgent = !urgent || project.urgency === 'high';
      
      // Featured projects filter
      const matchesFeatured = !featured || project.featured === true;
      
      return matchesQuery && matchesSkills && matchesBudget && 
             matchesType && matchesDuration && matchesRemote && 
             matchesUrgent && matchesFeatured;
    });
    
    // Sort by relevance score
    projects = projects.map(project => ({
      ...project,
      relevanceScore: calculateRelevanceScore(project, query, skills)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Enrich project data
    const enrichedProjects = await Promise.all(
      projects.map(enrichProjectData)
    );
    
    return c.json({ 
      projects: enrichedProjects,
      totalResults: enrichedProjects.length,
      searchQuery: query,
      appliedFilters: {
        skills,
        budgetRange: [minBudget, maxBudget],
        projectType,
        duration,
        remote,
        urgent,
        featured
      }
    });
  } catch (error) {
    console.error(`❌ Advanced search error: ${error}`);
    return c.json({ error: 'Failed to perform advanced search' }, 500);
  }
});

// Helper function to calculate relevance score
function calculateRelevanceScore(project: any, query: string, skills: string[]): number {
  let score = 0;
  
  if (query) {
    const title = project.title?.toLowerCase() || '';
    const description = project.description?.toLowerCase() || '';
    const queryLower = query.toLowerCase();
    
    // Title matches get highest score
    if (title.includes(queryLower)) score += 10;
    if (title.startsWith(queryLower)) score += 5;
    
    // Description matches get medium score
    if (description.includes(queryLower)) score += 3;
  }
  
  if (skills.length > 0) {
    const matchingSkills = skills.filter(skill =>
      project.skills?.some((pSkill: string) =>
        pSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    score += matchingSkills.length * 2;
  }
  
  // Boost score for recent projects
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated <= 7) score += 5;
  if (daysSinceCreated <= 30) score += 2;
  
  // Boost score for projects with more engagement
  score += (project.views || 0) * 0.1;
  score += (project.applications?.length || 0) * 0.5;
  score += (project.bookmarks || 0) * 0.3;
  
  return score;
}

// Health check endpoint
projects.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    service: 'projects',
    timestamp: new Date().toISOString()
  });
});

export default projects;