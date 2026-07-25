import { useState, useEffect } from 'react';
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Eye, Play, Shield, Star, Trophy, Users, Zap, Lock, Crown, Target, TrendingUp, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { AssessmentEcosystem } from './AssessmentEcosystem';
import hirevifyLogo from '../../assets/hirevify-logo-transparent.png';

interface SkillsCertificationProps {
 onBack: () => void;
 onUpgrade: () => void;
}

interface Certification {
 id: string;
 name: string;
 category: string;
 difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
 duration: string;
 description: string;
 skills: string[];
 proctored: boolean;
 industryRecognized: boolean;
 credentialType: 'Badge' | 'Certificate' | 'Professional License';
 validityPeriod: string;
 prerequisites?: string[];
 examFormat: string;
 passingScore: number;
 enrolledCount: number;
 averageScore: number;
 employerPartners: string[];
 salary_boost: string;
 isPremium?: boolean;
 provider: string;
 providerType: 'industry_partner' | 'educational' | 'company_sponsor' | 'hirevify_developed';
 credibilityScore: number;
}

interface UserCertification {
 id: string;
 certificationId: string;
 status: 'not_started' | 'in_progress' | 'completed' | 'expired';
 score?: number;
 earnedDate?: string;
 expiryDate?: string;
 attempts: number;
 credentialUrl?: string;
}

const certifications: Certification[] = [
 {
 id: 'react-expert',
 name: 'React Development Expert',
 category: 'Frontend Development',
 difficulty: 'Advanced',
 duration: '4 hours',
 description: 'Comprehensive assessment covering React fundamentals, hooks, state management, performance optimization, and modern patterns.',
 skills: ['React', 'JavaScript', 'JSX', 'Hooks', 'State Management', 'Performance Optimization'],
 proctored: true,
 industryRecognized: true,
 credentialType: 'Certificate',
 validityPeriod: '2 years',
 prerequisites: ['JavaScript Fundamentals', '6 months React experience'],
 examFormat: 'Live coding + Multiple choice + Project review',
 passingScore: 80,
 enrolledCount: 15420,
 averageScore: 78,
 employerPartners: ['Microsoft', 'Google', 'Meta', 'Netflix'],
 salary_boost: '15-25%',
 provider: 'Meta Developer Certification',
 providerType: 'company_sponsor',
 credibilityScore: 88
 },
 {
 id: 'aws-cloud',
 name: 'AWS Cloud Architecture Professional',
 category: 'Cloud Computing',
 difficulty: 'Expert',
 duration: '5 hours',
 description: 'Master-level assessment of AWS services, cloud architecture, security, and cost optimization.',
 skills: ['AWS Services', 'Cloud Architecture', 'Security', 'Cost Optimization', 'DevOps', 'Monitoring'],
 proctored: true,
 industryRecognized: true,
 credentialType: 'Professional License',
 validityPeriod: '3 years',
 prerequisites: ['AWS Experience', 'Cloud Fundamentals'],
 examFormat: 'Architecture design + Hands-on labs + Scenario-based questions',
 passingScore: 85,
 enrolledCount: 4290,
 averageScore: 74,
 employerPartners: ['Amazon', 'Microsoft', 'Netflix', 'Salesforce'],
 salary_boost: '30-50%',
 isPremium: true,
 provider: 'AWS Training & Certification',
 providerType: 'industry_partner',
 credibilityScore: 95
 },
 {
 id: 'data-science-stanford',
 name: 'Data Science Specialist',
 category: 'Data Science',
 difficulty: 'Advanced',
 duration: '6 hours',
 description: 'Comprehensive evaluation of statistical analysis, machine learning, data visualization, and business intelligence skills.',
 skills: ['Python/R', 'Machine Learning', 'Statistics', 'Data Visualization', 'SQL', 'Business Analytics'],
 proctored: true,
 industryRecognized: true,
 credentialType: 'Professional License',
 validityPeriod: '2 years',
 prerequisites: ['Statistics Background', 'Programming Experience'],
 examFormat: 'Data analysis project + ML model building + Presentation',
 passingScore: 80,
 enrolledCount: 6420,
 averageScore: 76,
 employerPartners: ['Google', 'Microsoft', 'IBM', 'Tesla'],
 salary_boost: '25-40%',
 isPremium: true,
 provider: 'Stanford University',
 providerType: 'educational',
 credibilityScore: 90
 },
 {
 id: 'python-backend',
 name: 'Python Backend Development',
 category: 'Backend Development',
 difficulty: 'Intermediate',
 duration: '3.5 hours',
 description: 'Evaluate your Python backend skills including API development, database integration, security, and deployment.',
 skills: ['Python', 'Django/Flask', 'REST APIs', 'Database Design', 'Security', 'Testing'],
 proctored: true,
 industryRecognized: true,
 credentialType: 'Certificate',
 validityPeriod: '2 years',
 prerequisites: ['Python Basics', 'SQL Knowledge'],
 examFormat: 'Coding challenges + System design + API development',
 passingScore: 75,
 enrolledCount: 12890,
 averageScore: 72,
 employerPartners: ['Amazon', 'Spotify', 'Uber', 'Airbnb'],
 salary_boost: '20-30%',
 provider: 'Google Developer Certification',
 providerType: 'company_sponsor',
 credibilityScore: 88
 },
 {
 id: 'communication-skills',
 name: 'Professional Communication Excellence',
 category: 'Soft Skills',
 difficulty: 'Intermediate',
 duration: '2 hours',
 description: 'Assess your written and verbal communication, presentation skills, and professional etiquette.',
 skills: ['Written Communication', 'Verbal Communication', 'Presentation', 'Active Listening', 'Emotional Intelligence'],
 proctored: true,
 industryRecognized: true,
 credentialType: 'Certificate',
 validityPeriod: '1 year',
 examFormat: 'Role-playing scenarios + Written assessments + Video presentations',
 passingScore: 80,
 enrolledCount: 8950,
 averageScore: 82,
 employerPartners: ['Link', 'Salesforce', 'HubSpot', 'Zoom'],
 salary_boost: '10-18%',
 provider: 'HireVify Skills Lab',
 providerType: 'hirevify_developed',
 credibilityScore: 82
 }
];

