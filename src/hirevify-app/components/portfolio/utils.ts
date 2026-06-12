import { Globe, GitBranch, Image, FileText, Link } from 'lucide-react';

export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'website': return Globe;
    case 'GitBranch': return GitBranch;
    case 'design': return Image;
    case 'document': return FileText;
    default: return Link;
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'website': return 'bg-blue-100 text-blue-800';
    case 'GitBranch': return 'bg-gray-100 text-gray-800';
    case 'design': return 'bg-purple-100 text-purple-800';
    case 'document': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};







