/**
 * Market Intelligence Mock Data - FOR TESTING ONLY
 * 
 * âš ï¸ WARNING: This file contains mock data for testing purposes only.
 * Do NOT use this data in production or present it as real market intelligence.
 * Real market intelligence requires integration with legitimate data providers.
 */

export interface SalaryInsight {
  role: string;
  location: string;
  experience: string;
  current: {
    min: number;
    median: number;
    max: number;
    percentile75: number;
    percentile90: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    timeframe: 'monthly' | 'quarterly' | 'yearly';
  };
  factors: {
    skillsPremium: Record<string, number>;
    locationMultiplier: number;
    companySize: Record<string, number>;
    industryMultiplier: number;
  };
  demandScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  forecastAccuracy: number;
}

export interface SkillDemand {
  skill: string;
  demandScore: number;
  growthRate: number;
  jobOpenings: number;
  averageSalary: number;
  experienceRequired: {
    entry: number;
    mid: number;
    senior: number;
  };
  topCompanies: string[];
  relatedSkills: string[];
  certifications: string[];
  trend: 'hot' | 'rising' | 'stable' | 'declining';
  regionData: Array<{
    region: string;
    demand: number;
    salary: number;
  }>;
}

export interface HiringTrend {
  period: string;
  totalHires: number;
  averageTimeToHire: number;
  averageSalary: number;
  topSkills: string[];
  industryBreakdown: Record<string, number>;
  sourceEffectiveness: Record<string, number>;
  diversityMetrics: {
    gender: Record<string, number>;
    experience: Record<string, number>;
  };
}

export const generateMockSalaryData = (role: string, location: string): SalaryInsight[] => [
  {
    role,
    location,
    experience: 'Mid-Level (3-5 years)',
    current: {
      min: 95000,
      median: 125000,
      max: 165000,
      percentile75: 145000,
      percentile90: 155000
    },
    trend: {
      direction: 'up',
      percentage: 8.5,
      timeframe: 'yearly'
    },
    factors: {
      skillsPremium: {
        'TypeScript': 12,
        'AWS': 18,
        'System Design': 22,
        'React': 5,
        'Node.js': 8
      },
      locationMultiplier: 1.2,
      companySize: {
        'Startup': 0.9,
        'Mid-size': 1.0,
        'Large Corp': 1.1,
        'FAANG': 1.4
      },
      industryMultiplier: 1.1
    },
    demandScore: 89,
    competitionLevel: 'medium',
    forecastAccuracy: 87
  }
];

export const generateMockSkillsData = (): SkillDemand[] => [
  {
    skill: 'TypeScript',
    demandScore: 94,
    growthRate: 28,
    jobOpenings: 8940,
    averageSalary: 135000,
    experienceRequired: { entry: 1, mid: 2, senior: 4 },
    topCompanies: ['Microsoft', 'Google', 'Airbnb', 'Stripe', 'Netflix'],
    relatedSkills: ['JavaScript', 'React', 'Node.js', 'Angular'],
    certifications: ['Microsoft TypeScript Certification'],
    trend: 'hot',
    regionData: [
      { region: 'San Francisco', demand: 98, salary: 155000 },
      { region: 'New York', demand: 92, salary: 145000 },
      { region: 'Seattle', demand: 89, salary: 140000 }
    ]
  },
  {
    skill: 'React',
    demandScore: 91,
    growthRate: 12,
    jobOpenings: 15420,
    averageSalary: 125000,
    experienceRequired: { entry: 0.5, mid: 2, senior: 4 },
    topCompanies: ['Facebook', 'Netflix', 'Airbnb', 'Uber', 'Shopify'],
    relatedSkills: ['JavaScript', 'Redux', 'Next.js', 'TypeScript'],
    certifications: ['React Developer Certification'],
    trend: 'stable',
    regionData: [
      { region: 'San Francisco', demand: 95, salary: 145000 },
      { region: 'New York', demand: 88, salary: 135000 },
      { region: 'Austin', demand: 85, salary: 110000 }
    ]
  },
  {
    skill: 'AWS',
    demandScore: 88,
    growthRate: 22,
    jobOpenings: 12350,
    averageSalary: 145000,
    experienceRequired: { entry: 1, mid: 3, senior: 5 },
    topCompanies: ['Amazon', 'Netflix', 'Goldman Sachs', 'Capital One', 'Salesforce'],
    relatedSkills: ['Docker', 'Kubernetes', 'Terraform', 'DevOps'],
    certifications: ['AWS Solutions Architect', 'AWS Developer'],
    trend: 'rising',
    regionData: [
      { region: 'Seattle', demand: 96, salary: 165000 },
      { region: 'San Francisco', demand: 90, salary: 155000 },
      { region: 'New York', demand: 87, salary: 150000 }
    ]
  }
];

export const generateMockHiringTrends = (): HiringTrend[] => [
  {
    period: 'Q1 2024',
    totalHires: 12450,
    averageTimeToHire: 28,
    averageSalary: 128000,
    topSkills: ['React', 'TypeScript', 'Python', 'AWS', 'Node.js'],
    industryBreakdown: {
      'Technology': 45,
      'Finance': 22,
      'Healthcare': 15,
      'E-commerce': 12,
      'Other': 6
    },
    sourceEffectiveness: {
      'Link': 35,
      'Referrals': 28,
      'Company Website': 18,
      'Recruiters': 15,
      'Job Boards': 4
    },
    diversityMetrics: {
      gender: { 'Male': 62, 'Female': 35, 'Non-binary': 3 },
      experience: { 'Junior': 25, 'Mid': 45, 'Senior': 25, 'Lead': 5 }
    }
  }
];






