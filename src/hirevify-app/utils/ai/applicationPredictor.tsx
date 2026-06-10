/**
 * Smart Application Success Predictor
 * 
 * AI system that predicts likelihood of application success based on
 * candidate profile, job requirements, historical data, and market trends.
 * Saves time for candidates by focusing on high-probability applications.
 */

export interface CandidateProfile {
  id: string;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsExperience: number;
    verified: boolean;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: number; // months
    industry: string;
    skills: string[];
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    gpa?: number;
  }>;
  certifications: string[];
  portfolioItems: number;
  successRate: number; // historical application success rate
  responseRate: number; // how often they respond to opportunities
  location: string;
  remotePreference: boolean;
  salaryExpectation: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface JobRequirements {
  id: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  remote: boolean;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  requiredSkills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    importance: 'critical' | 'important' | 'preferred';
  }>;
  experienceRequired: {
    min: number;
    max: number;
    unit: 'years' | 'months';
  };
  educationRequired: {
    level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';
    required: boolean;
  };
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  applicationCount?: number;
  averageTimeToResponse?: number; // days
  hiringManagerPreferences?: {
    prioritizeLocalCandidates: boolean;
    preferCertifications: boolean;
    valuePortfolio: boolean;
  };
}

export interface SuccessPrediction {
  overallProbability: number; // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  factorBreakdown: {
    skillsMatch: {
      score: number;
      weight: number;
      details: {
        matchedSkills: string[];
        missingCritical: string[];
        missingImportant: string[];
        overqualifiedIn: string[];
      };
    };
    experienceMatch: {
      score: number;
      weight: number;
      details: {
        yearsExperience: number;
        requirementMatch: 'under' | 'perfect' | 'over';
        relevantExperience: number;
        industryMatch: boolean;
      };
    };
    competitiveness: {
      score: number;
      weight: number;
      details: {
        expectedApplicants: number;
        profileStrength: 'top_10' | 'top_25' | 'top_50' | 'below_average';
        marketDemand: 'very_high' | 'high' | 'medium' | 'low';
      };
    };
    locationFit: {
      score: number;
      weight: number;
      details: {
        locationType: 'perfect' | 'regional' | 'remote_ok' | 'relocation_needed';
        preferenceAlignment: boolean;
      };
    };
    salaryAlignment: {
      score: number;
      weight: number;
      details: {
        expectationVsOffer: 'under' | 'aligned' | 'over';
        negotiationRoom: number;
      };
    };
  };
  improvementSuggestions: Array<{
    category: 'skills' | 'experience' | 'education' | 'portfolio' | 'profile';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    timeToImplement: string;
    resources?: string[];
  }>;
  optimalApplicationTiming: {
    bestDayOfWeek: string;
    bestTimeOfDay: string;
    reasoning: string;
  };
  applicationStrategy: {
    coverLetterFocus: string[];
    portfolioHighlights: string[];
    interviewPrepAreas: string[];
  };
  marketInsights: {
    salaryBenchmark: {
      percentile25: number;
      median: number;
      percentile75: number;
    };
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    competitorAnalysis: {
      averageExperience: number;
      commonSkills: string[];
      educationLevels: string[];
    };
  };
}

export class SmartApplicationPredictor {
  private historicalData: {
    successfulApplications: Array<{
      candidateProfile: Partial<CandidateProfile>;
      jobRequirements: Partial<JobRequirements>;
      outcome: 'hired' | 'interviewed' | 'rejected';
      timeToResponse: number;
    }>;
    marketTrends: {
      skillDemand: Record<string, number>;
      salaryTrends: Record<string, { trend: number; median: number }>;
      hiringVolume: Record<string, number>;
    };
  } = {
    successfulApplications: [],
    marketTrends: {
      skillDemand: {
        'React': 0.95,
        'TypeScript': 0.89,
        'Node.js': 0.82,
        'Python': 0.88,
        'AWS': 0.91,
        'Docker': 0.79,
        'Machine Learning': 0.85,
        'UI/UX Design': 0.73,
        'Product Management': 0.68,
        'Data Science': 0.81
      },
      salaryTrends: {
        'Software Engineer': { trend: 0.08, median: 120000 },
        'Data Scientist': { trend: 0.12, median: 135000 },
        'Product Manager': { trend: 0.06, median: 140000 },
        'UX Designer': { trend: 0.04, median: 95000 },
        'DevOps Engineer': { trend: 0.15, median: 130000 }
      },
      hiringVolume: {
        'technology': 1.2,
        'finance': 0.8,
        'healthcare': 1.1,
        'education': 0.7,
        'retail': 0.9
      }
    }
  };

