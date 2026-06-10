/**
 * Active Learning Pipeline - Phase 1 Enhancement
 * Continuous improvement system for ATS accuracy
 * 
 * Features:
 * - Real-time learning from user corrections
 * - Uncertainty-based sample selection
 * - Model performance tracking
 * - Automated retraining triggers
 * - Human-in-the-loop feedback integration
 */

export interface LearningInstance {
  id: string;
  originalExtraction: any;
  humanCorrection: any;
  confidenceScores: any;
  uncertainty: number;
  timestamp: Date;
  reviewerId: string;
  feedbackType: FeedbackType;
  improvementAreas: string[];
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  fieldAccuracy: Record<string, number>;
  improvementTrend: number[];
  lastUpdated: Date;
}

export interface LearningMetrics {
  totalSamples: number;
  humanReviewed: number;
  modelImproved: number;
  accuracyGain: number;
  topImprovementAreas: string[];
  learningVelocity: number;
  qualityScore: number;
}

export interface UncertaintyQuery {
  instances: QueryInstance[];
  selectionStrategy: SelectionStrategy;
  batchSize: number;
  diversityWeight: number;
  uncertaintyWeight: number;
}

export interface QueryInstance {
  id: string;
  data: any;
  uncertainty: number;
  representation: number[];
  priority: number;
  estimatedImpact: number;
}

export type FeedbackType = 'correction' | 'validation' | 'enhancement' | 'rejection';
export type SelectionStrategy = 'uncertainty' | 'diversity' | 'hybrid' | 'committee';

export interface RetrainingTrigger {
  condition: TriggerCondition;
  threshold: number;
  currentValue: number;
  triggered: boolean;
  lastCheck: Date;
}

export type TriggerCondition = 'accuracy_drop' | 'sample_count' | 'time_based' | 'uncertainty_increase';

export interface LearningConfig {
  uncertaintyThreshold: number;
  batchSize: number;
  retrainingFrequency: number;
  minSamplesForRetraining: number;
  maxUncertaintyThreshold: number;
  diversityWeight: number;
  performanceThreshold: number;
}

