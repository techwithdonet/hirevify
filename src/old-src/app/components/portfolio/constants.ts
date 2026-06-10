import { PortfolioItem } from './types';

export const MOCK_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: '1',
    title: 'E-commerce React App',
    description: 'A full-stack e-commerce application built with React, Node.js, and PostgreSQL. Features include user authentication, payment processing, and admin dashboard.',
    type: 'website',
    url: 'https://ecommerce-demo.com',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe']
  },
  {
    id: '2',
    title: 'Mobile UI Design System',
    description: 'Comprehensive design system for a fintech mobile app including components, patterns, and guidelines.',
    type: 'design',
    url: 'https://figma.com/design-system',
    technologies: ['Figma', 'Design Systems', 'Mobile UI']
  },
  {
    id: '3',
    title: 'API Integration Library',
    description: 'Open-source JavaScript library for seamless API integrations with popular third-party services.',
    type: 'github',
    url: 'https://github.com/username/api-library',
    technologies: ['JavaScript', 'TypeScript', 'API Integration']
  }
];