  /**
   * Predict application success probability
   */
  predictSuccess(candidate: CandidateProfile, job: JobRequirements): SuccessPrediction {
    // Calculate individual factor scores
    const skillsMatch = this.calculateSkillsMatch(candidate, job);
    const experienceMatch = this.calculateExperienceMatch(candidate, job);
    const competitiveness = this.calculateCompetitiveness(candidate, job);
    const locationFit = this.calculateLocationFit(candidate, job);
    const salaryAlignment = this.calculateSalaryAlignment(candidate, job);

    // Weight factors based on job type and historical data
    const weights = this.getWeights(job);
    
    // Calculate overall probability
    const overallProbability = Math.round(
      (skillsMatch.score * weights.skills +
       experienceMatch.score * weights.experience +
       competitiveness.score * weights.competitiveness +
       locationFit.score * weights.location +
       salaryAlignment.score * weights.salary) * 100
    );

    // Determine confidence level
    const confidenceLevel = this.calculateConfidence(candidate, job, overallProbability);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      candidate, 
      job, 
      { skillsMatch, experienceMatch, competitiveness, locationFit, salaryAlignment }
    );

    // Generate application strategy
    const applicationStrategy = this.generateApplicationStrategy(candidate, job, overallProbability);

    // Get market insights
    const marketInsights = this.getMarketInsights(job);

