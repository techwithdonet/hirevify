import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Video, Shield, Clock, Briefcase } from 'lucide-react';

interface CandidateJoinPageProps {
  onJoinInterview: () => void;
  interviewLink: string;
}

export function CandidateJoinPage({ onJoinInterview, interviewLink }: CandidateJoinPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl text-foreground">HireVify</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Welcome Section */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl text-foreground">Welcome to your interview</h1>
            <p className="text-muted-foreground">
              You're about to join a secure video interview. Please ensure you have a good internet connection and your camera is working.
            </p>
          </div>

          {/* Join Button */}
          <Card className="border border-border">
            <CardContent className="pt-6">
              <Button 
                onClick={onJoinInterview}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg"
              >
                <Video className="w-6 h-6 mr-3" />
                Join Interview
              </Button>
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-center space-x-3 p-4 bg-card border border-border rounded-lg">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-foreground">Secure & Recorded</p>
                <p className="text-muted-foreground text-sm">This session will be securely recorded for evaluation purposes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-card border border-border rounded-lg">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-foreground">Estimated Duration</p>
                <p className="text-muted-foreground text-sm">Allow 30-60 minutes for the complete interview process</p>
              </div>
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="text-left">
            <h3 className="text-foreground mb-3">Before you start:</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>• Ensure your camera and microphone are working</li>
              <li>• Find a quiet, well-lit location</li>
              <li>• Use a stable internet connection</li>
              <li>• Have a copy of your resume available</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}