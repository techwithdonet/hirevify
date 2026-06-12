export interface MicroInternship {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  duration: string;
  timeCommitment: string;
  payment: number;
  description: string;
  deliverables: string[];
  skillsRequired: string[];
  skillsGained: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  isRemote: boolean;
  location?: string;
  applicants: number;
  deadline: string;
  startDate: string;
  mentorSupport: boolean;
  referenceOffered: boolean;
  conversionPotential: boolean;
  companyRating: number;
  successMetrics: string[];
  learningResources: string[];
  isUrgent?: boolean;
  isFeatured?: boolean;
  applicationQuestions: string[];
}

export interface Application {
  id: string;
  internshipId: string;
  status: 'applied' | 'under_review' | 'accepted' | 'rejected' | 'completed';
  appliedDate: string;
  feedback?: string;
  rating?: number;
  completedDate?: string;
  nextSteps?: string[];
}

export interface MicroInternshipsProps {
  onBack: () => void;
  onUpgrade: () => void;
}