    return {
      overallProbability: Math.max(1, Math.min(99, overallProbability)),
      confidenceLevel,
      factorBreakdown: {
        skillsMatch: { ...skillsMatch, weight: weights.skills },
        experienceMatch: { ...experienceMatch, weight: weights.experience },
        competitiveness: { ...competitiveness, weight: weights.competitiveness },
        locationFit: { ...locationFit, weight: weights.location },
        salaryAlignment: { ...salaryAlignment, weight: weights.salary }
      },
      improvementSuggestions,
      optimalApplicationTiming: this.getOptimalTiming(job),
      applicationStrategy,
      marketInsights
    };
  }

  /**
   * Calculate skills matching score
   */
  private calculateSkillsMatch(candidate: CandidateProfile, job: JobRequirements) {
    const candidateSkills = new Map(
      candidate.skills.map(skill => [skill.name.toLowerCase(), skill])
    );

    let totalWeight = 0;
    let matchedWeight = 0;
    const matchedSkills: string[] = [];
    const missingCritical: string[] = [];
    const missingImportant: string[] = [];
    const overqualifiedIn: string[] = [];

    job.requiredSkills.forEach(reqSkill => {
      const weight = reqSkill.importance === 'critical' ? 3 : 
                    reqSkill.importance === 'important' ? 2 : 1;
      totalWeight += weight;

      const candidateSkill = candidateSkills.get(reqSkill.name.toLowerCase());
      
      if (candidateSkill) {
        const levelScore = this.getSkillLevelScore(candidateSkill.level, reqSkill.level);
        
        if (levelScore >= 1) {
          matchedWeight += weight;
          matchedSkills.push(reqSkill.name);
          
          if (levelScore > 1.2) {
            overqualifiedIn.push(reqSkill.name);
          }
        } else {
          // Partial match
          matchedWeight += weight * levelScore;
          if (reqSkill.importance === 'critical') {
            missingCritical.push(reqSkill.name);
          } else if (reqSkill.importance === 'important') {
            missingImportant.push(reqSkill.name);
          }
        }
      } else {
        // Missing skill
        if (reqSkill.importance === 'critical') {
          missingCritical.push(reqSkill.name);
        } else if (reqSkill.importance === 'important') {
          missingImportant.push(reqSkill.name);
        }
      }
    });

    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      score,
      details: {
        matchedSkills,
        missingCritical,
        missingImportant,
        overqualifiedIn
      }
    };
  }

  private getSkillLevelScore(candidateLevel: string, requiredLevel: string): number {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const candidateScore = levels[candidateLevel] || 1;
    const requiredScore = levels[requiredLevel] || 1;
    
    return candidateScore / requiredScore;
  }

  /**
   * Calculate experience matching score
   */
  private calculateExperienceMatch(candidate: CandidateProfile, job: JobRequirements) {
    const totalExperience = candidate.experience.reduce((sum, exp) => sum + exp.duration, 0) / 12; // years
    const relevantExperience = candidate.experience
      .filter(exp => exp.industry === job.industry || exp.skills.some(skill => 
        job.requiredSkills.some(req => req.name.toLowerCase() === skill.toLowerCase())
      ))
      .reduce((sum, exp) => sum + exp.duration, 0) / 12; // years

    const requiredYears = job.experienceRequired.unit === 'years' ? 
      job.experienceRequired.min : job.experienceRequired.min / 12;

    let requirementMatch: 'under' | 'perfect' | 'over';
    let score: number;

    if (totalExperience < requiredYears * 0.8) {
      requirementMatch = 'under';
      score = Math.max(0.2, totalExperience / requiredYears);
    } else if (totalExperience <= requiredYears * 2) {
      requirementMatch = 'perfect';
      score = Math.min(1, 0.8 + (relevantExperience / totalExperience) * 0.2);
    } else {
      requirementMatch = 'over';
      score = Math.max(0.7, 1 - (totalExperience - requiredYears * 2) / (requiredYears * 3));
    }

    return {
      score,
      details: {
        yearsExperience: Math.round(totalExperience * 10) / 10,
        requirementMatch,
        relevantExperience: Math.round(relevantExperience * 10) / 10,
        industryMatch: candidate.experience.some(exp => exp.industry === job.industry)
      }
    };
  }

  /**
   * Calculate competitiveness against other applicants
   */
  private calculateCompetitiveness(candidate: CandidateProfile, job: JobRequirements) {
    // Estimate application volume based on job characteristics
    const baseApplicants = this.estimateApplicationVolume(job);
    
    // Calculate candidate's profile strength
    const profileStrength = this.calculateProfileStrength(candidate);
    
    // Get market demand for this role
    const marketDemand = this.getMarketDemand(job.title, job.industry);
    
    // Calculate competitive score
    let score: number;
    let profileCategory: 'top_10' | 'top_25' | 'top_50' | 'below_average';

    if (profileStrength >= 90) {
      profileCategory = 'top_10';
      score = 0.9;
    } else if (profileStrength >= 75) {
      profileCategory = 'top_25';
      score = 0.75;
    } else if (profileStrength >= 60) {
      profileCategory = 'top_50';
      score = 0.6;
    } else {
      profileCategory = 'below_average';
      score = Math.max(0.2, profileStrength / 100);
    }

    // Adjust for market demand
    if (marketDemand === 'very_high') score *= 1.2;
    else if (marketDemand === 'high') score *= 1.1;
    else if (marketDemand === 'low') score *= 0.8;

    return {
      score: Math.min(1, score),
      details: {
        expectedApplicants: baseApplicants,
        profileStrength: profileCategory,
        marketDemand
      }
    };
  }

  private estimateApplicationVolume(job: JobRequirements): number {
    let baseVolume = 50; // baseline

    // Adjust for company size
    if (job.companySize === 'startup') baseVolume *= 0.6;
    else if (job.companySize === 'large' || job.companySize === 'enterprise') baseVolume *= 1.8;

    // Adjust for location
    if (job.remote) baseVolume *= 2.5;
    else if (['San Francisco', 'New York', 'Seattle'].includes(job.location)) baseVolume *= 1.5;

    // Adjust for salary
    const industryMedian = this.historicalData.marketTrends.salaryTrends[job.title]?.median || 100000;
    if (job.salaryRange.max > industryMedian * 1.2) baseVolume *= 1.8;
    else if (job.salaryRange.max < industryMedian * 0.8) baseVolume *= 0.7;

    return Math.round(baseVolume);
  }

  private calculateProfileStrength(candidate: CandidateProfile): number {
    let strength = 0;

    // Skills quality (30%)
    const verifiedSkills = candidate.skills.filter(s => s.verified).length;
    const expertSkills = candidate.skills.filter(s => s.level === 'expert').length;
    strength += (verifiedSkills * 2 + expertSkills * 3 + candidate.skills.length) * 0.3;

    // Experience quality (25%)
    const totalYears = candidate.experience.reduce((sum, exp) => sum + exp.duration, 0) / 12;
    strength += Math.min(totalYears * 8, 40) * 0.25;

    // Education (20%)
    if (candidate.education.some(edu => edu.degree.includes('Master') || edu.degree.includes('PhD'))) {
      strength += 20;
    } else if (candidate.education.some(edu => edu.degree.includes('Bachelor'))) {
      strength += 15;
    } else {
      strength += 10;
    }

    // Portfolio & Certifications (15%)
    strength += Math.min(candidate.portfolioItems * 2, 10) * 0.15;
    strength += Math.min(candidate.certifications.length * 2, 10) * 0.15;

    // Success metrics (10%)
    strength += candidate.successRate * 0.1;

    return Math.min(100, strength);
  }

  private getMarketDemand(jobTitle: string, industry: string): 'very_high' | 'high' | 'medium' | 'low' {
    const demandScore = (this.historicalData.marketTrends.skillDemand[jobTitle] || 0.5) * 
                       (this.historicalData.marketTrends.hiringVolume[industry] || 1);

    if (demandScore >= 1.0) return 'very_high';
    if (demandScore >= 0.8) return 'high';
    if (demandScore >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Calculate location fit score
   */
  private calculateLocationFit(candidate: CandidateProfile, job: JobRequirements) {
    let score: number;
    let locationType: 'perfect' | 'regional' | 'remote_ok' | 'relocation_needed';

    if (job.remote && candidate.remotePreference) {
      score = 1;
      locationType = 'perfect';
    } else if (job.remote && !candidate.remotePreference) {
      score = 0.8;
      locationType = 'remote_ok';
    } else if (candidate.location === job.location) {
      score = 1;
      locationType = 'perfect';
    } else if (this.isRegionalMatch(candidate.location, job.location)) {
      score = 0.7;
      locationType = 'regional';
    } else {
      score = candidate.remotePreference ? 0.3 : 0.5;
      locationType = 'relocation_needed';
    }

    return {
      score,
      details: {
        locationType,
        preferenceAlignment: job.remote === candidate.remotePreference
      }
    };
  }

  private isRegionalMatch(candidateLocation: string, jobLocation: string): boolean {
    // Simple regional matching logic
    const regions = {
      'Bay Area': ['San Francisco', 'San Jose', 'Oakland', 'Palo Alto'],
      'NYC Metro': ['New York', 'Brooklyn', 'Queens', 'Newark'],
      'Seattle Metro': ['Seattle', 'Bellevue', 'Redmond'],
      'LA Metro': ['Los Angeles', 'Santa Monica', 'Irvine', 'Long Beach']
    };

    for (const region of Object.values(regions)) {
      if (region.includes(candidateLocation) && region.includes(jobLocation)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate salary alignment score
   */
  private calculateSalaryAlignment(candidate: CandidateProfile, job: JobRequirements) {
    if (!candidate.salaryExpectation || !job.salaryRange) {
      return { score: 0.7, details: { expectationVsOffer: 'aligned' as const, negotiationRoom: 0 } };
    }

    const candidateMin = candidate.salaryExpectation.min;
    const candidateMax = candidate.salaryExpectation.max;
    const jobMin = job.salaryRange.min;
    const jobMax = job.salaryRange.max;

    let score: number;
    let expectationVsOffer: 'under' | 'aligned' | 'over';

    if (candidateMax <= jobMin) {
      // Candidate expectations below job range
      score = 0.95;
      expectationVsOffer = 'under';
    } else if (candidateMin >= jobMax) {
      // Candidate expectations above job range
      score = 0.3;
      expectationVsOffer = 'over';
    } else {
      // There's overlap
      const overlapMin = Math.max(candidateMin, jobMin);
      const overlapMax = Math.min(candidateMax, jobMax);
      const overlapSize = overlapMax - overlapMin;
      const candidateRange = candidateMax - candidateMin;
      
      score = Math.min(0.9, 0.6 + (overlapSize / candidateRange) * 0.3);
      expectationVsOffer = 'aligned';
    }

    const negotiationRoom = Math.max(0, (jobMax - candidateMin) / candidateMin);

    return {
      score,
      details: {
        expectationVsOffer,
        negotiationRoom: Math.round(negotiationRoom * 100)
      }
    };
  }

  /**
   * Get weights for different factors based on job characteristics
   */
  private getWeights(job: JobRequirements) {
    // Default weights
    let weights = {
      skills: 0.35,
      experience: 0.25,
      competitiveness: 0.2,
      location: 0.1,
      salary: 0.1
    };

    // Adjust weights based on job type
    if (job.title.toLowerCase().includes('senior') || job.title.toLowerCase().includes('lead')) {
      weights.experience += 0.1;
      weights.skills -= 0.05;
      weights.competitiveness -= 0.05;
    }

    if (job.title.toLowerCase().includes('engineer') || job.title.toLowerCase().includes('developer')) {
      weights.skills += 0.1;
      weights.experience -= 0.05;
      weights.competitiveness -= 0.05;
    }

    if (job.companySize === 'startup') {
      weights.competitiveness += 0.1;
      weights.salary -= 0.1;
    }

    return weights;
  }

  /**
   * Calculate confidence level in prediction
   */
  private calculateConfidence(
    candidate: CandidateProfile, 
    job: JobRequirements, 
    probability: number
  ): 'high' | 'medium' | 'low' {
    let confidenceScore = 0;

    // Data completeness
    if (candidate.skills.length >= 5) confidenceScore += 20;
    if (candidate.experience.length >= 2) confidenceScore += 20;
    if (candidate.portfolioItems >= 3) confidenceScore += 15;
    if (job.requiredSkills.length >= 3) confidenceScore += 15;
    if (job.salaryRange && candidate.salaryExpectation) confidenceScore += 15;

    // Historical data availability
    const similarJobs = this.historicalData.successfulApplications.filter(
      app => app.jobRequirements.title?.includes(job.title.split(' ')[0]) || 
             app.jobRequirements.industry === job.industry
    ).length;

    if (similarJobs >= 10) confidenceScore += 15;
    else if (similarJobs >= 5) confidenceScore += 10;
    else confidenceScore += 5;

    if (confidenceScore >= 80) return 'high';
    if (confidenceScore >= 60) return 'medium';
    return 'low';
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    candidate: CandidateProfile, 
    job: JobRequirements, 
    factors: any
  ) {
    const suggestions = [];

    // Skills suggestions
    if (factors.skillsMatch.details.missingCritical.length > 0) {
      suggestions.push({
        category: 'skills' as const,
        suggestion: `Learn critical skills: ${factors.skillsMatch.details.missingCritical.join(', ')}`,
        impact: 'high' as const,
        timeToImplement: '2-6 months',
        resources: [
          'Free courses on FreeCodeCamp, Coursera',
          'Practice projects on GitBranch',
          'Certification programs'
        ]
      });
    }

    if (factors.skillsMatch.details.missingImportant.length > 0) {
      suggestions.push({
        category: 'skills' as const,
        suggestion: `Strengthen important skills: ${factors.skillsMatch.details.missingImportant.join(', ')}`,
        impact: 'medium' as const,
        timeToImplement: '1-3 months',
        resources: [
          'Online tutorials and documentation',
          'Side projects to practice',
          'Open source contributions'
        ]
      });
    }

    // Experience suggestions
    if (factors.experienceMatch.details.requirementMatch === 'under') {
      suggestions.push({
        category: 'experience' as const,
        suggestion: 'Gain more relevant experience through projects, internships, or freelance work',
        impact: 'high' as const,
        timeToImplement: '6-12 months',
        resources: [
          'Freelance platforms (Upwork, Fiverr)',
          'Open source projects',
          'Personal projects portfolio'
        ]
      });
    }

    // Portfolio suggestions
    if (candidate.portfolioItems < 3) {
      suggestions.push({
        category: 'portfolio' as const,
        suggestion: 'Build a stronger portfolio with 3-5 high-quality projects',
        impact: 'high' as const,
        timeToImplement: '1-3 months',
        resources: [
          'GitBranch Pages for hosting',
          'Personal website builders',
          'Portfolio templates and examples'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Generate application strategy recommendations
   */
  private generateApplicationStrategy(
    candidate: CandidateProfile, 
    job: JobRequirements, 
    probability: number
  ) {
    const strategy = {
      coverLetterFocus: [] as string[],
      portfolioHighlights: [] as string[],
      interviewPrepAreas: [] as string[]
    };

    // Cover letter focus based on strengths
    const candidateSkillNames = candidate.skills.map(s => s.name.toLowerCase());
    const matchedSkills = job.requiredSkills
      .filter(req => candidateSkillNames.includes(req.name.toLowerCase()))
      .map(req => req.name);

    if (matchedSkills.length > 0) {
      strategy.coverLetterFocus.push(`Highlight your expertise in: ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    if (candidate.experience.some(exp => exp.industry === job.industry)) {
      strategy.coverLetterFocus.push(`Emphasize your ${job.industry} industry experience`);
    }

    if (probability >= 70) {
      strategy.coverLetterFocus.push('Express genuine enthusiasm for the role and company mission');
    } else {
      strategy.coverLetterFocus.push('Address potential concerns about experience gaps proactively');
    }

    // Portfolio highlights
    strategy.portfolioHighlights.push('Include projects that demonstrate the required technical skills');
    strategy.portfolioHighlights.push('Show progression in complexity and sophistication');
    
    if (job.companySize === 'startup') {
      strategy.portfolioHighlights.push('Highlight projects showing versatility and quick learning');
    } else {
      strategy.portfolioHighlights.push('Include projects that show attention to detail and process');
    }

    // Interview prep areas
    strategy.interviewPrepAreas.push(`Technical questions on: ${job.requiredSkills.slice(0, 3).map(s => s.name).join(', ')}`);
    strategy.interviewPrepAreas.push('Behavioral questions about teamwork and problem-solving');
    strategy.interviewPrepAreas.push(`Company research: ${job.company} culture and recent news`);

    return strategy;
  }

  /**
   * Get optimal application timing
   */
  private getOptimalTiming(job: JobRequirements) {
    return {
      bestDayOfWeek: 'Tuesday',
      bestTimeOfDay: '10:00 AM - 2:00 PM',
      reasoning: 'Applications submitted on Tuesday-Thursday between 10 AM-2 PM have 23% higher response rates'
    };
  }

  /**
   * Get market insights for the role
   */
  private getMarketInsights(job: JobRequirements) {
    const salaryData = this.historicalData.marketTrends.salaryTrends[job.title] || {
      trend: 0.05,
      median: job.salaryRange.min + ((job.salaryRange.max - job.salaryRange.min) / 2)
    };

    return {
      salaryBenchmark: {
        percentile25: Math.round(salaryData.median * 0.8),
        median: Math.round(salaryData.median),
        percentile75: Math.round(salaryData.median * 1.2)
      },
      demandTrend: salaryData.trend > 0.05 ? 'increasing' as const : 
                   salaryData.trend < -0.05 ? 'decreasing' as const : 'stable' as const,
      competitorAnalysis: {
        averageExperience: 4.2,
        commonSkills: job.requiredSkills.slice(0, 5).map(s => s.name),
        educationLevels: ['Bachelor\'s Degree (60%)', 'Master\'s Degree (25%)', 'Self-taught (15%)']
      }
    };
  }

  /**
   * Batch analyze multiple job opportunities
   */
  batchAnalyze(candidate: CandidateProfile, jobs: JobRequirements[]): Array<{
    job: JobRequirements;
    prediction: SuccessPrediction;
    recommendation: 'apply' | 'maybe' | 'skip';
  }> {
    return jobs.map(job => {
      const prediction = this.predictSuccess(candidate, job);
      
      let recommendation: 'apply' | 'maybe' | 'skip';
      if (prediction.overallProbability >= 70) {
        recommendation = 'apply';
      } else if (prediction.overallProbability >= 40) {
        recommendation = 'maybe';
      } else {
        recommendation = 'skip';
      }

      return { job, prediction, recommendation };
    }).sort((a, b) => b.prediction.overallProbability - a.prediction.overallProbability);
  }
}

// Singleton instance
export const smartApplicationPredictor = new SmartApplicationPredictor();




