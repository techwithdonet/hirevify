/**
 * HireVify AI Matching Service
 * 
 * Service layer that integrates the AI matching engine with the Supabase backend
 * and provides caching, analytics, and API endpoints for the matching system.
 */

import { aiMatchingEngine, type MatchResult, type Candidate, type Project } from './matchingEngine';
import { createClient } from '../supabase/client';
import { projectId, publicAnonKey } from '../supabase/info';

export interface CachedMatch {
 id: string;
 candidateId: string;
 projectId: string;
 matchData: MatchResult;
 createdAt: Date;
 expiresAt: Date;
}

export interface MatchAnalytics {
 matchId: string;
 viewed: boolean;
 viewedAt?: Date;
 applied: boolean;
 appliedAt?: Date;
 responded: boolean;
 respondedAt?: Date;
 hired: boolean;
 hiredAt?: Date;
 feedback?: {
 rating: number;
 comment: string;
 submittedAt: Date;
 };
}

class AIMatchingService {
 private supabase = createClient();
 private matchCache = new Map<string, CachedMatch>();
 private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

 /**
 * Find matching candidates for a project with caching and analytics
 */
 async findCandidatesForProject(
 projectId: string, 
 limit: number = 10,
 forceRefresh: boolean = false
 ): Promise<{
 matches: MatchResult[];
 analytics: {
 totalCandidates: number;
 averageScore: number;
 processingTime: number;
 };
 }> {
 const startTime = Date.now();
 
 try {
 // Check cache first (unless force refresh)
 if (!forceRefresh) {
 const cached = await this.getCachedMatches(`project_${projectId}`, limit);
 if (cached.length > 0) {
 console.log(`Returning ${cached.length} cached matches for project ${projectId}`);
 return {
 matches: cached.map(c => c.matchData),
 analytics: {
 totalCandidates: cached.length,
 averageScore: cached.reduce((sum, m) => sum + m.matchData.score, 0) / cached.length,
 processingTime: Date.now() - startTime
 }
 };
 }
 }

 // Fetch project data
 const project = await this.fetchProject(projectId);
 if (!project) {
 throw new Error('Project not found');
 }

 // Fetch available candidates
 const candidates = await this.fetchAvailableCandidates();
 
 // Calculate matches using AI engine
 const matches = aiMatchingEngine.findCandidatesForProject(project, candidates, limit);
 
 // Cache the results
 await this.cacheMatches(matches, 'project');
 
 // Track analytics
 await this.trackMatchGeneration({
 projectId,
 candidateCount: candidates.length,
 matchCount: matches.length,
 averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
 processingTime: Date.now() - startTime
 });

 console.log(`Generated ${matches.length} fresh matches for project ${projectId}`);
 
 return {
 matches,
 analytics: {
 totalCandidates: candidates.length,
 averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
 processingTime: Date.now() - startTime
 }
 };

 } catch (error) {
 console.error('Error finding candidates for project:', error);
 throw error;
 }
 }

 /**
 * Find matching projects for a candidate
 */
 async findProjectsForCandidate(
 candidateId: string, 
 limit: number = 10,
 forceRefresh: boolean = false
 ): Promise<{
 matches: MatchResult[];
 analytics: {
 totalProjects: number;
 averageScore: number;
 processingTime: number;
 };
 }> {
 const startTime = Date.now();
 
 try {
 // Check cache first
 if (!forceRefresh) {
 const cached = await this.getCachedMatches(`candidate_${candidateId}`, limit);
 if (cached.length > 0) {
 console.log(`Returning ${cached.length} cached matches for candidate ${candidateId}`);
 return {
 matches: cached.map(c => c.matchData),
 analytics: {
 totalProjects: cached.length,
 averageScore: cached.reduce((sum, m) => sum + m.matchData.score, 0) / cached.length,
 processingTime: Date.now() - startTime
 }
 };
 }
 }

 // Fetch candidate data
 const candidate = await this.fetchCandidate(candidateId);
 if (!candidate) {
 console.warn(`Error Candidate not found for matching: ${candidateId}`);
 throw new Error(`Candidate not found: ${candidateId}`);
 }

 // Fetch active projects
 const projects = await this.fetchActiveProjects();
 
 // Calculate matches using AI engine
 const matches = aiMatchingEngine.findProjectsForCandidate(candidate, projects, limit);
 
 // Cache the results
 await this.cacheMatches(matches, 'candidate');
 
 // Track analytics
 await this.trackMatchGeneration({
 candidateId,
 projectCount: projects.length,
 matchCount: matches.length,
 averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
 processingTime: Date.now() - startTime
 });

 console.log(`Generated ${matches.length} fresh matches for candidate ${candidateId}`);
 
 return {
 matches,
 analytics: {
 totalProjects: projects.length,
 averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
 processingTime: Date.now() - startTime
 }
 };

 } catch (error) {
 console.error('Error finding projects for candidate:', error);
 throw error;
 }
 }

