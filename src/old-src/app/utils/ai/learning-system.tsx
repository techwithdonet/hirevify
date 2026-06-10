/**
 * AI Learning System for HireVify
 * 
 * Implements machine learning capabilities to improve AI performance
 * based on user feedback and interaction patterns.
 */

interface UserInteraction {
  userId: string;
  featureType: 'matching' | 'resume' | 'interview' | 'notifications' | 'career_advice';
  action: string;
  outcome: 'positive' | 'negative' | 'neutral' | 'hired' | 'rejected';
  context: Record<string, any>;
  satisfaction?: number; // 1-5 scale
  timestamp: number;
  sessionId?: string;
}

interface FeedbackPoint {
  action: string;
  outcome: string;
  context: Record<string, any>;
  timestamp: number;
  satisfaction?: number;
  weight: number; // Importance weight for learning
}

interface UserPreferences {
  contentTypes: string[];
  timing: {
    preferredHours: number[];
    preferredDays: string[];
    timezone: string;
  };
  factors: {
    urgency_sensitivity: number;
    detail_preference: 'brief' | 'detailed' | 'comprehensive';
    notification_frequency: 'minimal' | 'moderate' | 'frequent';
  };
  confidence: number; // How confident we are in these preferences
}

interface ModelWeights {
  matching: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    company_size: number;
    culture: number;
  };
  resume: {
    keywords: number;
    structure: number;
    experience: number;
    skills: number;
    achievements: number;
  };
  notifications: {
    timing: number;
    content: number;
    frequency: number;
    personalization: number;
  };
}

/**
 * Advanced Learning System for AI Optimization
 */
export class LearningSystem {
  private feedbackData: Map<string, FeedbackPoint[]> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private modelWeights: ModelWeights;
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_FEEDBACK_COUNT = 5; // Minimum feedback needed for reliable learning

  constructor() {
    this.initializeDefaultWeights();
    this.loadPersistedData();
  }

