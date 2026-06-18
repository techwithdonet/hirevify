import { UserProgress } from './types';

export const getDifficultyColor = (difficulty: string) => {
 switch (difficulty) {
 case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
 case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
 default: return 'bg-gray-100 text-gray-800 border-gray-200';
 }
};

export const getProgressPercentage = (userProgress: UserProgress | null) => {
 if (!userProgress) return 0;
 return Math.round(((userProgress.currentModule / userProgress.totalModules) + 
 (userProgress.completedProjects / userProgress.totalProjects)) / 2 * 100);
};

export const getMockUserProgress = () => ({
 pathId: 'marketing-to-ux',
 enrolled: true,
 currentModule: 3,
 totalModules: 8,
 completedProjects: 2,
 totalProjects: 6,
 skillsGained: ['User Research', 'Wireframing', 'Figma Basics'],
 nextMilestone: 'Complete Portfolio Project',
 estimatedCompletion: '2024-06-15'
});







