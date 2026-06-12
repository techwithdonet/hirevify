import { useState } from 'react';
import { Shield, Award, Users, Building, BookOpen, CheckCircle, Eye, Star, Zap, Target, TrendingUp, Globe, Lock, Verified } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

interface AssessmentProvider {
  id: string;
  name: string;
  type: 'industry_partner' | 'educational' | 'company_sponsor' | 'hirevify_developed';
  logo?: string;
  description: string;
  certifications: string[];
  credibility: number;
  recognition: string[];
  validationProcess: string;
  examples: string[];
}

interface AssessmentProcess {
  step: number;
  title: string;
  description: string;
  responsibleParty: string;
  timeframe: string;
  validation: string;
}

const assessmentProviders: AssessmentProvider[] = [
  {
    id: 'industry-partners',
    name: 'Industry Standards Organizations',
    type: 'industry_partner',
    description: 'Established certification bodies that have created industry-standard assessments over decades',
    certifications: ['AWS Cloud Architecture', 'Google Cloud Professional', 'Microsoft Azure', 'Salesforce Administrator'],
    credibility: 95,
    recognition: ['Fortune 500 Companies', 'Government Agencies', 'Global Tech Industry'],
    validationProcess: 'Continuous industry review and updates based on technology evolution',
    examples: ['AWS', 'Google Cloud', 'Microsoft', 'Oracle', 'Salesforce', 'VMware']
  },
  {
    id: 'educational-institutions',
    name: 'University & Academic Partners',
    type: 'educational',
    description: 'Top-tier universities and coding bootcamps that provide curriculum-based assessments',
    certifications: ['Computer Science Fundamentals', 'Data Science Specialization', 'Full-Stack Web Development'],
    credibility: 90,
    recognition: ['Academic Community', 'Research Institutions', 'Corporate Training Programs'],
    validationProcess: 'Academic peer review and alignment with degree program standards',
    examples: ['MIT', 'Stanford', 'General Assembly', 'Lambda School', 'Coursera', 'edX']
  },
  {
    id: 'company-sponsored',
    name: 'Company-Sponsored Assessments',
    type: 'company_sponsor',
    description: 'Leading tech companies create assessments for skills they value and hire for',
    certifications: ['React Development (Meta)', 'Python Backend (Google)', 'UI/UX Design (Apple)', 'DevOps (Netflix)'],
    credibility: 88,
    recognition: ['Sponsoring Companies', 'Industry Consortiums', 'Tech Community'],
    validationProcess: 'Based on actual job requirements and performance data from existing employees',
    examples: ['Meta (React)', 'Google (Python/AI)', 'Apple (Design)', 'Netflix (DevOps)', 'Stripe (APIs)']
  },
  {
    id: 'hirevify-curated',
    name: 'HireVify Curated Assessments',
    type: 'hirevify_developed',
    description: 'Practical, project-based assessments developed by HireVify in collaboration with industry experts',
    certifications: ['Portfolio Development', 'Interview Skills', 'Soft Skills Assessment', 'Career Readiness'],
    credibility: 82,
    recognition: ['HireVify Partner Network', 'Startups & SMBs', 'Career Development Community'],
    validationProcess: 'Continuous feedback from hiring managers and successful candidates',
    examples: ['Communication Skills', 'Problem Solving', 'Team Collaboration', 'Adaptability']
  }
];

const assessmentProcess: AssessmentProcess[] = [
  {
    step: 1,
    title: 'Content Development',
    description: 'Expert teams create assessment content based on real job requirements',
    responsibleParty: 'Industry experts, educators, and hiring managers',
    timeframe: '3-6 months',
    validation: 'Peer review and pilot testing with professionals'
  },
  {
    step: 2,
    title: 'Technical Validation',
    description: 'Assessments are tested for accuracy, fairness, and relevance',
    responsibleParty: 'Psychometric experts and technical review boards',
    timeframe: '1-2 months',
    validation: 'Statistical analysis and bias detection'
  },
  {
    step: 3,
    title: 'Industry Review',
    description: 'Hiring managers and industry leaders validate real-world applicability',
    responsibleParty: 'Partner companies and industry associations',
    timeframe: '2-4 weeks',
    validation: 'Alignment with actual job performance'
  },
  {
    step: 4,
    title: 'Proctoring Setup',
    description: 'Secure, monitored assessment environment is configured',
    responsibleParty: 'HireVify platform and proctoring partners',
    timeframe: '1 week',
    validation: 'Security testing and identity verification'
  },
  {
    step: 5,
    title: 'Continuous Monitoring',
    description: 'Ongoing validation through candidate performance tracking',
    responsibleParty: 'HireVify analytics and partner feedback',
    timeframe: 'Ongoing',
    validation: 'Employment success rates and employer satisfaction'
  }
];

