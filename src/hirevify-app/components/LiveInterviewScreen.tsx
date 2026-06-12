import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare, 
  FileText,
  Circle,
  Briefcase,
  AlertCircle,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface LiveInterviewScreenProps {
  onEndInterview: () => void;
}

export function LiveInterviewScreen({ onEndInterview }: LiveInterviewScreenProps) {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [chatMessages] = useState([
    { sender: 'System', message: 'Interview session has started', time: '2:00 PM' },
    { sender: 'Recruiter', message: 'Welcome! Can you hear me clearly?', time: '2:01 PM' },
    { sender: 'Candidate', message: 'Yes, perfectly. Thank you!', time: '2:01 PM' },
  ]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMediaAccess = async () => {
    try {
      setIsSetupLoading(true);
      setPermissionError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setMediaStream(stream);
      setIsVideoOn(true);
      setIsAudioOn(true);

      toast.success('Camera and microphone ready for interview');
    } catch (error) {
      console.error('Error accessing media:', error);
      
      let errorMessage = 'Failed to access camera and microphone';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera and microphone access denied. Please allow permissions to join the interview.';
            setPermissionError('Camera and microphone access was denied. Please:\n1. Click the camera icon in your browser\'s address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again');
            break;
          case 'NotFoundError':
            errorMessage = 'No camera or microphone found. Please connect your devices.';
            setPermissionError('No camera or microphone detected. Please ensure your devices are connected and try again.');
            break;
          case 'NotReadableError':
            errorMessage = 'Camera or microphone is already in use by another application.';
            setPermissionError('Your camera or microphone is being used by another application. Please close other video apps and try again.');
            break;
          default:
            setPermissionError(`Media access error: ${error.message}`);
        }
      } else {
        setPermissionError('Unknown error accessing media devices. Please check your browser permissions.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSetupLoading(false);
    }
  };

  const toggleVideo = () => {
    if (!mediaStream) {
      requestMediaAccess();
      return;
    }
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    if (!mediaStream) {
      requestMediaAccess();
      return;
    }
    setIsAudioOn(!isAudioOn);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Recording Banner */}
      <header className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-16" />
            </div>
            
            {/* Recording Indicator */}
            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
              <Circle className="w-2 h-2 mr-2 fill-current animate-pulse" />
              This session is being recorded
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Interview Area */}
      <main className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col">
            {/* Permission Error */}
            {permissionError && (
              <Alert className="border-error-200 bg-error-50 mb-4">
                <AlertCircle className="h-4 w-4 text-error-600" />
                <AlertDescription className="text-error-800">
                  <div className="space-y-2">
                    <p className="font-medium">Media Access Required for Interview</p>
                    <div className="text-sm whitespace-pre-line">{permissionError}</div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button 
                        onClick={requestMediaAccess}
                        size="sm"
                        className="bg-error-500 hover:bg-error-600 text-white"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => setPermissionError(null)}
                        variant="outline"
                        size="sm"
                        className="border-error-300 text-error-700 hover:bg-error-50"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Main Video Feed */}
            <Card className="flex-1 border border-border">
              <CardContent className="p-0 h-full">
                <div className="h-full bg-gray-900 rounded-lg relative overflow-hidden">
                  {/* Video Feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {!mediaStream ? (
                      <div className="text-center text-white max-w-md mx-auto px-6">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg opacity-75 mb-2">Camera Setup Required</p>
                        <p className="text-sm opacity-50 mb-6">Enable your camera and microphone to join the interview</p>
                        <Button 
                          onClick={requestMediaAccess} 
                          disabled={isSetupLoading}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          {isSetupLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Setting up...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Enable Camera & Microphone
                            </>
                          )}
                        </Button>
                      </div>
                    ) : isVideoOn ? (
                      <div className="text-center text-white">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="opacity-75">Video Feed Active</p>
                        <p className="text-sm opacity-50 mt-2">Senior Frontend Developer Interview</p>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="opacity-75">Video Off</p>
                      </div>
                    )}
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center space-x-4 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAudio}
                        className={`rounded-full p-3 ${isAudioOn && mediaStream ? 'text-white hover:bg-white/20' : 'text-red-400 bg-red-500/20'}`}
                      >
                        {isAudioOn && mediaStream ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleVideo}
                        className={`rounded-full p-3 ${isVideoOn && mediaStream ? 'text-white hover:bg-white/20' : 'text-red-400 bg-red-500/20'}`}
                      >
                        {isVideoOn && mediaStream ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={onEndInterview}
                        className="rounded-full p-3 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 border-l border-border bg-card/50">
          <Card className="h-full border border-border">
            <CardHeader className="pb-3">
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('notes')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </Button>
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col h-full">
              {activeTab === 'notes' ? (
                <div className="flex-1 flex flex-col">
                  <label className="text-foreground mb-3">Interview Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes during the interview..."
                    className="flex-1 resize-none bg-input-background border-border text-foreground min-h-[400px]"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground text-sm">{msg.sender}</span>
                          <span className="text-muted-foreground text-xs">{msg.time}</span>
                        </div>
                        <div className="bg-muted p-2 rounded text-sm text-foreground">
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3">
                    <Textarea
                      placeholder="Type a message..."
                      className="resize-none bg-input-background border-border text-foreground"
                      rows={2}
                    />
                    <Button size="sm" className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Send Message
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}







