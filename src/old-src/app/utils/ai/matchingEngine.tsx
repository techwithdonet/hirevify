/**
 * HireVify AI Matching Engine
 * 
 * A sophisticated matching system that analyzes skills, project requirements,
 * and user preferences to provide intelligent candidate-project matching
 * with continuous learning capabilities.
 */

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  verified?: boolean;
  weight?: number; // For required vs preferred skills
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: Skill[];
  preferredSkills?: Skill[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  timeline?: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
    urgency: 'low' | 'medium' | 'high';
  };
  experienceLevel: 'entry' | 'mid' | 'senior' | 'expert';
  remote: boolean;
  location?: string;
  industry?: string;
  projectType: 'full-time' | 'contract' | 'freelance' | 'internship';
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'expert';
  availability: {
    hoursPerWeek: number;
    startDate: Date;
    preferredDuration?: number;
  };
  rateRange?: {
    min: number;
    max: number;
    currency: string;
  };
  preferences: {
    remote: boolean;
    preferredLocations?: string[];
    industries?: string[];
    projectTypes: ('full-time' | 'contract' | 'freelance' | 'internship')[];
    companySizes?: ('startup' | 'small' | 'medium' | 'large' | 'enterprise')[];
  };
  portfolio?: {
    projects: number;
    successRate: number;
    avgRating: number;
  };
}

export interface MatchResult {
  candidateId: string;
  projectId: string;
  score: number;
  confidence: number;
  factors: {
    skillsMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    budgetMatch: number;
    preferencesMatch: number;
    locationMatch: number;
  };
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

export interface MatchingWeights {
  skills: number;
  experience: number;
  availability: number;
  budget: number;
  preferences: number;
  location: number;
}

export class AIMatchingEngine {
  private weights: MatchingWeights = {
    skills: 0.35,
    experience: 0.25,
    availability: 0.15,
    budget: 0.15,
    preferences: 0.07,
    location: 0.03
  };

  private learningData: {
    successfulMatches: MatchResult[];
    failedMatches: MatchResult[];
    userFeedback: Array<{
      matchId: string;
      rating: number;
      feedback: string;
      outcome: 'hired' | 'rejected' | 'withdrawn';
    }>;
  } = {
    successfulMatches: [],
    failedMatches: [],
    userFeedback: []
  };