export function AssessmentEcosystem() {
  const [activeTab, setActiveTab] = useState('providers');

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'industry_partner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'educational': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'company_sponsor': return 'bg-green-100 text-green-800 border-green-200';
      case 'hirevify_developed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'industry_partner': return Shield;
      case 'educational': return BookOpen;
      case 'company_sponsor': return Building;
      case 'hirevify_developed': return Target;
      default: return Award;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Shield className="w-4 h-4 mr-2" />
          Trusted Assessment Network
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Who Creates & Validates Our Certifications?
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          HireVify partners with industry leaders, top universities, and established certification bodies 
          to provide credible, employer-trusted skills assessments.
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Assessment Providers</TabsTrigger>
          <TabsTrigger value="process">Validation Process</TabsTrigger>
          <TabsTrigger value="trust">Trust & Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessmentProviders.map((provider) => {
              const IconComponent = getProviderIcon(provider.type);
              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <Badge className={getProviderTypeColor(provider.type)}>
                            {provider.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{provider.credibility}%</div>
                        <div className="text-xs text-muted-foreground">Credibility</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{provider.description}</p>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Example Certifications</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.certifications.slice(0, 3).map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                        {provider.certifications.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.certifications.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Recognition</div>
                      <div className="space-y-1">
                        {provider.recognition.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Key Partners</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.examples.slice(0, 4).map((example, index) => (
                          <span key={index} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Stats */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">200+</div>
                  <div className="text-sm text-muted-foreground">Industry Partners</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">50+</div>
                  <div className="text-sm text-muted-foreground">Academic Institutions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Certified Assessments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">95%</div>
                  <div className="text-sm text-muted-foreground">Employer Trust Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <div className="space-y-6">
            {assessmentProcess.map((process, index) => (
              <Card key={process.step}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {process.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{process.title}</h3>
                      <p className="text-muted-foreground mb-4">{process.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground">Responsible Party</div>
                          <div>{process.responsibleParty}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Timeframe</div>
                          <div>{process.timeframe}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Validation</div>
                          <div>{process.validation}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quality Assurance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Verified className="w-5 h-5 mr-2 text-primary" />
                Ongoing Quality Assurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Continuous Validation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Monthly employer feedback collection
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Quarterly assessment performance review
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Annual industry standards alignment
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Real-time fraud detection and prevention
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Success Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Job Performance Correlation</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Employer Satisfaction</span>
                        <span className="font-medium">91%</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Candidate Success Rate</span>
                        <span className="font-medium">87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust" className="space-y-6">
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Security & Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Live proctoring with ID verification
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Browser lockdown and monitoring
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  AI-powered fraud detection
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Blockchain credential verification
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-green-600" />
                  Industry Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Fortune 500 company acceptance
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Government agency recognition
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  University credit transfer
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Professional association endorsement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                  Proven Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  25% average salary increase
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  85% job placement success
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  3x faster hiring process
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  95% employer satisfaction
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employer Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle>What Employers Say</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-sm italic mb-3">
                    "HireVify certifications give us confidence that candidates actually have the skills they claim. 
                    We've reduced our technical interview time by 60% while improving hire quality."
                  </p>
                  <div className="text-sm">
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-muted-foreground">VP Engineering, TechCorp</div>
                  </div>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm italic mb-3">
                    "The proctored assessments and industry partnerships make these certifications incredibly trustworthy. 
                    Our HR team now uses them as a primary screening tool."
                  </p>
                  <div className="text-sm">
                    <div className="font-semibold">Michael Rodriguez</div>
                    <div className="text-muted-foreground">Head of Talent, StartupXYZ</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Certified?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who have advanced their careers with industry-trusted certifications
              </p>
              <Button size="lg">
                <Award className="w-5 h-5 mr-2" />
                Start Your Certification Journey
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







