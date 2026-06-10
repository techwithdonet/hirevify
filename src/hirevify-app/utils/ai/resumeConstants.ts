/**
 * Resume Builder Constants
 * 
 * Shared constants and configuration for AI Resume Builder
 */

export const RESUME_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, traditional layout optimized for ATS systems',
    preview: '/template-professional.png',
    features: ['ATS-Optimized', 'Traditional Format', 'Corporate Style'],
    atsScore: 98
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with visual hierarchy',
    preview: '/template-modern.png',
    features: ['Visual Impact', 'Two-Column', 'Creative Industries'],
    atsScore: 85
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, focused design for maximum readability',
    preview: '/template-minimalist.png',
    features: ['Clean Design', 'Easy to Read', 'Versatile'],
    atsScore: 92
  }
];

export const RESUME_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started' },
  { id: 'template', title: 'Template', description: 'Choose design' },
  { id: 'contact', title: 'Contact', description: 'Personal info' },
  { id: 'summary', title: 'Summary', description: 'Professional summary' },
  { id: 'experience', title: 'Experience', description: 'Work history' },
  { id: 'skills', title: 'Skills', description: 'Technical & soft skills' },
  { id: 'education', title: 'Education', description: 'Academic background' },
  { id: 'ai-optimization', title: 'AI Optimize', description: 'AI suggestions' },
  { id: 'ats-analysis', title: 'ATS Check', description: 'Compatibility score' },
  { id: 'review', title: 'Review', description: 'Final review' }
];

export const AI_INSIGHTS_MOCK = {
  atsCompatibilityWarning: {
    type: 'warning' as const,
    title: 'ATS Compatibility Needs Improvement',
    priority: 'high' as const
  },
  
  highPriorityOptimizations: {
    type: 'suggestion' as const,
    title: 'High-Priority Optimizations Available',
    priority: 'high' as const
  },
  
  summaryTooShort: {
    type: 'improvement' as const,
    title: 'Professional Summary Too Brief',
    description: 'A compelling 2-3 sentence summary can significantly improve recruiter engagement.',
    priority: 'medium' as const
  }
};

export const MOCK_JOB_TARGET = {
  title: "Senior Software Engineer",
  company: "Tech Company", 
  description: "Sample job description",
  requirements: ["React", "TypeScript", "Node.js"],
  preferredSkills: ["AWS", "Docker"],
  responsibilities: ["Develop applications"],
  experienceLevel: "senior" as const,
  industry: "technology",
  remote: true
};




