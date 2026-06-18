import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
 ArrowLeft,
 Play,
 Pause,
 Square,
 RotateCcw,
 Camera,
 Mic,
 MicOff,
 VideoOff,
 Clock,
 CheckCircle,
 AlertCircle,
 Upload,
 Download,
 Settings,
 Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface Question {
 id: string;
 question: string;
 preparationTime: number; // seconds
 responseTime: number; // seconds
 instructions?: string;
}

interface OneWayVideoInterviewProps {
 onBack: () => void;
 onComplete: () => void;
}

export function OneWayVideoInterview({ onBack, onComplete }: OneWayVideoInterviewProps) {
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
 const [interviewState, setInterviewState] = useState<'instructions' | 'preparation' | 'recording' | 'review' | 'completed'>('instructions');
 const [isRecording, setIsRecording] = useState(false);
 const [isPaused, setIsPaused] = useState(false);
 const [timeRemaining, setTimeRemaining] = useState(0);
 const [recordedResponses, setRecordedResponses] = useState<string[]>([]);
 const [cameraEnabled, setCameraEnabled] = useState(false);
 const [micEnabled, setMicEnabled] = useState(false);
 const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
 const [permissionError, setPermissionError] = useState<string | null>(null);
 const [isSetupLoading, setIsSetupLoading] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);
 const timerRef = useRef<NodeJS.Timeout | null>(null);

 const questions: Question[] = [
 {
 id: '1',
 question: 'Tell us about yourself and why you\'re interested in this position.',
 preparationTime: 30,
 responseTime: 120,
 instructions: 'Please provide a brief overview of your background, experience, and what motivates you about this role.'
 },
 {
 id: '2',
 question: 'Describe a challenging project you worked on and how you overcame obstacles.',
 preparationTime: 45,
 responseTime: 180,
 instructions: 'Focus on your problem-solving process, the actions you took, and the final outcome.'
 },
 {
 id: '3',
 question: 'How do you stay current with technology trends in your field?',
 preparationTime: 30,
 responseTime: 120,
 instructions: 'Share specific resources, practices, or methodologies you use to keep your skills updated.'
 },
 {
 id: '4',
 question: 'Where do you see yourself in your career five years from now?',
 preparationTime: 30,
 responseTime: 120,
 instructions: 'Discuss your career goals and how this position aligns with your long-term objectives.'
 }
 ];

 const currentQuestion = questions[currentQuestionIndex];
 const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

 useEffect(() => {
 if (timeRemaining > 0) {
 timerRef.current = setTimeout(() => {
 setTimeRemaining(prev => prev - 1);
 }, 1000);
 } else if (timeRemaining === 0 && interviewState === 'preparation') {
 handleStartRecording();
 } else if (timeRemaining === 0 && interviewState === 'recording') {
 handleStopRecording();
 }

 return () => {
 if (timerRef.current) {
 clearTimeout(timerRef.current);
 }
 };
 }, [timeRemaining, interviewState]);

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

 // Check if getUserMedia is supported
 if (!navigator.mediaDevices ||!navigator.mediaDevices.getUserMedia) {
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
 setCameraEnabled(true);
 setMicEnabled(true);
 
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 }

 toast.success('Camera and microphone access granted');
 } catch (error) {
 console.error('Error accessing media:', error);
 
 let errorMessage = 'Failed to access camera and microphone';
 
 if (error instanceof Error) {
 switch (error.name) {
 case 'NotAllowedError':
 errorMessage = 'Camera and microphone access denied. Please allow permissions and try again.';
 setPermissionError('Camera and microphone access was denied. Please:\n1. Click the camera icon in your browser\'s address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again');
 break;
 case 'NotFoundError':
 errorMessage = 'No camera or microphone found. Please connect a camera and microphone.';
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
 
 setCameraEnabled(false);
 setMicEnabled(false);
 toast.error(errorMessage);
 } finally {
 setIsSetupLoading(false);
 }
 };

 const formatTime = (seconds: number) => {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 const handleStartPreparation = () => {
 setInterviewState('preparation');
 setTimeRemaining(currentQuestion.preparationTime);
 };

 const handleStartRecording = () => {
 setInterviewState('recording');
 setIsRecording(true);
 setTimeRemaining(currentQuestion.responseTime);
 };

 const handleStopRecording = () => {
 setIsRecording(false);
 setInterviewState('review');
 // Simulate saving the response
 setRecordedResponses(prev => [...prev, `Response ${currentQuestionIndex + 1}`]);
 };

 const handleNextQuestion = () => {
 if (currentQuestionIndex < questions.length - 1) {
 setCurrentQuestionIndex(prev => prev + 1);
 setInterviewState('preparation');
 setTimeRemaining(questions[currentQuestionIndex + 1].preparationTime);
 } else {
 setInterviewState('completed');
 }
 };

 const handleRetakeResponse = () => {
 setInterviewState('preparation');
 setTimeRemaining(currentQuestion.preparationTime);
 };

 const renderInstructions = () => (
 <div className="max-w-4xl mx-auto p-6 space-y-8">
 <Card className="border border-border">
 <CardHeader>
 <CardTitle className="flex items-center">
 <Camera className="w-6 h-6 mr-3 text-primary" />
 One-Way Video Interview Instructions
 </CardTitle>
 <CardDescription>
 Please read these instructions carefully before starting your interview
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-4">
 <div className="flex items-start space-x-3">
 <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
 <span className="text-sm font-medium text-primary">1</span>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">Technical Requirements</h4>
 <p className="text-muted-foreground">
 Ensure you have a stable internet connection, working camera, and microphone. 
 Test your audio and video before starting.
 </p>
 </div>
 </div>

 <div className="flex items-start space-x-3">
 <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
 <span className="text-sm font-medium text-primary">2</span>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">Interview Format</h4>
 <p className="text-muted-foreground">
 You'll answer {questions.length} questions. Each question has a preparation time followed by recording time. 
 You can retake responses if needed.
 </p>
 </div>
 </div>

 <div className="flex items-start space-x-3">
 <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
 <span className="text-sm font-medium text-primary">3</span>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">Best Practices</h4>
 <p className="text-muted-foreground">
 Find a quiet, well-lit space. Look directly at the camera and speak clearly. 
 Take your time to think during preparation periods.
 </p>
 </div>
 </div>

 <div className="flex items-start space-x-3">
 <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
 <span className="text-sm font-medium text-primary">4</span>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">Privacy & Recording</h4>
 <p className="text-muted-foreground">
 Your responses will be recorded and reviewed by the hiring team. 
 Recordings are stored securely and used only for hiring purposes.
 </p>
 </div>
 </div>
 </div>

 {/* Permission Error */}
 {permissionError && (
 <Alert className="border-error-200 bg-error-50 mb-6">
 <AlertCircle className="h-4 w-4 text-error-600" />
 <AlertDescription className="text-error-800">
 <div className="space-y-2">
 <p className="font-medium">Media Access Required</p>
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

 {/* Camera/Mic Test */}
 <div className="border border-border rounded-lg p-6 bg-muted/30">
 <h4 className="font-semibold text-foreground mb-4">Audio & Video Setup</h4>
 
 {!mediaStream? (
 <div className="text-center mb-4">
 <p className="text-muted-foreground mb-4">
 Click the button below to enable your camera and microphone for the interview.
 </p>
 <Button
 onClick={requestMediaAccess}
 disabled={isSetupLoading}
 className="bg-primary hover:bg-primary-hover text-primary-foreground"
 >
 {isSetupLoading? (
 <>
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
 Requesting Access...
 </>
 ): (
 <>
 <Camera className="w-4 h-4 mr-2" />
 Enable Camera & Microphone
 </>
 )}
 </Button>
 </div>
 ): (
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center space-x-4">
 <div className="flex items-center space-x-2">
 <Camera className="w-4 h-4 text-success" />
 <span className="text-success text-sm font-medium">Camera Ready</span>
 </div>
 <div className="flex items-center space-x-2">
 <Mic className="w-4 h-4 text-success" />
 <span className="text-success text-sm font-medium">Microphone Ready</span>
 </div>
 </div>
 </div>
 )}
 
 <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative">
 <video
 ref={videoRef}
 className="w-full h-full object-cover rounded-lg"
 autoPlay
 muted
 playsInline
 />
 {!mediaStream && (
 <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
 <VideoOff className="w-12 h-12 mb-2 opacity-50" />
 <p className="text-sm opacity-75">Camera access required</p>
 </div>
 )}
 </div>
 </div>

 <div className="flex gap-4">
 <Button
 variant="outline"
 onClick={onBack}
 className="flex-1 border-border text-foreground hover:bg-muted"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Dashboard
 </Button>
 <Button
 onClick={handleStartPreparation}
 disabled={!mediaStream}
 className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
 >
 <Play className="w-4 h-4 mr-2" />
 Start Interview
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );

 const renderInterview = () => (
 <div className="max-w-6xl mx-auto p-6">
 {/* Progress Header */}
 <Card className="border border-border mb-6">
 <CardContent className="p-6">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h2 className="text-xl font-bold text-foreground">
 Question {currentQuestionIndex + 1} of {questions.length}
 </h2>
 <p className="text-muted-foreground">
 {interviewState === 'preparation' && 'Preparation Time'}
 {interviewState === 'recording' && 'Recording Time'}
 {interviewState === 'review' && 'Review Your Response'}
 </p>
 </div>
 <div className="flex items-center space-x-4">
 {(interviewState === 'preparation' || interviewState === 'recording') && (
 <div className="flex items-center space-x-2">
 <Clock className="w-5 h-5 text-primary" />
 <span className="text-2xl font-mono font-bold text-foreground">
 {formatTime(timeRemaining)}
 </span>
 </div>
 )}
 <div className="text-right">
 <p className="text-sm text-muted-foreground">Progress</p>
 <p className="font-semibold text-foreground">{Math.round(progressPercentage)}%</p>
 </div>
 </div>
 </div>
 <Progress value={progressPercentage} className="h-2" />
 </CardContent>
 </Card>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Question Panel */}
 <Card className="border border-border">
 <CardHeader>
 <CardTitle>Interview Question</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
 <p className="text-lg font-medium text-foreground leading-relaxed">
 {currentQuestion.question}
 </p>
 </div>

 {currentQuestion.instructions && (
 <div className="p-4 bg-muted/30 rounded-lg">
 <h4 className="font-semibold text-foreground mb-2">Guidelines:</h4>
 <p className="text-muted-foreground leading-relaxed">
 {currentQuestion.instructions}
 </p>
 </div>
 )}

 <div className="grid grid-cols-2 gap-4 text-sm">
 <div className="p-3 bg-muted/30 rounded-lg">
 <p className="text-muted-foreground">Preparation Time</p>
 <p className="font-semibold text-foreground">{formatTime(currentQuestion.preparationTime)}</p>
 </div>
 <div className="p-3 bg-muted/30 rounded-lg">
 <p className="text-muted-foreground">Response Time</p>
 <p className="font-semibold text-foreground">{formatTime(currentQuestion.responseTime)}</p>
 </div>
 </div>

 {interviewState === 'preparation' && (
 <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
 <div className="flex items-center space-x-2">
 <AlertCircle className="w-5 h-5 text-yellow-600" />
 <p className="font-medium text-yellow-800">Preparation Phase</p>
 </div>
 <p className="text-yellow-700 mt-1">
 Use this time to think about your response. Recording will start automatically.
 </p>
 </div>
 )}

 {interviewState === 'recording' && (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
 <div className="flex items-center space-x-2">
 <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
 <p className="font-medium text-red-800">Recording in Progress</p>
 </div>
 <p className="text-red-700 mt-1">
 Speak clearly and look at the camera. You can stop early if finished.
 </p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Video Panel */}
 <Card className="border border-border">
 <CardHeader>
 <CardTitle className="flex items-center justify-between">
 <span>Video Recording</span>
 <div className="flex items-center space-x-2">
 {interviewState === 'recording' && (
 <Badge className="bg-red-100 text-red-800 border-red-200">
 <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
 Recording
 </Badge>
 )}
 </div>
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="relative">
 <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
 <video
 ref={videoRef}
 className="w-full h-full object-cover rounded-lg"
 autoPlay
 muted
 playsInline
 />
 {!mediaStream && (
 <div className="absolute flex flex-col items-center justify-center text-white">
 <VideoOff className="w-12 h-12 mb-2 opacity-50" />
 <p className="opacity-75">Camera access required</p>
 </div>
 )}
 </div>

 {/* Recording Controls */}
 <div className="mt-4 flex items-center justify-center space-x-4">
 {interviewState === 'recording' && (
 <Button
 onClick={handleStopRecording}
 className="bg-red-500 hover:bg-red-600 text-white"
 >
 <Square className="w-4 h-4 mr-2" />
 Stop Recording
 </Button>
 )}

 {interviewState === 'review' && (
 <div className="flex space-x-2">
 <Button
 variant="outline"
 onClick={handleRetakeResponse}
 className="border-border text-foreground hover:bg-muted"
 >
 <RotateCcw className="w-4 h-4 mr-2" />
 Retake
 </Button>
 <Button
 onClick={handleNextQuestion}
 className="bg-primary hover:bg-primary-hover text-primary-foreground"
 >
 {currentQuestionIndex < questions.length - 1? 'Next Question': 'Complete Interview'}
 <CheckCircle className="w-4 h-4 ml-2" />
 </Button>
 </div>
 )}
 </div>
 </div>

 {/* Audio Level Indicator */}
 {/* Audio Level Indicator */}
 <div className="mt-4 flex items-center space-x-3">
 <Volume2 className="w-4 h-4 text-muted-foreground" />
 <div className="flex-1 bg-muted rounded-full h-2">
 <div 
 className="bg-primary h-2 rounded-full transition-all duration-150"
 style={{ width: mediaStream? '60%': '0%' }}
 />
 </div>
 <span className="text-sm text-muted-foreground">Audio Level</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );

 const renderCompletion = () => (
 <div className="max-w-4xl mx-auto p-6">
 <Card className="border border-border">
 <CardContent className="p-8 text-center">
 <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
 <CheckCircle className="w-8 h-8 text-success" />
 </div>
 
 <h2 className="text-3xl font-bold text-foreground mb-4">
 Interview Completed Successfully!
 </h2>
 
 <p className="text-muted-foreground mb-8 leading-relaxed">
 Thank you for completing the video interview. Your responses have been recorded and 
 will be reviewed by our hiring team. We'll be in touch soon with next steps.
 </p>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="p-4 bg-muted/30 rounded-lg">
 <p className="text-2xl font-bold text-foreground">{questions.length}</p>
 <p className="text-sm text-muted-foreground">Questions Answered</p>
 </div>
 <div className="p-4 bg-muted/30 rounded-lg">
 <p className="text-2xl font-bold text-foreground">
 {questions.reduce((sum, q) => sum + q.responseTime, 0) / 60}m
 </p>
 <p className="text-sm text-muted-foreground">Total Recording Time</p>
 </div>
 <div className="p-4 bg-muted/30 rounded-lg">
 <p className="text-2xl font-bold text-foreground">100%</p>
 <p className="text-sm text-muted-foreground">Completion Rate</p>
 </div>
 </div>

 <div className="flex gap-4 justify-center">
 <Button
 variant="outline"
 className="border-border text-foreground hover:bg-muted"
 >
 <Download className="w-4 h-4 mr-2" />
 Download Summary
 </Button>
 <Button
 onClick={onComplete}
 className="bg-primary hover:bg-primary-hover text-primary-foreground"
 >
 Return to Dashboard
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );

 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <header className="bg-card border-b border-border p-6">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 {interviewState === 'instructions' && (
 <Button variant="ghost" onClick={onBack} className="hover:bg-muted">
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Dashboard
 </Button>
 )}
 <div className="flex items-center space-x-3">
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-16" />
 </div>
 </div>
 
 {interviewState!== 'instructions' && interviewState!== 'completed' && (
 <div className="flex items-center space-x-4">
 <Button variant="outline" className="border-border text-foreground hover:bg-muted">
 <Settings className="w-4 h-4 mr-2" />
 Settings
 </Button>
 </div>
 )}
 </div>
 </div>
 </header>

 {/* Content */}
 {interviewState === 'instructions' && renderInstructions()}
 {(interviewState === 'preparation' || interviewState === 'recording' || interviewState === 'review') && renderInterview()}
 {interviewState === 'completed' && renderCompletion()}
 </div>
 );
}







