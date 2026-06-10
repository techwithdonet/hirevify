export interface CareerSwitcherTrackProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  fromCareers: string[];
  toCareers: string[];
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: number;
  projects: number;
  mentorship: boolean;
  jobPlacementRate: number;
  avgSalary: string;
  enrolled: number;
  rating: number;
  skills: string[];
  isPremium?: boolean;
}

export interface UserProgress {
  pathId: string;
  enrolled: boolean;
  currentModule: number;
  totalModules: number;
  completedProjects: number;
  totalProjects: number;
  skillsGained: string[];
  nextMilestone: string;
  estimatedCompletion: string;
}

export interface SuccessStory {
  id: string;
  name: string;
  transition: string;
  before: {
    title: string;
    salary: string;
  };
  after: {
    title: string;
    salary: string;
  };
  testimonial: string;
  duration: string;
  salaryIncrease: string;
}