 /**
 * Get detailed match analysis for a specific candidate-project pair
 */
 async getDetailedMatch(candidateId: string, projectId: string): Promise<MatchResult | null> {
 try {
 const candidate = await this.fetchCandidate(candidateId);
 const project = await this.fetchProject(projectId);
 
 if (!candidate ||!project) {
 return null;
 }

 const match = aiMatchingEngine.calculateMatch(candidate, project);
 
 // Track detailed view
 await this.trackMatchInteraction(candidateId, projectId, 'detailed_view');
 
 return match;
 } catch (error) {
 console.error('Error getting detailed match:', error);
 return null;
 }
 }

 /**
 * Record match interaction for learning
 */
 async recordMatchInteraction(
 candidateId: string,
 projectId: string,
 interaction: 'viewed' | 'applied' | 'responded' | 'hired' | 'rejected',
 feedback?: { rating: number; comment: string }
 ): Promise<void> {
 try {
 // Track the interaction
 await this.trackMatchInteraction(candidateId, projectId, interaction, feedback);
 
 // Get the match result for learning
 const match = await this.getDetailedMatch(candidateId, projectId);
 if (match) {
 // Provide feedback to the learning algorithm
 if (interaction === 'hired') {
 aiMatchingEngine.learnFromOutcome(match, 'hired', feedback?.comment);
 } else if (interaction === 'rejected') {
 aiMatchingEngine.learnFromOutcome(match, 'rejected', feedback?.comment);
 }
 }
 } catch (error) {
 console.error('Error recording match interaction:', error);
 }
 }

 /**
 * Get AI matching performance metrics
 */
 getMatchingMetrics(): {
 performance: ReturnType<typeof aiMatchingEngine.getPerformanceMetrics>;
 cacheStats: {
 totalCachedMatches: number;
 cacheHitRate: number;
 };
 } {
 const performance = aiMatchingEngine.getPerformanceMetrics();
 const cacheStats = {
 totalCachedMatches: this.matchCache.size,
 cacheHitRate: 0.85 // Placeholder - would track this in real implementation
 };

 return { performance, cacheStats };
 }

 // Private helper methods

 private async fetchProject(projectId: string): Promise<Project | null> {
 try {
 // This would integrate with your existing project API
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/projects/${projectId}`, {
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 }
 });

 if (!response.ok) {
 console.error('Failed to fetch project:', response.statusText);
 return null;
 }

 const projectData = await response.json();
 
 // Transform to AI engine format
 return this.transformProjectData(projectData);
 } catch (error) {
 console.error('Error fetching project:', error);
 return null;
 }
 }

 private async fetchCandidate(candidateId: string): Promise<Candidate | null> {
 try {
 // This would integrate with your user profile system
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/candidates/${candidateId}`, {
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 }
 });

 if (!response.ok) {
 const errorText = await response.text();
 console.error(`Failed to fetch candidate ${candidateId}:`, response.statusText, errorText);
 return null;
 }

 const result = await response.json();
 
 if (!result.success ||!result.candidate) {
 console.error(`Candidate not found: ${candidateId}`, result.error || 'Unknown error');
 return null;
 }

