export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
    case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return { className: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' };
    case 'accepted':
      return { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Accepted' };
    case 'under_review':
      return { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Under Review' };
    case 'rejected':
      return { className: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' };
    default:
      return { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Applied' };
  }
};

export const getDaysUntilDeadline = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const filterInternships = (
  internships: any[],
  selectedCategory: string,
  searchTerm: string,
  sortBy: string
) => {
  return internships
    .filter(internship => {
      const matchesCategory = selectedCategory === 'All' || internship.category === selectedCategory;
      const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           internship.skillsRequired.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'payment':
          return b.payment - a.payment;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default: // featured
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return b.payment - a.payment;
      }
    });
};

export const getMockApplications = () => [
  {
    id: '1',
    internshipId: 'micro-1',
    status: 'completed' as const,
    appliedDate: '2024-01-15',
    completedDate: '2024-01-20',
    rating: 4.9,
    feedback: 'Outstanding work! The documentation was comprehensive and well-structured.',
    nextSteps: ['Consider full-time frontend position', 'Invitation to next project']
  },
  {
    id: '2',
    internshipId: 'micro-3',
    status: 'under_review' as const,
    appliedDate: '2024-02-10'
  }
];