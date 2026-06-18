import { ArrowLeft, Video, Calendar, Users, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface InterviewManagementProps {
 onBack: () => void;
 onStartInterview?: () => void;
 onJoinInterview?: () => void;
 onTakeVideoInterview?: () => void;
 onEnhancedVideoInterview?: () => void;
 userType: 'recruiter' | 'candidate';
}

export function InterviewManagement({ 
 onBack, 
 onStartInterview, 
 onJoinInterview, 
 onTakeVideoInterview, 
 onEnhancedVideoInterview, 
 userType 
}: InterviewManagementProps) {
 return (
 <div className="min-h-screen bg-background">
 <div className="max-w-7xl mx-auto px-6 py-8">
 <div className="flex items-center gap-4 mb-6">
 <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
 <ArrowLeft className="w-4 h-4" />
 Back to Dashboard
 </Button>
 <h1 className="text-3xl font-bold">Interview Management</h1>
 </div>
 
 <div className="grid gap-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Video className="w-5 h-5" />
 {userType === 'recruiter'? 'Manage Interviews': 'Your Interviews'}
 </CardTitle>
 <CardDescription>
 {userType === 'recruiter'? 'Schedule and conduct interviews with candidates': 'View and join your scheduled interviews'
 }
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-12">
 <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
 <Calendar className="w-8 h-8 text-muted-foreground" />
 </div>
 <h3 className="text-lg font-semibold mb-2">
 {userType === 'recruiter'? 'No interviews scheduled': 'No upcoming interviews'}
 </h3>
 <p className="text-muted-foreground mb-6">
 {userType === 'recruiter'? 'Start conducting interviews to evaluate candidates': 'Check back here for your interview schedule'
 }
 </p>
 
 <div className="flex gap-4 justify-center flex-wrap">
 {userType === 'recruiter'? (
 <>
 <Button 
 onClick={onStartInterview}
 className="flex items-center gap-2"
 >
 <Play className="w-4 h-4" />
 Start Live Interview
 </Button>
 <Button 
 variant="outline"
 onClick={onEnhancedVideoInterview}
 className="flex items-center gap-2"
 >
 <Video className="w-4 h-4" />
 Enhanced Video Interview
 </Button>
 </>
 ): (
 <>
 <Button 
 onClick={onJoinInterview}
 className="flex items-center gap-2"
 >
 <Users className="w-4 h-4" />
 Join Live Interview
 </Button>
 <Button 
 variant="outline"
 onClick={onTakeVideoInterview}
 className="flex items-center gap-2"
 >
 <Video className="w-4 h-4" />
 Record Video Interview
 </Button>
 <Button 
 variant="secondary"
 onClick={onEnhancedVideoInterview}
 className="flex items-center gap-2"
 >
 <Video className="w-4 h-4" />
 Enhanced Video Interview
 <Badge variant="secondary" className="ml-2">New</Badge>
 </Button>
 </>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}







