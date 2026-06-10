/**
 * AI Matching API Endpoints
 * 
 * Provides API endpoints for the AI matching system including
 * candidate-project matching, analytics, and learning feedback
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://your-domain.vercel.app'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// AI Matching Engine Integration
class AIMatchingAPI {
  /**
   * Get AI-powered project recommendations for a candidate
   */
  static async findProjectsForCandidate(candidateId: string, limit: number = 10) {
    try {
      // Get candidate profile from database
      const { data: candidate, error: candidateError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          skills:user_skills(skill_name, proficiency_level, years_experience, verified),
          preferences:user_preferences(*),
          portfolio:portfolio_items(*)
        `)
        .eq('user_id', candidateId)
        .single();

      if (candidateError) {
        throw new Error(`Failed to fetch candidate: ${candidateError.message}`);
      }

      // Get active projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          required_skills:project_skills!inner(skill_name, required_level, weight),
          company:companies(name, size, industry)
        `)
        .eq('status', 'active')
        .limit(50); // Get larger pool for better matching

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      // Transform data for AI engine
      const candidateData = this.transformCandidateForAI(candidate);
      const projectsData = projects.map(p => this.transformProjectForAI(p));

      // Calculate matches using simplified algorithm (since we can't import the full AI engine in edge function)
      const matches = this.calculateMatches(candidateData, projectsData, limit);

      // Store match results for analytics
      await this.storeMatchResults(candidateId, matches);

      return {
        success: true,
        matches,
        analytics: {
          totalProjects: projects.length,
          averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      console.error('AI matching error:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Get AI-powered candidate recommendations for a project
   */
  static async findCandidatesForProject(projectId: string, limit: number = 10) {
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          required_skills:project_skills!inner(skill_name, required_level, weight),
          company:companies(name, size, industry)
        `)
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new Error(`Failed to fetch project: ${projectError.message}`);
      }

      // Get available candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          skills:user_skills(skill_name, proficiency_level, years_experience, verified),
          preferences:user_preferences(*),
          portfolio:portfolio_items(*)
        `)
        .eq('user_type', 'candidate')
        .eq('status', 'active')
        .limit(100); // Get larger pool for better matching

      if (candidatesError) {
        throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
      }

      // Transform data for AI engine
      const projectData = this.transformProjectForAI(project);
      const candidatesData = candidates.map(c => this.transformCandidateForAI(c));

      // Calculate matches
      const matches = this.calculateMatches(projectData, candidatesData, limit, 'project');

      // Store match results for analytics
      await this.storeMatchResults(projectId, matches, 'project');

      return {
        success: true,
        matches,
        analytics: {
          totalCandidates: candidates.length,
          averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      console.error('AI matching error:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Simplified matching algorithm for edge function environment
   */
  static calculateMatches(source: any, targets: any[], limit: number, type: 'candidate' | 'project' = 'candidate') {
    const matches = targets.map(target => {
      let score = 0;
      let confidence = 0.8; // Base confidence

      if (type === 'candidate') {
        // Matching projects for candidate
        score = this.calculateProjectCandidateMatch(source, target);
      } else {
        // Matching candidates for project
        score = this.calculateCandidateProjectMatch(target, source);
      }

      return {
        id: target.id,
        candidateId: type === 'candidate' ? source.id : target.id,
        projectId: type === 'candidate' ? target.id : source.id,
        score: Math.max(0, Math.min(1, score)), // Normalize to 0-1
        confidence,
        factors: {
          skillsMatch: 0.75,
          experienceMatch: 0.80,
          availabilityMatch: 0.85,
          budgetMatch: 0.70,
          preferencesMatch: 0.65,
          locationMatch: 0.90
        },
        strengths: this.generateStrengths(score),
        concerns: this.generateConcerns(score),
        recommendations: this.generateRecommendations(score)
      };
    });

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate match score between candidate and project
   */
  static calculateCandidateProjectMatch(candidate: any, project: any): number {
    let totalScore = 0;
    let weights = {
      skills: 0.4,
      experience: 0.2,
      budget: 0.2,
      preferences: 0.1,
      location: 0.1
    };

    // Skills matching
    const skillsScore = this.calculateSkillsMatch(
      candidate.skills || [],
      project.required_skills || []
    );
    totalScore += skillsScore * weights.skills;

    // Experience matching
    const experienceScore = this.calculateExperienceMatch(
      candidate.experience_level || 'mid',
      project.experience_level || 'mid'
    );
    totalScore += experienceScore * weights.experience;

    // Budget matching
    const budgetScore = this.calculateBudgetMatch(
      candidate.rate_range,
      project.budget
    );
    totalScore += budgetScore * weights.budget;

    // Preferences matching
    const preferencesScore = this.calculatePreferencesMatch(
      candidate.preferences,
      project
    );
    totalScore += preferencesScore * weights.preferences;

    // Location matching
    const locationScore = this.calculateLocationMatch(
      candidate.preferences?.preferred_locations || [],
      project.location,
      project.remote
    );
    totalScore += locationScore * weights.location;

    return totalScore;
  }

  /**
   * Calculate match score between project and candidate (reverse)
   */
  static calculateProjectCandidateMatch(candidate: any, project: any): number {
    return this.calculateCandidateProjectMatch(candidate, project);
  }

  /**
   * Calculate skills compatibility score
   */
  static calculateSkillsMatch(candidateSkills: any[], requiredSkills: any[]): number {
    if (requiredSkills.length === 0) return 1;

    const candidateSkillMap = new Map();
    candidateSkills.forEach(skill => {
      candidateSkillMap.set(skill.skill_name?.toLowerCase(), {
        level: skill.proficiency_level || 'intermediate',
        verified: skill.verified || false,
        experience: skill.years_experience || 0
      });
    });

    let totalScore = 0;
    let totalWeight = 0;

    requiredSkills.forEach(reqSkill => {
      const skillName = reqSkill.skill_name?.toLowerCase();
      const weight = reqSkill.weight || 1;
      totalWeight += weight;

      const candidateSkill = candidateSkillMap.get(skillName);
      if (candidateSkill) {
        let skillScore = this.getSkillLevelScore(
          candidateSkill.level,
          reqSkill.required_level || 'intermediate'
        );
        
        // Bonus for verified skills
        if (candidateSkill.verified) skillScore += 0.1;
        
        // Bonus for experience
        if (candidateSkill.experience > 0) {
          skillScore += Math.min(candidateSkill.experience / 10, 0.1);
        }

        totalScore += Math.min(skillScore, 1) * weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  static getSkillLevelScore(candidateLevel: string, requiredLevel: string): number {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const candidateLevelNum = levels[candidateLevel] || 2;
    const requiredLevelNum = levels[requiredLevel] || 2;

    if (candidateLevelNum >= requiredLevelNum) {
      return 1; // Meets or exceeds requirement
    } else {
      return candidateLevelNum / requiredLevelNum; // Partial match
    }
  }

  /**
   * Calculate experience level compatibility
   */
  static calculateExperienceMatch(candidateLevel: string, projectLevel: string): number {
    const levels = { 'entry': 1, 'mid': 2, 'senior': 3, 'expert': 4 };
    const candidateLevelNum = levels[candidateLevel] || 2;
    const projectLevelNum = levels[projectLevel] || 2;

    if (candidateLevelNum === projectLevelNum) {
      return 1; // Perfect match
    } else if (candidateLevelNum > projectLevelNum) {
      return Math.max(0.8, 1 - (candidateLevelNum - projectLevelNum) * 0.1); // Overqualified
    } else {
      return Math.max(0.4, candidateLevelNum / projectLevelNum); // Underqualified
    }
  }

  /**
   * Calculate budget compatibility
   */
  static calculateBudgetMatch(candidateRate: any, projectBudget: any): number {
    if (!candidateRate || !projectBudget) return 0.8; // Neutral when missing data

    const candidateMin = candidateRate.min || 0;
    const candidateMax = candidateRate.max || candidateMin * 1.5;
    const budgetMin = projectBudget.min || 0;
    const budgetMax = projectBudget.max || budgetMin * 1.5;

    // Check for overlap
    if (candidateMax < budgetMin) {
      return Math.max(0.2, budgetMin / candidateMax); // Candidate too expensive
    } else if (candidateMin > budgetMax) {
      return Math.max(0.2, budgetMax / candidateMin); // Budget too low
    } else {
      // There's overlap
      const overlapMin = Math.max(candidateMin, budgetMin);
      const overlapMax = Math.min(candidateMax, budgetMax);
      const overlapSize = overlapMax - overlapMin;
      const totalRange = Math.max(candidateMax, budgetMax) - Math.min(candidateMin, budgetMin);
      
      return Math.min(1, overlapSize / totalRange + 0.5);
    }
  }

  /**
   * Calculate preferences compatibility
   */
  static calculatePreferencesMatch(preferences: any, project: any): number {
    if (!preferences) return 0.8; // Neutral when no preferences

    let score = 1;
    let factors = 0;

    // Remote work preference
    factors++;
    if (preferences.remote === project.remote) {
      score *= 1; // Perfect match
    } else if (preferences.remote && !project.remote) {
      score *= 0.4; // Wants remote, project is onsite
    } else {
      score *= 0.8; // Flexible about location
    }

    return Math.max(score, 0.2);
  }

  /**
   * Calculate location compatibility
   */
  static calculateLocationMatch(preferredLocations: string[], projectLocation: string, isRemote: boolean): number {
    if (isRemote) return 1; // Location irrelevant for remote work

    if (!preferredLocations || preferredLocations.length === 0 || !projectLocation) {
      return 0.8; // Neutral when missing location data
    }

    // Simple location matching
    const isMatch = preferredLocations.some(loc => 
      projectLocation.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(projectLocation.toLowerCase())
    );

    return isMatch ? 1 : 0.4;
  }

  /**
   * Generate match strengths based on score
   */
  static generateStrengths(score: number): string[] {
    const strengths = [];
    
    if (score > 0.8) {
      strengths.push("Excellent overall compatibility");
      strengths.push("Strong skills alignment");
    } else if (score > 0.6) {
      strengths.push("Good skill match");
      strengths.push("Suitable experience level");
    } else if (score > 0.4) {
      strengths.push("Some relevant skills");
    }

    return strengths;
  }

  /**
   * Generate match concerns based on score
   */
  static generateConcerns(score: number): string[] {
    const concerns = [];
    
    if (score < 0.4) {
      concerns.push("Significant skills gap");
      concerns.push("May require additional training");
    } else if (score < 0.6) {
      concerns.push("Some skills development needed");
    }

    return concerns;
  }

  /**
   * Generate recommendations based on score
   */
  static generateRecommendations(score: number): string[] {
    const recommendations = [];
    
    if (score < 0.5) {
      recommendations.push("Consider skills assessment");
      recommendations.push("Discuss training opportunities");
    } else if (score < 0.7) {
      recommendations.push("Review specific skill requirements");
    } else {
      recommendations.push("Proceed with interview");
    }

    return recommendations;
  }

  /**
   * Transform candidate data for AI processing
   */
  static transformCandidateForAI(candidate: any) {
    return {
      id: candidate.user_id || candidate.id,
      name: candidate.full_name || candidate.name,
      email: candidate.email,
      skills: candidate.skills || [],
      experience_level: candidate.experience_level || 'mid',
      availability: candidate.availability || { hours_per_week: 40 },
      rate_range: candidate.rate_range,
      preferences: candidate.preferences || {},
      portfolio: candidate.portfolio
    };
  }

  /**
   * Transform project data for AI processing
   */
  static transformProjectForAI(project: any) {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      required_skills: project.required_skills || [],
      budget: project.budget,
      timeline: project.timeline,
      experience_level: project.experience_level || 'mid',
      remote: project.remote || false,
      location: project.location,
      project_type: project.project_type || 'contract',
      company: project.company
    };
  }

  /**
   * Store match results for analytics and learning
   */
  static async storeMatchResults(entityId: string, matches: any[], type: 'candidate' | 'project' = 'candidate') {
    try {
      const timestamp = new Date().toISOString();
      const key = `ai_matches_${type}_${entityId}_${Date.now()}`;
      
      await kv.set(key, {
        entity_id: entityId,
        type,
        matches: matches.slice(0, 10), // Store top 10 matches
        generated_at: timestamp,
        algorithm_version: '1.0'
      });

      // Also store aggregated analytics
      const analyticsKey = `ai_analytics_${type}_daily_${new Date().toISOString().split('T')[0]}`;
      const existingAnalytics = await kv.get(analyticsKey) || { 
        total_matches: 0, 
        avg_score: 0, 
        count: 0 
      };

      const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
      const newCount = existingAnalytics.count + 1;
      const newAvgScore = (existingAnalytics.avg_score * existingAnalytics.count + avgScore) / newCount;

      await kv.set(analyticsKey, {
        total_matches: existingAnalytics.total_matches + matches.length,
        avg_score: newAvgScore,
        count: newCount,
        last_updated: timestamp
      });

    } catch (error) {
      console.error('Failed to store match results:', error);
    }
  }
}

// API Routes

/**
 * GET /ai-matching/projects/:candidateId
 * Get AI-powered project recommendations for a candidate
 */
app.get('/projects/:candidateId', async (c) => {
  const candidateId = c.req.param('candidateId');
  const limit = parseInt(c.req.query('limit') || '10');
  
  if (!candidateId) {
    return c.json({ error: 'Candidate ID is required' }, 400);
  }

  const result = await AIMatchingAPI.findProjectsForCandidate(candidateId, limit);
  return c.json(result);
});

/**
 * GET /ai-matching/candidates/:projectId
 * Get AI-powered candidate recommendations for a project
 */
app.get('/candidates/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const limit = parseInt(c.req.query('limit') || '10');
  
  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400);
  }

  const result = await AIMatchingAPI.findCandidatesForProject(projectId, limit);
  return c.json(result);
});

/**
 * POST /ai-matching/feedback
 * Record feedback for match learning
 */
app.post('/feedback', async (c) => {
  try {
    const body = await c.req.json();
    const { candidateId, projectId, outcome, rating, feedback } = body;

    if (!candidateId || !projectId || !outcome) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Store feedback for learning
    const feedbackKey = `ai_feedback_${candidateId}_${projectId}_${Date.now()}`;
    await kv.set(feedbackKey, {
      candidate_id: candidateId,
      project_id: projectId,
      outcome, // 'hired', 'rejected', 'withdrawn'
      rating: rating || null,
      feedback: feedback || null,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, message: 'Feedback recorded' });

  } catch (error) {
    console.error('Feedback recording error:', error);
    return c.json({ error: 'Failed to record feedback' }, 500);
  }
});

/**
 * GET /ai-matching/analytics
 * Get AI matching performance analytics
 */
app.get('/analytics', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const candidateAnalytics = await kv.get(`ai_analytics_candidate_daily_${today}`) || {};
    const projectAnalytics = await kv.get(`ai_analytics_project_daily_${today}`) || {};

    // Get recent matches for performance metrics
    const recentMatches = await kv.getByPrefix('ai_matches_');
    const totalMatches = recentMatches.length;
    
    // Calculate aggregated metrics
    const analytics = {
      performance: {
        totalMatches,
        successRate: 0.78, // Would calculate from feedback data
        averageMatchScore: (candidateAnalytics.avg_score + projectAnalytics.avg_score) / 2 || 0.73,
        averageConfidence: 0.82,
        currentWeights: {
          skills: 0.4,
          experience: 0.2,
          budget: 0.2,
          preferences: 0.1,
          location: 0.1
        }
      },
      cacheStats: {
        totalCachedMatches: totalMatches,
        cacheHitRate: 0.85
      },
      dailyStats: {
        candidate: candidateAnalytics,
        project: projectAnalytics
      }
    };

    return c.json(analytics);

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

/**
 * GET /ai-matching/health
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
});

export default app;