 // Transform to AI engine format
 return this.transformCandidateData(result.candidate);
 } catch (error) {
 console.error(`Error fetching candidate ${candidateId}:`, error);
 return null;
 }
 }

 private async fetchAvailableCandidates(): Promise<Candidate[]> {
 try {
 // Fetch all active candidates
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/candidates`, {
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 }
 });

 if (!response.ok) {
 const errorText = await response.text();
 console.error('Failed to fetch candidates:', response.statusText, errorText);
 return [];
 }

 const result = await response.json();
 
 if (!result.success ||!result.candidates) {
 console.error('No candidates found or request failed:', result.error || 'Unknown error');
 return [];
 }

 console.log(`Done Fetched ${result.candidates.length} candidates for matching`);
 
 // Transform to AI engine format
 return result.candidates.map((candidate: any) => this.transformCandidateData(candidate));
 } catch (error) {
 console.error('Error fetching candidates:', error);
 return [];
 }
 }

 private async fetchActiveProjects(): Promise<Project[]> {
 try {
 // Fetch all active projects
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/projects`, {
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 }
 });

 if (!response.ok) {
 console.error('Failed to fetch projects:', response.statusText);
 return [];
 }

 const projectsData = await response.json();
 
 // Transform to AI engine format
 return projectsData.map((project: any) => this.transformProjectData(project));
 } catch (error) {
 console.error('Error fetching projects:', error);
 return [];
 }
 }

 private transformProjectData(projectData: any): Project {
 // Transform your existing project data structure to AI engine format
 return {
 id: projectData.id,
 title: projectData.title,
 description: projectData.description,
 requiredSkills: (projectData.required_skills || []).map((skill: any) => ({
 name: skill.name || skill,
 level: skill.level || 'intermediate',
 weight: skill.weight || 1
 })),
 preferredSkills: (projectData.preferred_skills || []).map((skill: any) => ({
 name: skill.name || skill,
 level: skill.level || 'intermediate',
 weight: skill.weight || 0.5
 })),
 budget: projectData.budget? {
 min: projectData.budget.min || 0,
 max: projectData.budget.max || 0,
 currency: projectData.budget.currency || 'USD'
 }: undefined,
 timeline: projectData.timeline? {
 duration: projectData.timeline.duration || 4,
 unit: projectData.timeline.unit || 'weeks',
 urgency: projectData.timeline.urgency || 'medium'
 }: undefined,
 experienceLevel: projectData.experience_level || 'mid',
 remote: projectData.remote || false,
 location: projectData.location,
 industry: projectData.industry,
 projectType: projectData.project_type || 'contract',
 companySize: projectData.company_size
 };
 }

 private transformCandidateData(candidateData: any): Candidate {
 // Transform your existing candidate data structure to AI engine format
 return {
 id: candidateData.id,
 name: candidateData.name || candidateData.full_name,
 email: candidateData.email,
 skills: (candidateData.skills || []).map((skill: any) => ({
 name: skill.name || skill,
 level: skill.level || 'intermediate',
 yearsOfExperience: skill.years_of_experience,
 verified: skill.verified || false
 })),
 experienceLevel: candidateData.experience_level || 'mid',
 availability: {
 hoursPerWeek: candidateData.availability?.hours_per_week || 40,
 startDate: candidateData.availability?.start_date? new Date(candidateData.availability.start_date): new Date(),
 preferredDuration: candidateData.availability?.preferred_duration
 },
 rateRange: candidateData.rate_range? {
 min: candidateData.rate_range.min,
 max: candidateData.rate_range.max,
 currency: candidateData.rate_range.currency || 'USD'
 }: undefined,
 preferences: {
 remote: candidateData.preferences?.remote || false,
 preferredLocations: candidateData.preferences?.preferred_locations || [],
 industries: candidateData.preferences?.industries || [],
 projectTypes: candidateData.preferences?.project_types || ['contract'],
 companySizes: candidateData.preferences?.company_sizes || []
 },
 portfolio: candidateData.portfolio? {
 projects: candidateData.portfolio.projects_count || 0,
 successRate: candidateData.portfolio.success_rate || 0.8,
 avgRating: candidateData.portfolio.avg_rating || 4.0
 }: undefined
 };
 }

 private async getCachedMatches(key: string, limit: number): Promise<CachedMatch[]> {
 const cached = Array.from(this.matchCache.values()).filter(match => 
 match.id.includes(key) && 
 match.expiresAt > new Date()
 ).slice(0, limit);

 return cached;
 }

 private async cacheMatches(matches: MatchResult[], type: 'project' | 'candidate'): Promise<void> {
 matches.forEach(match => {
 const key = type === 'project'? `project_${match.projectId}_${match.candidateId}`: `candidate_${match.candidateId}_${match.projectId}`;
 
 const cachedMatch: CachedMatch = {
 id: key,
 candidateId: match.candidateId,
 projectId: match.projectId,
 matchData: match,
 createdAt: new Date(),
 expiresAt: new Date(Date.now() + this.cacheExpiry)
 };

 this.matchCache.set(key, cachedMatch);
 });

 // Clean up expired cache entries
 this.cleanupCache();
 }

 private cleanupCache(): void {
 const now = new Date();
 for (const [key, match] of this.matchCache.entries()) {
 if (match.expiresAt <= now) {
 this.matchCache.delete(key);
 }
 }
 }

 private async trackMatchGeneration(data: any): Promise<void> {
 try {
 // Store analytics in your backend
 await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/analytics/matches`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 type: 'match_generation',
 data,
 timestamp: new Date().toISOString()
 })
 });
 } catch (error) {
 console.error('Error tracking match generation:', error);
 }
 }

 private async trackMatchInteraction(
 candidateId: string, 
 projectId: string, 
 interaction: string,
 feedback?: { rating: number; comment: string }
 ): Promise<void> {
 try {
 // Store interaction analytics
 await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/analytics/interactions`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${publicAnonKey}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 candidate_id: candidateId,
 project_id: projectId,
 interaction,
 feedback,
 timestamp: new Date().toISOString()
 })
 });
 } catch (error) {
 console.error('Error tracking match interaction:', error);
 }
 }
}

// Singleton instance for the application
export const aiMatchingService = new AIMatchingService();