export function SkillsCertification({ onBack, onUpgrade }: SkillsCertificationProps) {
 const { user } = useAuth();
 const [selectedCategory, setSelectedCategory] = useState('All');
 const [userCertifications, setUserCertifications] = useState<UserCertification[]>([]);
 const [activeTab, setActiveTab] = useState('available');
 const [showEcosystemInfo, setShowEcosystemInfo] = useState(false);

 const categories = ['All', 'Frontend Development', 'Backend Development', 'Cloud Computing', 'Data Science', 'Soft Skills'];

 useEffect(() => {
 // Simulate user's certification progress
 setUserCertifications([
 {
 id: '1',
 certificationId: 'react-expert',
 status: 'completed',
 score: 87,
 earnedDate: '2024-01-15',
 expiryDate: '2026-01-15',
 attempts: 1,
 credentialUrl: 'https://hirevify.com/credentials/react-expert-87'
 },
 {
 id: '2',
 certificationId: 'python-backend',
 status: 'in_progress',
 attempts: 0
 }
 ]);
 }, []);

 const filteredCertifications = certifications.filter(cert => 
 selectedCategory === 'All' || cert.category === selectedCategory
 );

 const getUserCertification = (certId: string) => {
 return userCertifications.find(uc => uc.certificationId === certId);
 };

 const startCertification = (certId: string, isPremium?: boolean) => {
 if (isPremium) {
 toast.info('This is a premium certification. Upgrade to access!');
 onUpgrade();
 return;
 }

 const cert = certifications.find(c => c.id === certId);
 if (cert) {
 toast.success(`Starting ${cert.name} certification process...`);
 // In a real app, this would navigate to the assessment
 }
 };

 const getDifficultyColor = (difficulty: string) => {
 switch (difficulty) {
 case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
 case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
 case 'Expert': return 'bg-red-100 text-red-800 border-red-200';
 default: return 'bg-gray-100 text-gray-800 border-gray-200';
 }
 };

 const getProviderTypeColor = (type: string) => {
 switch (type) {
 case 'industry_partner': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'educational': return 'bg-purple-100 text-purple-800 border-purple-200';
 case 'company_sponsor': return 'bg-green-100 text-green-800 border-green-200';
 case 'hirevify_developed': return 'bg-orange-100 text-orange-800 border-orange-200';
 default: return 'bg-gray-100 text-gray-800 border-gray-200';
 }
 };

 const getStatusBadge = (status: string, score?: number) => {
 switch (status) {
 case 'completed':
 return (
 <Badge className="bg-green-100 text-green-800 border-green-200">
 <CheckCircle className="w-3 h-3 mr-1" />
 Certified {score? `(${score}%)`: ''}
 </Badge>
 );
 case 'in_progress':
 return (
 <Badge className="bg-blue-100 text-blue-800 border-blue-200">
 <Clock className="w-3 h-3 mr-1" />
 In Progress
 </Badge>
 );
 case 'expired':
 return (
 <Badge className="bg-red-100 text-red-800 border-red-200">
 Expired
 </Badge>
 );
 default:
 return null;
 }
 };

 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <header className="bg-card border-b border-border p-6">
 <div className="max-w-7xl mx-auto flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Button variant="ghost" onClick={onBack}>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back to Dashboard
  </Button>
  </div>
 <div className="flex items-center space-x-4">
 <Dialog open={showEcosystemInfo} onOpenChange={setShowEcosystemInfo}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm">
 <Info className="w-4 h-4 mr-2" />
 Who Creates These?
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Assessment Ecosystem</DialogTitle>
 </DialogHeader>
 <AssessmentEcosystem />
 </DialogContent>
 </Dialog>
 <Badge className="bg-primary/10 text-primary border-primary/20">
  <Shield className="w-3 h-3 mr-1" />
  Industry Recognized
  </Badge>
  <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="workspace-header-logo" />
  </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto p-6">
 {/* Hero Section */}
 <div className="text-center mb-12">
 <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
 <Trophy className="w-4 h-4 mr-2" />
 Skills-Based Career Advancement
 </div>
 <h1 className="text-4xl font-bold text-foreground mb-4">
 HireVify Skills Certification
 </h1>
 <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
 Earn industry-recognized credentials that prove your skills to employers. 
 Our rigorous, proctored assessments are created by leading companies, universities, and certification bodies.
 </p>
 
 {/* Trust Indicators */}
 <div className="flex justify-center items-center space-x-8 mb-8 text-sm text-muted-foreground">
 <div className="flex items-center">
 <Shield className="w-4 h-4 mr-2 text-blue-600" />
 Proctored & Secure
 </div>
 <div className="flex items-center">
 <Users className="w-4 h-4 mr-2 text-green-600" />
 Industry Partners
 </div>
 <div className="flex items-center">
 <Star className="w-4 h-4 mr-2 text-yellow-600" />
 Employer Trusted
 </div>
 </div>
 
 {/* Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="text-center">
 <div className="text-2xl font-bold text-primary mb-1">50,000+</div>
 <div className="text-sm text-muted-foreground">Certified Professionals</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-primary mb-1">200+</div>
 <div className="text-sm text-muted-foreground">Partner Organizations</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-primary mb-1">85%</div>
 <div className="text-sm text-muted-foreground">Get Job Offers</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-primary mb-1">25%</div>
 <div className="text-sm text-muted-foreground">Average Salary Boost</div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="available">Available Certifications</TabsTrigger>
 <TabsTrigger value="my-certifications">My Certifications</TabsTrigger>
 <TabsTrigger value="ecosystem">Assessment Ecosystem</TabsTrigger>
 </TabsList>

 <TabsContent value="available" className="space-y-6">
 {/* Category Filter */}
 <div className="flex flex-wrap gap-2">
 {categories.map((category) => (
 <Button
 key={category}
 variant={selectedCategory === category? "default": "outline"}
 size="sm"
 onClick={() => setSelectedCategory(category)}
 >
 {category}
 </Button>
 ))}
 </div>

 {/* Certifications Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredCertifications.map((cert) => {
 const userCert = getUserCertification(cert.id);
 return (
 <Card key={cert.id} className="relative">
 {cert.isPremium && (
 <div className="absolute top-4 right-4">
 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
 <Crown className="w-3 h-3 mr-1" />
 Premium
 </Badge>
 </div>
 )}
 
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <CardTitle className="text-lg mb-2 pr-4">{cert.name}</CardTitle>
 <div className="flex flex-wrap gap-2 mb-3">
 <Badge variant="outline" className={getDifficultyColor(cert.difficulty)}>
 {cert.difficulty}
 </Badge>
 <Badge variant="outline">
 <Clock className="w-3 h-3 mr-1" />
 {cert.duration}
 </Badge>
 {cert.proctored && (
 <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
 <Shield className="w-3 h-3 mr-1" />
 Proctored
 </Badge>
 )}
 </div>
 {userCert && getStatusBadge(userCert.status, userCert.score)}
 </div>
 </div>

 {/* Provider Information */}
 <div className="mb-3">
 <div className="text-xs font-medium text-muted-foreground mb-1">Certification Provider</div>
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium">{cert.provider}</span>
 <div className="flex items-center space-x-2">
 <Badge className={getProviderTypeColor(cert.providerType)} style={{fontSize: '10px'}}>
 {cert.providerType.replace('_', ' ').toUpperCase()}
 </Badge>
 <div className="text-xs text-muted-foreground">
 {cert.credibilityScore}% trusted
 </div>
 </div>
 </div>
 </div>
 </CardHeader>

 <CardContent>
 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
 {cert.description}
 </p>

 <div className="space-y-3 mb-4">
 <div>
 <div className="text-xs font-medium text-muted-foreground mb-1">Skills Covered</div>
 <div className="flex flex-wrap gap-1">
 {cert.skills.slice(0, 4).map((skill) => (
 <Badge key={skill} variant="secondary" className="text-xs">
 {skill}
 </Badge>
 ))}
 {cert.skills.length > 4 && (
 <Badge variant="secondary" className="text-xs">
 +{cert.skills.length - 4} more
 </Badge>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
 <div>
 <div className="font-medium">Enrolled</div>
 <div>{cert.enrolledCount.toLocaleString()}</div>
 </div>
 <div>
 <div className="font-medium">Avg Score</div>
 <div>{cert.averageScore}%</div>
 </div>
 </div>

 <div>
 <div className="text-xs font-medium text-muted-foreground mb-1">Career Impact</div>
 <div className="text-sm font-semibold text-green-600">
 <TrendingUp className="w-3 h-3 inline mr-1" />
 {cert.salary_boost} salary boost
 </div>
 </div>
 </div>

 <div className="space-y-2">
 {userCert?.status === 'completed'? (
 <Button variant="outline" className="w-full">
 <Eye className="w-4 h-4 mr-2" />
 View Credential
 </Button>
 ): userCert?.status === 'in_progress'? (
 <Button className="w-full">
 <Play className="w-4 h-4 mr-2" />
 Continue Assessment
 </Button>
 ): (
 <Button 
 className="w-full" 
 onClick={() => startCertification(cert.id, cert.isPremium)}
 disabled={cert.isPremium}
 >
 {cert.isPremium? (
 <>
 <Lock className="w-4 h-4 mr-2" />
 Upgrade to Access
 </>
 ): (
 <>
 <Play className="w-4 h-4 mr-2" />
 Start Certification
 </>
 )}
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </TabsContent>

 <TabsContent value="my-certifications" className="space-y-6">
 {userCertifications.length > 0? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {userCertifications.map((userCert) => {
 const cert = certifications.find(c => c.id === userCert.certificationId);
 if (!cert) return null;

 return (
 <Card key={userCert.id}>
 <CardHeader>
 <div className="flex items-start justify-between">
 <div>
 <CardTitle className="text-lg mb-2">{cert.name}</CardTitle>
 <div className="text-xs text-muted-foreground mb-2">
 by {cert.provider}
 </div>
 {getStatusBadge(userCert.status, userCert.score)}
 </div>
 {userCert.status === 'completed' && (
 <div className="text-right">
 <div className="text-2xl font-bold text-primary">{userCert.score}%</div>
 <div className="text-xs text-muted-foreground">Score</div>
 </div>
 )}
 </div>
 </CardHeader>

 <CardContent>
 {userCert.status === 'completed' && (
 <div className="space-y-3">
 <div>
 <div className="text-xs font-medium text-muted-foreground">Earned Date</div>
 <div className="text-sm">{new Date(userCert.earnedDate!).toLocaleDateString()}</div>
 </div>
 <div>
 <div className="text-xs font-medium text-muted-foreground">Valid Until</div>
 <div className="text-sm">{new Date(userCert.expiryDate!).toLocaleDateString()}</div>
 </div>
 <Button variant="outline" className="w-full">
 <Eye className="w-4 h-4 mr-2" />
 View Credential
 </Button>
 </div>
 )}

 {userCert.status === 'in_progress' && (
 <div className="space-y-3">
 <div>
 <div className="text-xs font-medium text-muted-foreground mb-1">Progress</div>
 <Progress value={33} className="h-2" />
 <div className="text-xs text-muted-foreground mt-1">1 of 3 sections completed</div>
 </div>
 <Button className="w-full">
 <Play className="w-4 h-4 mr-2" />
 Continue Assessment
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 ): (
 <div className="text-center py-12">
 <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold mb-2">No Certifications Yet</h3>
 <p className="text-muted-foreground mb-6">Start your certification journey to prove your skills to employers</p>
 <Button onClick={() => setActiveTab('available')}>
 Explore Certifications
 </Button>
 </div>
 )}
 </TabsContent>

 <TabsContent value="ecosystem">
 <AssessmentEcosystem />
 </TabsContent>
 </Tabs>
 </main>
 </div>
 );
}







