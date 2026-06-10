import { 
  Plug, Database, Mail, Calendar, Shield, BarChart3, FileText 
} from 'lucide-react';
import { Integration } from './types';

export const AVAILABLE_INTEGRATIONS: Integration[] = [
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications about new applications, interview updates, and hiring milestones.',
    category: 'communication',
    icon: '💬',
    status: 'available',
    isPremium: false,
    features: ['Application alerts', 'Interview reminders', 'Team notifications', 'Custom channels'],
    setupComplexity: 'simple',
    popularity: 88
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Conduct interviews and collaborate with your team directly through Microsoft Teams.',
    category: 'communication',
    icon: '👥',
    status: 'available',
    isPremium: false,
    features: ['Video interviews', 'Team collaboration', 'File sharing', 'Meeting recordings'],
    setupComplexity: 'simple',
    popularity: 82
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Host professional video interviews with automatic recording and calendar integration.',
    category: 'communication',
    icon: '📹',
    status: 'available',
    isPremium: false,
    features: ['Video interviews', 'Auto recordings', 'Screen sharing', 'Waiting rooms'],
    setupComplexity: 'simple',
    popularity: 90
  },

  // Scheduling
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Automatically schedule interviews and send calendar invites to candidates and interviewers.',
    category: 'scheduling',
    icon: '📅',
    status: 'available',
    isPremium: false,
    features: ['Auto-scheduling', 'Calendar sync', 'Timezone handling', 'Reminder emails'],
    setupComplexity: 'simple',
    popularity: 92
  },

  // Productivity
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    description: 'Integrate with Gmail, Calendar, and Drive for comprehensive workflow management.',
    category: 'productivity',
    icon: '📧',
    status: 'available',
    isPremium: false,
    features: ['Email integration', 'Calendar sync', 'Document sharing', 'Drive storage'],
    setupComplexity: 'moderate',
    popularity: 96
  },

  // ATS Systems
  {
    id: 'workday',
    name: 'Workday',
    description: 'Sync candidate data with Workday HCM for seamless workforce management and reporting.',
    category: 'ats',
    icon: '🏢',
    status: 'available',
    isPremium: true,
    features: ['Candidate sync', 'Job posting sync', 'Reporting integration', 'SSO authentication'],
    setupComplexity: 'advanced',
    popularity: 95
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    description: 'Two-way sync with Greenhouse ATS for unified candidate tracking and workflow management.',
    category: 'ats',
    icon: '🌱',
    status: 'available',
    isPremium: true,
    features: ['Candidate sync', 'Interview scheduling', 'Scorecard integration', 'Pipeline sync'],
    setupComplexity: 'advanced',
    popularity: 85
  },
  {
    id: 'lever',
    name: 'Lever',
    description: 'Seamless integration with Lever ATS for complete candidate lifecycle management.',
    category: 'ats',
    icon: '⚖️',
    status: 'available',
    isPremium: true,
    features: ['Candidate pipeline', 'Interview kits', 'Offer management', 'Analytics sync'],
    setupComplexity: 'advanced',
    popularity: 78
  },

  // Background Check Integrations
  {
    id: 'checkr',
    name: 'Checkr',
    description: 'Automated background checks with real-time status updates and compliance reporting.',
    category: 'background-check',
    icon: '🔍',
    status: 'available',
    isPremium: true,
    features: ['Criminal background', 'Employment verification', 'Education verification', 'Reference checks'],
    setupComplexity: 'moderate',
    popularity: 85
  },
  {
    id: 'sterling_check',
    name: 'Sterling Check',
    description: 'Comprehensive background screening with global coverage and automated workflows.',
    category: 'background-check',
    icon: '🛡️',
    status: 'available',
    isPremium: true,
    features: ['Global screening', 'Identity verification', 'Drug testing', 'Continuous monitoring'],
    setupComplexity: 'advanced',
    popularity: 82
  },
  {
    id: 'accurate_background',
    name: 'Accurate Background',
    description: 'Fast and reliable background checks with customizable screening packages.',
    category: 'background-check',
    icon: '✅',
    status: 'available',
    isPremium: true,
    features: ['Instant verifications', 'Custom packages', 'Compliance tools', 'Mobile access'],
    setupComplexity: 'moderate',
    popularity: 79
  },
  {
    id: 'hireright',
    name: 'HireRight',
    description: 'Industry-leading background screening with AI-powered risk assessment.',
    category: 'background-check',
    icon: '🎯',
    status: 'available',
    isPremium: true,
    features: ['AI risk scoring', 'International screening', 'Social media screening', 'Automated adjudication'],
    setupComplexity: 'advanced',
    popularity: 88
  },

  // Analytics Integrations
  {
    id: 'tableau',
    name: 'Tableau',
    description: 'Advanced data visualization and analytics for hiring metrics and workforce insights.',
    category: 'analytics',
    icon: '📊',
    status: 'available',
    isPremium: true,
    features: ['Custom dashboards', 'Real-time reporting', 'Predictive analytics', 'Data blending'],
    setupComplexity: 'advanced',
    popularity: 87
  },
  {
    id: 'power_bi',
    name: 'Power BI',
    description: 'Microsoft Power BI integration for comprehensive hiring analytics and reporting.',
    category: 'analytics',
    icon: '📈',
    status: 'available',
    isPremium: true,
    features: ['Interactive reports', 'KPI tracking', 'Automated insights', 'Mobile dashboards'],
    setupComplexity: 'moderate',
    popularity: 83
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track recruitment website performance and candidate journey analytics.',
    category: 'analytics',
    icon: '🎯',
    status: 'available',
    isPremium: false,
    features: ['Website tracking', 'Conversion funnels', 'Source attribution', 'Custom events'],
    setupComplexity: 'simple',
    popularity: 92
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Event-based analytics to understand candidate engagement and hiring funnel performance.',
    category: 'analytics',
    icon: '📱',
    status: 'available',
    isPremium: true,
    features: ['Event tracking', 'Cohort analysis', 'A/B testing', 'Retention analysis'],
    setupComplexity: 'moderate',
    popularity: 76
  },
  {
    id: 'worklytics',
    name: 'Worklytics',
    description: 'People analytics platform for measuring team productivity and collaboration patterns.',
    category: 'analytics',
    icon: '🧑‍💼',
    status: 'available',
    isPremium: true,
    features: ['Team analytics', 'Collaboration insights', 'Productivity metrics', 'Meeting analysis'],
    setupComplexity: 'advanced',
    popularity: 72
  }
];

export const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'All Integrations', icon: Plug },
  { id: 'ats', label: 'ATS Systems', icon: Database },
  { id: 'communication', label: 'Communication', icon: Mail },
  { id: 'scheduling', label: 'Scheduling', icon: Calendar },
  { id: 'background-check', label: 'Background Check', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'productivity', label: 'Productivity', icon: FileText }
];

export const STATUS_CHECK_INTERVAL = 30000; // 30 seconds