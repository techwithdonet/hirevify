import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
 Bot,
 MessageCircle,
 Sparkles,
 X,
 ArrowRight,
 HelpCircle,
 Zap
} from 'lucide-react';

interface ChatbotIntroProps {
 userType: 'recruiter' | 'candidate' | null;
 onClose: () => void;
}

export function ChatbotIntro({ userType, onClose }: ChatbotIntroProps) {
 const [isVisible, setIsVisible] = useState(false);

 useEffect(() => {
 // Show introduction after a brief delay
 const timer = setTimeout(() => {
 setIsVisible(true);
 }, 2000);

 return () => clearTimeout(timer);
 }, []);

 const handleClose = () => {
 setIsVisible(false);
 setTimeout(onClose, 300);
 };

 if (!isVisible) return null;

 const features = userType === 'recruiter'? [
 { icon: Zap, text: 'Navigate to post projects, review candidates, and access analytics' },
 { icon: HelpCircle, text: 'Get explanations of match scores, assessments, and premium features' },
 { icon: Sparkles, text: 'Receive personalized recommendations for your hiring process' }
 ]: [
 { icon: Zap, text: 'Get help building your resume, portfolio, and taking assessments' },
 { icon: HelpCircle, text: 'Learn about match scores, application status, and platform features' },
 { icon: Sparkles, text: 'Receive tips for improving your profile and landing opportunities' }
 ];

 return (
 <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <Card className="w-full max-w-md border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
 <CardHeader className="text-center pb-4">
 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <Bot className="w-8 h-8 text-primary" />
 </div>
 <CardTitle className="text-xl font-bold text-foreground">
 Meet Your AI Assistant!...
 </CardTitle>
 <CardDescription className="text-muted-foreground">
 I'm here to help you navigate HireVify and make the most of every feature.
 </CardDescription>
 </CardHeader>
 
 <CardContent className="space-y-6">
 <div className="space-y-4">
 <h4 className="font-semibold text-foreground">I can help you:</h4>
 <div className="space-y-3">
 {features.map((feature, index) => (
 <div key={index} className="flex items-start space-x-3">
 <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
 <feature.icon className="w-3 h-3 text-primary" />
 </div>
 <p className="text-sm text-muted-foreground leading-relaxed">
 {feature.text}
 </p>
 </div>
 ))}
 </div>
 </div>

 <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
 <div className="flex items-center space-x-2 mb-2">
 <MessageCircle className="w-4 h-4 text-primary" />
 <span className="text-sm font-medium text-foreground">Look for the chat bubble</span>
 </div>
 <p className="text-xs text-muted-foreground">
 Click the floating chat button in the bottom-right corner anytime you need help!
 </p>
 </div>

 <div className="flex gap-3">
 <Button
 variant="outline"
 onClick={handleClose}
 className="flex-1 border-border text-foreground hover:bg-muted"
 >
 Got it!
 </Button>
 <Button
 onClick={handleClose}
 className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
 >
 <MessageCircle className="w-4 h-4 mr-2" />
 Try it now
 </Button>
 </div>
 </CardContent>
 
 <Button
 variant="ghost"
 size="sm"
 onClick={handleClose}
 className="absolute top-4 right-4 h-8 w-8 p-0"
 >
 <X className="w-4 h-4" />
 </Button>
 </Card>
 </div>
 );
}