  /**
   * Core matching algorithm that calculates compatibility between candidate and project
   */
  calculateMatch(candidate: Candidate, project: Project): MatchResult {
    const factors = {
      skillsMatch: this.calculateSkillsMatch(candidate.skills, project.requiredSkills, project.preferredSkills),
      experienceMatch: this.calculateExperienceMatch(candidate.experienceLevel, project.experienceLevel),
      availabilityMatch: this.calculateAvailabilityMatch(candidate.availability, project.timeline),
      budgetMatch: this.calculateBudgetMatch(candidate.rateRange, project.budget),
      preferencesMatch: this.calculatePreferencesMatch(candidate.preferences, project),
      locationMatch: this.calculateLocationMatch(candidate.preferences, project)
    };

    // Calculate weighted score
    const score = Object.entries(factors).reduce((total, [key, value]) => {
      const weight = this.weights[key as keyof MatchingWeights];
      return total + (value * weight);
    }, 0);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(candidate, project, factors);

    // Generate insights
    const { strengths, concerns, recommendations } = this.generateInsights(factors, candidate, project);

    return {
      candidateId: candidate.id,
      projectId: project.id,
      score: Math.round(score * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      strengths,
      concerns,
      recommendations
    };
  }

  /**
   * Advanced skills matching using cosine similarity and weighted importance
   */
  private calculateSkillsMatch(
    candidateSkills: Skill[], 
    requiredSkills: Skill[], 
    preferredSkills: Skill[] = []
  ): number {
    if (requiredSkills.length === 0) return 1;

    // Create skill maps for easy lookup
    const candidateSkillMap = new Map(
      candidateSkills.map(skill => [skill.name.toLowerCase(), skill])
    );

    // Calculate required skills match (higher weight)
    let requiredScore = 0;
    let requiredWeight = 0;

    for (const reqSkill of requiredSkills) {
      const skillName = reqSkill.name.toLowerCase();
      const candidateSkill = candidateSkillMap.get(skillName);
      const skillWeight = reqSkill.weight || 1;
      
      requiredWeight += skillWeight;

      if (candidateSkill) {
        // Calculate skill level match
        const levelScore = this.getSkillLevelScore(candidateSkill.level, reqSkill.level);
        // Add bonus for verified skills
        const verificationBonus = candidateSkill.verified ? 0.1 : 0;
        // Add bonus for years of experience
        const experienceBonus = this.calculateExperienceBonus(candidateSkill.yearsOfExperience);
        
        requiredScore += (levelScore + verificationBonus + experienceBonus) * skillWeight;
      }
    }

    // Calculate preferred skills match (lower weight)
    let preferredScore = 0;
    let preferredWeight = 0;

    for (const prefSkill of preferredSkills) {
      const skillName = prefSkill.name.toLowerCase();
      const candidateSkill = candidateSkillMap.get(skillName);
      const skillWeight = (prefSkill.weight || 1) * 0.5; // Preferred skills have lower weight
      
      preferredWeight += skillWeight;

      if (candidateSkill) {
        const levelScore = this.getSkillLevelScore(candidateSkill.level, prefSkill.level);
        const verificationBonus = candidateSkill.verified ? 0.1 : 0;
        const experienceBonus = this.calculateExperienceBonus(candidateSkill.yearsOfExperience);
        
        preferredScore += (levelScore + verificationBonus + experienceBonus) * skillWeight;
      }
    }

    // Combine scores with weights
    const totalPossibleScore = requiredWeight + preferredWeight;
    const actualScore = requiredScore + preferredScore;

    return totalPossibleScore > 0 ? Math.min(actualScore / totalPossibleScore, 1) : 0;
  }

  private getSkillLevelScore(candidateLevel: string, requiredLevel: string): number {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const candidateLevelNum = levels[candidateLevel as keyof typeof levels] || 1;
    const requiredLevelNum = levels[requiredLevel as keyof typeof levels] || 1;

    if (candidateLevelNum >= requiredLevelNum) {
      return 1; // Perfect match or overqualified
    } else {
      return candidateLevelNum / requiredLevelNum; // Partial match
    }
  }

  private calculateExperienceBonus(yearsOfExperience?: number): number {
    if (!yearsOfExperience) return 0;
    return Math.min(yearsOfExperience / 10, 0.1); // Max 10% bonus for 10+ years
  }

  /**
   * Calculate experience level compatibility
   */
  private calculateExperienceMatch(candidateLevel: string, projectLevel: string): number {
    const levels = { 'entry': 1, 'mid': 2, 'senior': 3, 'expert': 4 };
    const candidateLevelNum = levels[candidateLevel as keyof typeof levels] || 1;
    const projectLevelNum = levels[projectLevel as keyof typeof levels] || 1;

    if (candidateLevelNum === projectLevelNum) {
      return 1; // Perfect match
    } else if (candidateLevelNum > projectLevelNum) {
      // Overqualified - slight penalty
      return Math.max(0.8, 1 - (candidateLevelNum - projectLevelNum) * 0.1);
    } else {
      // Underqualified - larger penalty
      return Math.max(0.3, candidateLevelNum / projectLevelNum);
    }
  }

  /**
   * Calculate availability and timeline compatibility
   */
  private calculateAvailabilityMatch(
    availability: Candidate['availability'], 
    timeline?: Project['timeline']
  ): number {
    if (!timeline) return 1;

    let score = 1;

    // Check start date compatibility
    const daysUntilAvailable = Math.ceil(
      (availability.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilAvailable > 0) {
      if (timeline.urgency === 'high' && daysUntilAvailable > 7) {
        score *= 0.5; // Significant penalty for urgent projects
      } else if (timeline.urgency === 'medium' && daysUntilAvailable > 14) {
        score *= 0.7;
      } else if (daysUntilAvailable > 30) {
        score *= 0.8;
      }
    }

    // Check duration compatibility
    if (availability.preferredDuration && timeline.duration) {
      const timelineInWeeks = timeline.unit === 'days' ? timeline.duration / 7 :
                            timeline.unit === 'weeks' ? timeline.duration :
                            timeline.duration * 4; // months to weeks

      const durationDiff = Math.abs(availability.preferredDuration - timelineInWeeks);
      const durationCompatibility = Math.max(0.5, 1 - (durationDiff / timelineInWeeks) * 0.5);
      score *= durationCompatibility;
    }

    return Math.max(score, 0.1);
  }

  /**
   * Calculate budget compatibility
   */
  private calculateBudgetMatch(
    candidateRate?: Candidate['rateRange'], 
    projectBudget?: Project['budget']
  ): number {
    if (!candidateRate || !projectBudget) return 0.8; // Neutral score when data missing

    if (candidateRate.currency !== projectBudget.currency) {
      return 0.7; // Currency mismatch penalty
    }

    const candidateMin = candidateRate.min;
    const candidateMax = candidateRate.max;
    const budgetMin = projectBudget.min;
    const budgetMax = projectBudget.max;

    // Check for overlap
    if (candidateMax < budgetMin) {
      // Candidate too expensive
      return Math.max(0.1, budgetMin / candidateMax);
    } else if (candidateMin > budgetMax) {
      // Budget too low
      return Math.max(0.1, budgetMax / candidateMin);
    } else {
      // There's overlap - calculate quality of match
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
  private calculatePreferencesMatch(preferences: Candidate['preferences'], project: Project): number {
    let score = 1;
    let factors = 0;

    // Remote work preference
    factors++;
    if (preferences.remote === project.remote) {
      score *= 1; // Perfect match
    } else if (preferences.remote && !project.remote) {
      score *= 0.3; // Candidate wants remote, project is onsite
    } else {
      score *= 0.7; // Candidate okay with onsite, project is remote
    }

    // Project type preference
    factors++;
    if (preferences.projectTypes.includes(project.projectType)) {
      score *= 1;
    } else {
      score *= 0.5; // Project type not preferred
    }

    // Industry preference
    if (preferences.industries && project.industry) {
      factors++;
      if (preferences.industries.includes(project.industry)) {
        score *= 1;
      } else {
        score *= 0.8; // Different industry
      }
    }

    // Company size preference
    if (preferences.companySizes && project.companySize) {
      factors++;
      if (preferences.companySizes.includes(project.companySize)) {
        score *= 1;
      } else {
        score *= 0.9; // Different company size (less critical)
      }
    }

    return Math.max(score, 0.1);
  }

  /**
   * Calculate location compatibility
   */
  private calculateLocationMatch(preferences: Candidate['preferences'], project: Project): number {
    if (project.remote) return 1; // Location irrelevant for remote work

    if (!preferences.preferredLocations || !project.location) {
      return 0.8; // Neutral when location data missing
    }

    // Simple location matching - in real implementation, use geolocation API
    const isLocationMatch = preferences.preferredLocations.some(loc => 
      project.location?.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(project.location?.toLowerCase() || '')
    );

    return isLocationMatch ? 1 : 0.3;
  }

  /**
   * Calculate confidence score based on data completeness and quality
   */
  private calculateConfidence(candidate: Candidate, project: Project, factors: MatchResult['factors']): number {
    let completenessScore = 0;
    let totalFactors = 0;

    // Skills data completeness
    totalFactors++;
    if (candidate.skills.length > 0 && project.requiredSkills.length > 0) {
      const verifiedSkills = candidate.skills.filter(s => s.verified).length;
      completenessScore += 0.7 + (verifiedSkills / candidate.skills.length) * 0.3;
    } else {
      completenessScore += 0.3;
    }

    // Experience data
    totalFactors++;
    completenessScore += 1;

    // Availability data
    totalFactors++;
    if (project.timeline) {
      completenessScore += 1;
    } else {
      completenessScore += 0.6;
    }

    // Budget data
    totalFactors++;
    if (candidate.rateRange && project.budget) {
      completenessScore += 1;
    } else {
      completenessScore += 0.4;
    }

    // Portfolio data bonus
    if (candidate.portfolio && candidate.portfolio.projects > 0) {
      completenessScore += 0.2;
    }

    const baseConfidence = completenessScore / totalFactors;
    
    // Adjust confidence based on match quality
    const avgFactorScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    
    return Math.min(baseConfidence + (avgFactorScore * 0.2), 1);
  }

  /**
   * Generate human-readable insights about the match
   */
  private generateInsights(
    factors: MatchResult['factors'], 
    candidate: Candidate, 
    project: Project
  ): { strengths: string[]; concerns: string[]; recommendations: string[] } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze each factor
    if (factors.skillsMatch > 0.8) {
      strengths.push("Excellent skills alignment with project requirements");
    } else if (factors.skillsMatch < 0.5) {
      concerns.push("Significant skills gap for required technologies");
      recommendations.push("Consider skills assessment or additional training");
    }

    if (factors.experienceMatch > 0.9) {
      strengths.push("Perfect experience level match for project complexity");
    } else if (factors.experienceMatch < 0.6) {
      if (candidate.experienceLevel === 'entry' || candidate.experienceLevel === 'mid') {
        concerns.push("May lack experience for project complexity");
        recommendations.push("Consider mentorship or closer supervision");
      } else {
        concerns.push("Candidate may be overqualified for this role");
        recommendations.push("Discuss growth opportunities and project scope");
      }
    }

    if (factors.budgetMatch > 0.8) {
      strengths.push("Budget expectations align well with project budget");
    } else if (factors.budgetMatch < 0.5) {
      concerns.push("Budget mismatch may require negotiation");
      recommendations.push("Discuss flexible compensation or project scope adjustments");
    }

    if (factors.availabilityMatch < 0.6) {
      concerns.push("Availability timing may not align with project needs");
      recommendations.push("Discuss flexible start dates or timeline adjustments");
    }

    // Portfolio-based insights
    if (candidate.portfolio) {
      if (candidate.portfolio.successRate > 0.9) {
        strengths.push(`High success rate (${Math.round(candidate.portfolio.successRate * 100)}%) in previous projects`);
      }
      if (candidate.portfolio.avgRating > 4.5) {
        strengths.push(`Excellent client ratings (${candidate.portfolio.avgRating}/5.0)`);
      }
    }

    return { strengths, concerns, recommendations };
  }

  /**
   * Find best matches for a project from a pool of candidates
   */
  findCandidatesForProject(project: Project, candidates: Candidate[], limit: number = 10): MatchResult[] {
    const matches = candidates.map(candidate => this.calculateMatch(candidate, project));
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find best projects for a candidate
   */
  findProjectsForCandidate(candidate: Candidate, projects: Project[], limit: number = 10): MatchResult[] {
    const matches = projects.map(project => this.calculateMatch(candidate, project));
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Learn from successful matches to improve algorithm
   */
  learnFromOutcome(matchResult: MatchResult, outcome: 'hired' | 'rejected' | 'withdrawn', feedback?: string): void {
    if (outcome === 'hired') {
      this.learningData.successfulMatches.push(matchResult);
      this.optimizeWeights();
    } else {
      this.learningData.failedMatches.push(matchResult);
    }

    if (feedback) {
      this.learningData.userFeedback.push({
        matchId: `${matchResult.candidateId}-${matchResult.projectId}`,
        rating: outcome === 'hired' ? 5 : outcome === 'rejected' ? 1 : 3,
        feedback,
        outcome
      });
    }
  }

  /**
   * Optimize weights based on successful matches
   */
  private optimizeWeights(): void {
    if (this.learningData.successfulMatches.length < 10) return; // Need sufficient data

    // Analyze successful matches to adjust weights
    const successfulFactors = this.learningData.successfulMatches.map(match => match.factors);
    
    // Calculate correlation between factor scores and success
    const factorImportance = {
      skills: this.calculateFactorImportance(successfulFactors, 'skillsMatch'),
      experience: this.calculateFactorImportance(successfulFactors, 'experienceMatch'),
      availability: this.calculateFactorImportance(successfulFactors, 'availabilityMatch'),
      budget: this.calculateFactorImportance(successfulFactors, 'budgetMatch'),
      preferences: this.calculateFactorImportance(successfulFactors, 'preferencesMatch'),
      location: this.calculateFactorImportance(successfulFactors, 'locationMatch')
    };

    // Normalize and update weights (gradual adjustment)
    const total = Object.values(factorImportance).reduce((a, b) => a + b, 0);
    Object.entries(factorImportance).forEach(([key, importance]) => {
      const newWeight = importance / total;
      const currentWeight = this.weights[key as keyof MatchingWeights];
      // Gradual adjustment (learning rate = 0.1)
      this.weights[key as keyof MatchingWeights] = currentWeight * 0.9 + newWeight * 0.1;
    });
  }

  private calculateFactorImportance(factors: MatchResult['factors'][], factorName: keyof MatchResult['factors']): number {
    const scores = factors.map(f => f[factorName]);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(average, 0.1); // Minimum importance threshold
  }

  /**
   * Get current algorithm performance metrics
   */
  getPerformanceMetrics(): {
    totalMatches: number;
    successRate: number;
    averageMatchScore: number;
    averageConfidence: number;
    currentWeights: MatchingWeights;
  } {
    const totalMatches = this.learningData.successfulMatches.length + this.learningData.failedMatches.length;
    const successRate = totalMatches > 0 ? this.learningData.successfulMatches.length / totalMatches : 0;
    
    const allMatches = [...this.learningData.successfulMatches, ...this.learningData.failedMatches];
    const averageMatchScore = allMatches.length > 0 ? 
      allMatches.reduce((sum, match) => sum + match.score, 0) / allMatches.length : 0;
    
    const averageConfidence = allMatches.length > 0 ? 
      allMatches.reduce((sum, match) => sum + match.confidence, 0) / allMatches.length : 0;

    return {
      totalMatches,
      successRate,
      averageMatchScore,
      averageConfidence,
      currentWeights: { ...this.weights }
    };
  }
}

// Singleton instance for the application
export const aiMatchingEngine = new AIMatchingEngine();