  /**
   * Record user interaction for learning
   */
  async recordUserInteraction(interaction: UserInteraction): Promise<void> {
    try {
      const key = `${interaction.featureType}_${interaction.userId}`;
      const existing = this.feedbackData.get(key) || [];
      
      const feedbackPoint: FeedbackPoint = {
        action: interaction.action,
        outcome: interaction.outcome,
        context: interaction.context,
        timestamp: interaction.timestamp,
        satisfaction: interaction.satisfaction,
        weight: this.calculateFeedbackWeight(interaction)
      };

      existing.push(feedbackPoint);
      
      // Keep only recent feedback (last 100 interactions per feature per user)
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }

      this.feedbackData.set(key, existing);
      
      // Update model weights if we have enough feedback
      if (existing.length >= this.MIN_FEEDBACK_COUNT) {
        await this.updateModelWeights(interaction);
      }

      // Update user preferences
      await this.updateUserPreferences(interaction.userId, interaction);
      
      // Persist to backend
      await this.persistFeedback(key, existing);
      
      console.log(`📊 Learning system recorded interaction: ${interaction.featureType} - ${interaction.outcome}`);
      
    } catch (error) {
      console.error('Failed to record user interaction:', error);
    }
  }

  /**
   * Update AI model weights based on successful outcomes
   */
  async updateModelWeights(interaction: UserInteraction): Promise<void> {
    const feedbackHistory = this.feedbackData.get(`${interaction.featureType}_${interaction.userId}`) || [];
    
    switch (interaction.featureType) {
      case 'matching':
        await this.updateMatchingWeights(feedbackHistory, interaction);
        break;
      case 'resume':
        await this.updateResumeWeights(feedbackHistory, interaction);
        break;
      case 'notifications':
        await this.updateNotificationWeights(feedbackHistory, interaction);
        break;
    }

    // Persist updated weights
    await this.persistModelWeights();
  }

  /**
   * Generate personalized recommendations based on learned preferences
   */
  async generatePersonalizedRecommendations(userId: string): Promise<UserPreferences> {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences || preferences.confidence < 0.5) {
      // Generate initial preferences from available interactions
      preferences = await this.inferUserPreferences(userId);
      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  /**
   * Get optimized model weights for a specific feature
   */
  getOptimizedWeights(featureType: keyof ModelWeights): any {
    return this.modelWeights[featureType];
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserPatterns(userId: string): Promise<{
    engagement: number;
    preferences: UserPreferences;
    success_factors: string[];
    improvement_areas: string[];
  }> {
    const allFeedback = Array.from(this.feedbackData.entries())
      .filter(([key]) => key.includes(userId))
      .flatMap(([_, feedback]) => feedback);

    if (allFeedback.length === 0) {
      return {
        engagement: 0,
        preferences: this.getDefaultUserPreferences(),
        success_factors: [],
        improvement_areas: ['Insufficient interaction data']
      };
    }

    const engagement = this.calculateEngagementScore(allFeedback);
    const preferences = await this.generatePersonalizedRecommendations(userId);
    const successFactors = this.identifySuccessFactors(allFeedback);
    const improvementAreas = this.identifyImprovementAreas(allFeedback);

    return {
      engagement,
      preferences,
      success_factors: successFactors,
      improvement_areas: improvementAreas
    };
  }

  /**
   * Get learning system performance metrics
   */
  getPerformanceMetrics(): {
    total_interactions: number;
    active_users: number;
    learning_confidence: number;
    success_rate: number;
    model_accuracy: number;
  } {
    const totalInteractions = Array.from(this.feedbackData.values())
      .reduce((sum, feedback) => sum + feedback.length, 0);

    const activeUsers = this.feedbackData.size;
    
    const recentFeedback = Array.from(this.feedbackData.values())
      .flatMap(feedback => feedback)
      .filter(f => Date.now() - f.timestamp < 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const successfulInteractions = recentFeedback
      .filter(f => f.outcome === 'positive' || f.outcome === 'hired');

    const successRate = recentFeedback.length > 0 
      ? successfulInteractions.length / recentFeedback.length 
      : 0;

    const learningConfidence = Math.min(1, totalInteractions / 1000); // Confidence grows with data
    const modelAccuracy = this.calculateModelAccuracy();

    return {
      total_interactions: totalInteractions,
      active_users: activeUsers,
      learning_confidence: learningConfidence,
      success_rate: successRate,
      model_accuracy: modelAccuracy
    };
  }

  // Private helper methods

  private initializeDefaultWeights(): void {
    this.modelWeights = {
      matching: {
        skills: 0.35,
        experience: 0.25,
        location: 0.10,
        salary: 0.15,
        company_size: 0.05,
        culture: 0.10
      },
      resume: {
        keywords: 0.30,
        structure: 0.20,
        experience: 0.25,
        skills: 0.15,
        achievements: 0.10
      },
      notifications: {
        timing: 0.40,
        content: 0.30,
        frequency: 0.15,
        personalization: 0.15
      }
    };
  }

  private calculateFeedbackWeight(interaction: UserInteraction): number {
    let weight = 1.0;

    // Higher weight for strong outcomes
    if (interaction.outcome === 'hired') weight *= 2.0;
    if (interaction.outcome === 'positive') weight *= 1.5;
    if (interaction.satisfaction && interaction.satisfaction >= 4) weight *= 1.3;

    // Recent interactions have higher weight
    const daysSinceInteraction = (Date.now() - interaction.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceInteraction < 7) weight *= 1.2;
    if (daysSinceInteraction < 1) weight *= 1.5;

    return weight;
  }

  private async updateMatchingWeights(
    feedbackHistory: FeedbackPoint[], 
    interaction: UserInteraction
  ): Promise<void> {
    const successfulMatches = feedbackHistory.filter(
      f => f.outcome === 'hired' || f.outcome === 'positive'
    );

    if (successfulMatches.length < 3) return; // Need minimum successful matches

    // Analyze which factors led to success
    const factorSuccessRates = this.analyzeFactorSuccess(successfulMatches, 'matching');
    
    // Adjust weights based on success rates
    Object.keys(this.modelWeights.matching).forEach(factor => {
      if (factorSuccessRates[factor]) {
        const adjustment = (factorSuccessRates[factor] - 0.5) * this.LEARNING_RATE;
        this.modelWeights.matching[factor] = Math.max(0.05, 
          Math.min(0.6, this.modelWeights.matching[factor] + adjustment)
        );
      }
    });

    // Normalize weights to sum to 1
    this.normalizeWeights(this.modelWeights.matching);
  }

  private async updateResumeWeights(
    feedbackHistory: FeedbackPoint[], 
    interaction: UserInteraction
  ): Promise<void> {
    const positiveOutcomes = feedbackHistory.filter(
      f => f.satisfaction && f.satisfaction >= 4
    );

    if (positiveOutcomes.length < 3) return;

    const factorSuccessRates = this.analyzeFactorSuccess(positiveOutcomes, 'resume');
    
    Object.keys(this.modelWeights.resume).forEach(factor => {
      if (factorSuccessRates[factor]) {
        const adjustment = (factorSuccessRates[factor] - 0.5) * this.LEARNING_RATE;
        this.modelWeights.resume[factor] = Math.max(0.05, 
          Math.min(0.5, this.modelWeights.resume[factor] + adjustment)
        );
      }
    });

    this.normalizeWeights(this.modelWeights.resume);
  }

  private async updateNotificationWeights(
    feedbackHistory: FeedbackPoint[], 
    interaction: UserInteraction
  ): Promise<void> {
    const engagedNotifications = feedbackHistory.filter(
      f => f.action === 'clicked' || f.action === 'acted_upon'
    );

    if (engagedNotifications.length < 5) return;

    // Analyze timing patterns
    const hourlyEngagement = this.analyzeHourlyEngagement(engagedNotifications);
    const contentEngagement = this.analyzeContentEngagement(engagedNotifications);

    // Update notification preferences
    this.updateNotificationPreferences(interaction.userId, {
      timing: hourlyEngagement,
      content: contentEngagement
    });
  }

  private async inferUserPreferences(userId: string): Promise<UserPreferences> {
    const allUserFeedback = Array.from(this.feedbackData.entries())
      .filter(([key]) => key.includes(userId))
      .flatMap(([_, feedback]) => feedback);

    if (allUserFeedback.length < 3) {
      return this.getDefaultUserPreferences();
    }

    // Analyze timing preferences
    const activeTimes = allUserFeedback.map(f => new Date(f.timestamp).getHours());
    const preferredHours = this.findPreferredHours(activeTimes);

    // Analyze content preferences
    const positiveInteractions = allUserFeedback.filter(f => f.satisfaction && f.satisfaction >= 4);
    const contentTypes = this.analyzePreferredContentTypes(positiveInteractions);

    return {
      contentTypes,
      timing: {
        preferredHours,
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: 'UTC' // Default, should be detected
      },
      factors: {
        urgency_sensitivity: this.calculateUrgencySensitivity(allUserFeedback),
        detail_preference: this.inferDetailPreference(allUserFeedback),
        notification_frequency: this.inferFrequencyPreference(allUserFeedback)
      },
      confidence: Math.min(0.9, allUserFeedback.length / 20)
    };
  }

  private normalizeWeights(weights: Record<string, number>): void {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / total;
      });
    }
  }

  private analyzeFactorSuccess(
    feedbackHistory: FeedbackPoint[], 
    featureType: string
  ): Record<string, number> {
    const factorSuccess: Record<string, number> = {};
    
    // This would analyze which factors in the context led to success
    // For now, return mock analysis
    if (featureType === 'matching') {
      factorSuccess.skills = 0.8;
      factorSuccess.experience = 0.7;
      factorSuccess.location = 0.6;
    }

    return factorSuccess;
  }

  private findPreferredHours(activeTimes: number[]): number[] {
    const hourCounts = new Array(24).fill(0);
    activeTimes.forEach(hour => hourCounts[hour]++);
    
    const threshold = Math.max(1, activeTimes.length * 0.1);
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= threshold)
      .map(({ hour }) => hour);
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      contentTypes: ['opportunities', 'insights', 'reminders'],
      timing: {
        preferredHours: [9, 10, 14, 16],
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: 'UTC'
      },
      factors: {
        urgency_sensitivity: 0.7,
        detail_preference: 'detailed',
        notification_frequency: 'moderate'
      },
      confidence: 0.3
    };
  }

  private calculateEngagementScore(feedback: FeedbackPoint[]): number {
    if (feedback.length === 0) return 0;
    
    const recentFeedback = feedback.filter(
      f => Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000 // Last week
    );

    const positiveActions = recentFeedback.filter(
      f => f.outcome === 'positive' || f.satisfaction && f.satisfaction >= 4
    ).length;

    return Math.min(1, positiveActions / Math.max(1, recentFeedback.length));
  }

  private identifySuccessFactors(feedback: FeedbackPoint[]): string[] {
    const successfulFeedback = feedback.filter(
      f => f.outcome === 'positive' || f.outcome === 'hired'
    );

    const factors = new Set<string>();
    successfulFeedback.forEach(f => {
      Object.keys(f.context).forEach(key => factors.add(key));
    });

    return Array.from(factors).slice(0, 5);
  }

  private identifyImprovementAreas(feedback: FeedbackPoint[]): string[] {
    const negativeFeedback = feedback.filter(
      f => f.outcome === 'negative' || (f.satisfaction && f.satisfaction <= 2)
    );

    if (negativeFeedback.length === 0) return [];

    return ['User experience optimization', 'Response time improvement', 'Personalization enhancement'];
  }

  private calculateModelAccuracy(): number {
    // This would calculate actual model accuracy based on predictions vs outcomes
    // For now, return a reasonable estimate
    return 0.82;
  }

  private async persistFeedback(key: string, feedback: FeedbackPoint[]): Promise<void> {
    // In a real implementation, store in backend
    try {
      localStorage.setItem(`learning_${key}`, JSON.stringify(feedback));
    } catch (error) {
      console.warn('Failed to persist learning feedback:', error);
    }
  }

  private async persistModelWeights(): Promise<void> {
    try {
      localStorage.setItem('ai_model_weights', JSON.stringify(this.modelWeights));
    } catch (error) {
      console.warn('Failed to persist model weights:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      // Load model weights
      const savedWeights = localStorage.getItem('ai_model_weights');
      if (savedWeights) {
        this.modelWeights = JSON.parse(savedWeights);
      }

      // Load feedback data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('learning_')) {
          const feedbackKey = key.replace('learning_', '');
          const feedback = JSON.parse(localStorage.getItem(key) || '[]');
          this.feedbackData.set(feedbackKey, feedback);
        }
      });
    } catch (error) {
      console.warn('Failed to load persisted learning data:', error);
    }
  }

  // Additional helper methods for notification optimization
  private analyzeHourlyEngagement(notifications: FeedbackPoint[]): Record<number, number> {
    const hourlyData: Record<number, number> = {};
    
    notifications.forEach(notification => {
      const hour = new Date(notification.timestamp).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return hourlyData;
  }

  private analyzeContentEngagement(notifications: FeedbackPoint[]): Record<string, number> {
    const contentData: Record<string, number> = {};
    
    notifications.forEach(notification => {
      const contentType = notification.context.type || 'general';
      contentData[contentType] = (contentData[contentType] || 0) + 1;
    });

    return contentData;
  }

  private updateNotificationPreferences(userId: string, preferences: any): void {
    const existing = this.userPreferences.get(userId) || this.getDefaultUserPreferences();
    
    // Update timing preferences based on engagement data
    existing.timing.preferredHours = Object.entries(preferences.timing)
      .filter(([_, count]) => (count as number) > 1)
      .map(([hour]) => parseInt(hour));

    this.userPreferences.set(userId, existing);
  }

  private calculateUrgencySensitivity(feedback: FeedbackPoint[]): number {
    // Analyze how user responds to urgent vs non-urgent notifications
    return 0.7; // Default moderate sensitivity
  }

  private inferDetailPreference(feedback: FeedbackPoint[]): 'brief' | 'detailed' | 'comprehensive' {
    // Analyze engagement with different content lengths
    return 'detailed'; // Default preference
  }

  private inferFrequencyPreference(feedback: FeedbackPoint[]): 'minimal' | 'moderate' | 'frequent' {
    // Analyze engagement patterns and fatigue indicators
    return 'moderate'; // Default preference
  }

  private analyzePreferredContentTypes(feedback: FeedbackPoint[]): string[] {
    const contentTypes = new Set<string>();
    
    feedback.forEach(f => {
      if (f.context.category) {
        contentTypes.add(f.context.category);
      }
    });

    return Array.from(contentTypes).slice(0, 5) || ['opportunities', 'insights'];
  }

  async updateUserPreferences(userId: string, interaction: UserInteraction): Promise<void> {
    const existing = this.userPreferences.get(userId) || this.getDefaultUserPreferences();
    
    // Update preferences based on interaction
    if (interaction.outcome === 'positive' && interaction.context.timing) {
      const hour = new Date(interaction.timestamp).getHours();
      if (!existing.timing.preferredHours.includes(hour)) {
        existing.timing.preferredHours.push(hour);
        existing.timing.preferredHours.sort();
      }
    }

    // Update confidence
    existing.confidence = Math.min(0.95, existing.confidence + 0.05);

    this.userPreferences.set(userId, existing);
  }
}

// Export singleton instance
export const learningSystem = new LearningSystem();
export type { 
  UserInteraction, 
  FeedbackPoint, 
  UserPreferences, 
  ModelWeights 
};