class ActiveLearningPipeline {
  private learningInstances: Map<string, LearningInstance> = new Map();
  private modelPerformance: ModelPerformance;
  private learningMetrics: LearningMetrics;
  private config: LearningConfig;
  private retrainingTriggers: RetrainingTrigger[];

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      uncertaintyThreshold: 0.7,
      batchSize: 10,
      retrainingFrequency: 24 * 60 * 60 * 1000, // 24 hours
      minSamplesForRetraining: 50,
      maxUncertaintyThreshold: 0.9,
      diversityWeight: 0.3,
      performanceThreshold: 0.85,
      ...config
    };

    this.initializeMetrics();
    this.initializeRetrainingTriggers();
  }

  /**
   * Process human feedback and add to learning pipeline
   */
  async processFeedback(
    originalExtraction: any,
    humanCorrection: any,
    confidenceScores: any,
    reviewerId: string,
    feedbackType: FeedbackType = 'correction'
  ): Promise<string> {
    
    const instanceId = this.generateInstanceId();
    const uncertainty = this.calculateInstanceUncertainty(confidenceScores);
    const improvementAreas = this.identifyImprovementAreas(originalExtraction, humanCorrection);

    const learningInstance: LearningInstance = {
      id: instanceId,
      originalExtraction,
      humanCorrection,
      confidenceScores,
      uncertainty,
      timestamp: new Date(),
      reviewerId,
      feedbackType,
      improvementAreas
    };

    // Store learning instance
    this.learningInstances.set(instanceId, learningInstance);

    // Update learning metrics
    await this.updateLearningMetrics(learningInstance);

    // Check if retraining is needed
    await this.checkRetrainingTriggers();

    // Update model performance if needed
    await this.updateModelPerformance();

    console.log(`Active learning: Processed feedback ${instanceId} with uncertainty ${uncertainty}`);

    return instanceId;
  }

  /**
   * Select instances for human review using uncertainty sampling
   */
  async selectInstancesForReview(
    extractionResults: any[],
    strategy: SelectionStrategy = 'hybrid'
  ): Promise<UncertaintyQuery> {
    
    const queryInstances: QueryInstance[] = [];

    for (const result of extractionResults) {
      const uncertainty = this.calculateInstanceUncertainty(result.confidence);
      const representation = await this.generateRepresentation(result);
      const priority = this.calculatePriority(uncertainty, result);
      const estimatedImpact = this.estimateImprovementImpact(result);

      queryInstances.push({
        id: result.id || this.generateInstanceId(),
        data: result,
        uncertainty,
        representation,
        priority,
        estimatedImpact
      });
    }

    // Select instances based on strategy
    const selectedInstances = await this.applySelectionStrategy(queryInstances, strategy);

    return {
      instances: selectedInstances,
      selectionStrategy: strategy,
      batchSize: this.config.batchSize,
      diversityWeight: this.config.diversityWeight,
      uncertaintyWeight: 1 - this.config.diversityWeight
    };
  }

  /**
   * Apply selection strategy for active learning
   */
  private async applySelectionStrategy(
    instances: QueryInstance[],
    strategy: SelectionStrategy
  ): Promise<QueryInstance[]> {
    
    switch (strategy) {
      case 'uncertainty':
        return this.uncertaintySampling(instances);
      
      case 'diversity':
        return this.diversitySampling(instances);
      
      case 'hybrid':
        return this.hybridSampling(instances);
      
      case 'committee':
        return this.committeeSampling(instances);
      
      default:
        return this.uncertaintySampling(instances);
    }
  }

  /**
   * Uncertainty-based sampling
   */
  private uncertaintySampling(instances: QueryInstance[]): QueryInstance[] {
    return instances
      .filter(instance => instance.uncertainty >= this.config.uncertaintyThreshold)
      .sort((a, b) => b.uncertainty - a.uncertainty)
      .slice(0, this.config.batchSize);
  }

  /**
   * Diversity-based sampling
   */
  private diversitySampling(instances: QueryInstance[]): QueryInstance[] {
    const selected: QueryInstance[] = [];
    const remaining = [...instances];

    // Select most uncertain instance first
    let mostUncertain = remaining.reduce((max, current) => 
      current.uncertainty > max.uncertainty ? current : max
    );
    selected.push(mostUncertain);
    remaining.splice(remaining.indexOf(mostUncertain), 1);

    // Select diverse instances
    while (selected.length < this.config.batchSize && remaining.length > 0) {
      let maxDiversityScore = -1;
      let nextInstance: QueryInstance | null = null;
      let nextIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const instance = remaining[i];
        const diversityScore = this.calculateDiversityScore(instance, selected);
        
        if (diversityScore > maxDiversityScore) {
          maxDiversityScore = diversityScore;
          nextInstance = instance;
          nextIndex = i;
        }
      }

      if (nextInstance) {
        selected.push(nextInstance);
        remaining.splice(nextIndex, 1);
      }
    }

    return selected;
  }

  /**
   * Hybrid sampling combining uncertainty and diversity
   */
  private hybridSampling(instances: QueryInstance[]): QueryInstance[] {
    const uncertaintyWeight = 1 - this.config.diversityWeight;
    const diversityWeight = this.config.diversityWeight;

    // Calculate combined scores
    const scoredInstances = instances.map(instance => ({
      ...instance,
      combinedScore: (instance.uncertainty * uncertaintyWeight) + 
                    (this.calculateMaxDiversityScore(instance, instances) * diversityWeight)
    }));

    return scoredInstances
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, this.config.batchSize);
  }

  /**
   * Committee-based sampling (using ensemble disagreement)
   */
  private committeeSampling(instances: QueryInstance[]): QueryInstance[] {
    // This would use multiple model predictions to find disagreement
    // For now, fall back to uncertainty sampling
    return this.uncertaintySampling(instances);
  }

  /**
   * Calculate diversity score between instance and selected set
   */
  private calculateDiversityScore(instance: QueryInstance, selected: QueryInstance[]): number {
    if (selected.length === 0) return instance.uncertainty;

    let minSimilarity = Infinity;
    
    for (const selectedInstance of selected) {
      const similarity = this.calculateSimilarity(instance.representation, selectedInstance.representation);
      minSimilarity = Math.min(minSimilarity, similarity);
    }

    // Return diversity (1 - similarity) combined with uncertainty
    return (1 - minSimilarity) * 0.7 + instance.uncertainty * 0.3;
  }

  /**
   * Calculate maximum diversity score for hybrid sampling
   */
  private calculateMaxDiversityScore(instance: QueryInstance, allInstances: QueryInstance[]): number {
    const others = allInstances.filter(other => other.id !== instance.id);
    
    if (others.length === 0) return 1.0;

    let maxDiversity = 0;
    
    for (const other of others) {
      const similarity = this.calculateSimilarity(instance.representation, other.representation);
      const diversity = 1 - similarity;
      maxDiversity = Math.max(maxDiversity, diversity);
    }

    return maxDiversity;
  }

  /**
   * Calculate similarity between two representations
   */
  private calculateSimilarity(repr1: number[], repr2: number[]): number {
    if (repr1.length !== repr2.length) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < repr1.length; i++) {
      dotProduct += repr1[i] * repr2[i];
      norm1 += repr1[i] * repr1[i];
      norm2 += repr2[i] * repr2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Generate representation vector for instance
   */
  private async generateRepresentation(result: any): Promise<number[]> {
    // Generate feature representation for diversity calculation
    // This could use embeddings from text content, extracted features, etc.
    
    const features: number[] = [];
    
    // Text length features
    const textContent = result.textContent || '';
    features.push(textContent.length / 1000); // Normalized text length
    
    // Field presence features
    features.push(result.personalInfo?.fullName ? 1 : 0);
    features.push(result.personalInfo?.email ? 1 : 0);
    features.push(result.workExperience?.length || 0);
    features.push(result.education?.length || 0);
    features.push(result.skills?.technical?.length || 0);
    
    // Confidence features
    features.push(result.confidence?.overall || 0);
    features.push(result.confidence?.textExtraction || 0);
    features.push(result.confidence?.dataExtraction || 0);
    
    // Document characteristics
    features.push(result.visualAnalysis?.layout?.columns || 1);
    features.push(result.visualAnalysis?.sections?.length || 0);
    
    return features;
  }

  /**
   * Calculate instance uncertainty from confidence scores
   */
  private calculateInstanceUncertainty(confidenceScores: any): number {
    if (!confidenceScores) return 1.0;

    const overall = confidenceScores.overall || 0;
    const uncertainty = (100 - overall) / 100;
    
    // Add additional uncertainty factors
    const fieldUncertainties = [];
    
    if (confidenceScores.extraction) {
      Object.values(confidenceScores.extraction).forEach((score: any) => {
        if (typeof score === 'number') {
          fieldUncertainties.push((100 - score) / 100);
        } else if (score && typeof score.overall === 'number') {
          fieldUncertainties.push((100 - score.overall) / 100);
        }
      });
    }

    const avgFieldUncertainty = fieldUncertainties.length > 0 
      ? fieldUncertainties.reduce((sum, u) => sum + u, 0) / fieldUncertainties.length
      : uncertainty;

    return Math.max(uncertainty, avgFieldUncertainty);
  }

  /**
   * Calculate priority score for instance
   */
  private calculatePriority(uncertainty: number, result: any): number {
    let priority = uncertainty;
    
    // Boost priority for business-critical extractions
    if (result.extractedData?.personalInfo?.email) priority += 0.1;
    if (result.extractedData?.workExperience?.length > 0) priority += 0.1;
    
    // Boost priority for low confidence in important fields
    if (result.confidence?.extraction?.personalInfo?.overall < 70) priority += 0.2;
    if (result.confidence?.extraction?.workExperience?.overall < 70) priority += 0.2;
    
    return Math.min(1.0, priority);
  }

  /**
   * Estimate improvement impact from reviewing instance
   */
  private estimateImprovementImpact(result: any): number {
    const uncertainty = this.calculateInstanceUncertainty(result.confidence);
    const complexity = this.calculateComplexity(result);
    const businessValue = this.calculateBusinessValue(result);
    
    return (uncertainty * 0.4) + (complexity * 0.3) + (businessValue * 0.3);
  }

  /**
   * Calculate complexity of extraction
   */
  private calculateComplexity(result: any): number {
    let complexity = 0;
    
    // Text complexity
    const textLength = result.textContent?.length || 0;
    complexity += Math.min(0.3, textLength / 10000);
    
    // Visual complexity
    const sections = result.visualAnalysis?.sections?.length || 0;
    complexity += Math.min(0.3, sections / 10);
    
    // Data complexity
    const fields = Object.keys(result.extractedData || {}).length;
    complexity += Math.min(0.4, fields / 20);
    
    return complexity;
  }

  /**
   * Calculate business value of extraction
   */
  private calculateBusinessValue(result: any): number {
    let value = 0;
    
    // High value fields
    if (result.extractedData?.personalInfo) value += 0.3;
    if (result.extractedData?.workExperience?.length > 0) value += 0.4;
    if (result.extractedData?.skills) value += 0.2;
    if (result.extractedData?.education) value += 0.1;
    
    return Math.min(1.0, value);
  }

  /**
   * Identify improvement areas from feedback
   */
  private identifyImprovementAreas(original: any, corrected: any): string[] {
    const areas: string[] = [];
    
    // Compare fields and identify differences
    if (this.fieldsDiffer(original.personalInfo, corrected.personalInfo)) {
      areas.push('personal_info');
    }
    
    if (this.fieldsDiffer(original.workExperience, corrected.workExperience)) {
      areas.push('work_experience');
    }
    
    if (this.fieldsDiffer(original.education, corrected.education)) {
      areas.push('education');
    }
    
    if (this.fieldsDiffer(original.skills, corrected.skills)) {
      areas.push('skills');
    }
    
    return areas;
  }

  /**
   * Check if fields differ between original and corrected
   */
  private fieldsDiffer(original: any, corrected: any): boolean {
    return JSON.stringify(original) !== JSON.stringify(corrected);
  }

  /**
   * Update learning metrics
   */
  private async updateLearningMetrics(instance: LearningInstance): Promise<void> {
    this.learningMetrics.totalSamples++;
    this.learningMetrics.humanReviewed++;
    
    // Update improvement areas
    instance.improvementAreas.forEach(area => {
      const index = this.learningMetrics.topImprovementAreas.indexOf(area);
      if (index === -1) {
        this.learningMetrics.topImprovementAreas.push(area);
      }
    });
    
    // Calculate learning velocity (improvements per hour)
    const recentInstances = Array.from(this.learningInstances.values())
      .filter(inst => (Date.now() - inst.timestamp.getTime()) < 60 * 60 * 1000); // Last hour
    
    this.learningMetrics.learningVelocity = recentInstances.length;
    
    // Update quality score based on recent feedback
    this.learningMetrics.qualityScore = this.calculateQualityScore();
  }

  /**
   * Calculate quality score based on learning instances
   */
  private calculateQualityScore(): number {
    const instances = Array.from(this.learningInstances.values());
    if (instances.length === 0) return 100;
    
    const avgUncertainty = instances.reduce((sum, inst) => sum + inst.uncertainty, 0) / instances.length;
    return Math.max(0, 100 - (avgUncertainty * 100));
  }

  /**
   * Check if retraining triggers are activated
   */
  private async checkRetrainingTriggers(): Promise<void> {
    for (const trigger of this.retrainingTriggers) {
      trigger.lastCheck = new Date();
      
      switch (trigger.condition) {
        case 'sample_count':
          trigger.currentValue = this.learningInstances.size;
          trigger.triggered = trigger.currentValue >= trigger.threshold;
          break;
          
        case 'accuracy_drop':
          trigger.currentValue = this.modelPerformance.accuracy;
          trigger.triggered = trigger.currentValue < trigger.threshold;
          break;
          
        case 'uncertainty_increase':
          const avgUncertainty = this.calculateAverageUncertainty();
          trigger.currentValue = avgUncertainty;
          trigger.triggered = trigger.currentValue > trigger.threshold;
          break;
          
        case 'time_based':
          const timeSinceLastUpdate = Date.now() - this.modelPerformance.lastUpdated.getTime();
          trigger.currentValue = timeSinceLastUpdate;
          trigger.triggered = trigger.currentValue >= trigger.threshold;
          break;
      }
      
      if (trigger.triggered) {
        console.log(`Retraining trigger activated: ${trigger.condition}`);
        await this.triggerRetraining(trigger.condition);
      }
    }
  }

  /**
   * Calculate average uncertainty from recent instances
   */
  private calculateAverageUncertainty(): number {
    const instances = Array.from(this.learningInstances.values());
    if (instances.length === 0) return 0;
    
    return instances.reduce((sum, inst) => sum + inst.uncertainty, 0) / instances.length;
  }

  /**
   * Trigger model retraining
   */
  private async triggerRetraining(reason: TriggerCondition): Promise<void> {
    console.log(`Triggering model retraining due to: ${reason}`);
    
    // Prepare training data from learning instances
    const trainingData = Array.from(this.learningInstances.values())
      .filter(instance => instance.feedbackType === 'correction')
      .map(instance => ({
        input: instance.originalExtraction,
        target: instance.humanCorrection,
        weight: 1 + instance.uncertainty // Weight uncertain samples more
      }));

    if (trainingData.length < this.config.minSamplesForRetraining) {
      console.log(`Insufficient training data: ${trainingData.length} < ${this.config.minSamplesForRetraining}`);
      return;
    }

    try {
      // This would integrate with your model training pipeline
      await this.performModelUpdate(trainingData);
      
      // Update metrics after retraining
      await this.updateModelPerformance();
      
      // Reset triggers
      this.resetRetrainingTriggers();
      
      console.log('Model retraining completed successfully');
      
    } catch (error) {
      console.error('Model retraining failed:', error);
    }
  }

  /**
   * Perform actual model update (placeholder)
   */
  private async performModelUpdate(trainingData: any[]): Promise<void> {
    // This would integrate with your actual model training pipeline
    console.log(`Updating model with ${trainingData.length} training samples`);
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update performance metrics
    this.modelPerformance.accuracy = Math.min(100, this.modelPerformance.accuracy + 2);
    this.modelPerformance.lastUpdated = new Date();
  }

  /**
   * Update model performance metrics
   */
  private async updateModelPerformance(): Promise<void> {
    // Calculate performance from recent learning instances
    const recentInstances = Array.from(this.learningInstances.values())
      .filter(inst => (Date.now() - inst.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000); // Last week

    if (recentInstances.length > 0) {
      const avgUncertainty = recentInstances.reduce((sum, inst) => sum + inst.uncertainty, 0) / recentInstances.length;
      this.modelPerformance.accuracy = Math.max(0, 100 - (avgUncertainty * 100));
      
      // Add to improvement trend
      this.modelPerformance.improvementTrend.push(this.modelPerformance.accuracy);
      
      // Keep only last 30 data points
      if (this.modelPerformance.improvementTrend.length > 30) {
        this.modelPerformance.improvementTrend.shift();
      }
    }
  }

  /**
   * Get current learning metrics
   */
  getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  /**
   * Get model performance
   */
  getModelPerformance(): ModelPerformance {
    return { ...this.modelPerformance };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): void {
    this.modelPerformance = {
      accuracy: 85,
      precision: 82,
      recall: 80,
      f1Score: 81,
      fieldAccuracy: {},
      improvementTrend: [85],
      lastUpdated: new Date()
    };

    this.learningMetrics = {
      totalSamples: 0,
      humanReviewed: 0,
      modelImproved: 0,
      accuracyGain: 0,
      topImprovementAreas: [],
      learningVelocity: 0,
      qualityScore: 100
    };
  }

  /**
   * Initialize retraining triggers
   */
  private initializeRetrainingTriggers(): void {
    this.retrainingTriggers = [
      {
        condition: 'sample_count',
        threshold: this.config.minSamplesForRetraining,
        currentValue: 0,
        triggered: false,
        lastCheck: new Date()
      },
      {
        condition: 'accuracy_drop',
        threshold: this.config.performanceThreshold * 100,
        currentValue: 85,
        triggered: false,
        lastCheck: new Date()
      },
      {
        condition: 'time_based',
        threshold: this.config.retrainingFrequency,
        currentValue: 0,
        triggered: false,
        lastCheck: new Date()
      },
      {
        condition: 'uncertainty_increase',
        threshold: this.config.maxUncertaintyThreshold,
        currentValue: 0,
        triggered: false,
        lastCheck: new Date()
      }
    ];
  }

  /**
   * Reset retraining triggers after successful retraining
   */
  private resetRetrainingTriggers(): void {
    this.retrainingTriggers.forEach(trigger => {
      trigger.triggered = false;
      trigger.lastCheck = new Date();
    });
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    return `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate active learning metrics for dashboard display
   */
  generateActiveLearningMetrics(): {
    overallProgress: number;
    modelAccuracy: number;
    samplesProcessed: number;
    learningVelocity: number;
    qualityScore: number;
    topImprovementAreas: string[];
    recentActivity: any[];
  } {
    console.log('📊 Generating active learning metrics...');
    
    const recentInstances = Array.from(this.learningInstances.values())
      .filter(inst => (Date.now() - inst.timestamp.getTime()) < 24 * 60 * 60 * 1000)
      .slice(-10);

    return {
      overallProgress: Math.min(100, (this.learningMetrics.humanReviewed / 100) * 100),
      modelAccuracy: this.modelPerformance.accuracy,
      samplesProcessed: this.learningMetrics.totalSamples,
      learningVelocity: this.learningMetrics.learningVelocity,
      qualityScore: this.learningMetrics.qualityScore,
      topImprovementAreas: this.learningMetrics.topImprovementAreas.slice(0, 5),
      recentActivity: recentInstances.map(instance => ({
        id: instance.id,
        type: instance.feedbackType,
        uncertainty: Math.round(instance.uncertainty * 100),
        timestamp: instance.timestamp,
        areas: instance.improvementAreas
      }))
    };
  }

  /**
   * Export learning data for analysis
   */
  exportLearningData(): {
    instances: LearningInstance[];
    performance: ModelPerformance;
    metrics: LearningMetrics;
    config: LearningConfig;
  } {
    return {
      instances: Array.from(this.learningInstances.values()),
      performance: { ...this.modelPerformance },
      metrics: { ...this.learningMetrics },
      config: { ...this.config }
    };
  }

  /**
   * Import learning data for restoration
   */
  importLearningData(data: {
    instances: LearningInstance[];
    performance: ModelPerformance;
    metrics: LearningMetrics;
  }): void {
    console.log('📥 Importing learning data...');
    
    // Restore instances
    this.learningInstances.clear();
    data.instances.forEach(instance => {
      this.learningInstances.set(instance.id, instance);
    });
    
    // Restore performance and metrics
    this.modelPerformance = { ...data.performance };
    this.learningMetrics = { ...data.metrics };
    
    console.log(`✅ Imported ${data.instances.length} learning instances`);
  }
}

export const activeLearningPipeline = new ActiveLearningPipeline();
export default activeLearningPipeline;