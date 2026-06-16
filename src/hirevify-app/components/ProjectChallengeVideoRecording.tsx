import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  ArrowLeft,
  ArrowRight,
  FileVideo,
  MessageSquare,
  Target,
  Code,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { FilesAPI, VideoSubmissionData } from '../utils/api/files';
import { useAuth } from './AuthProvider';

interface ProjectChallengeVideoRecordingProps {
  onBack: () => void;
  onComplete: (videoData: VideoSubmission) => void;
  projectTitle: string;
  projectId: string;
  challengeDescription?: string;
}

interface VideoSubmission {
  projectId: string;
  videoBlob: Blob;
  responses: QuestionResponse[];
  duration: number;
  timestamp: number;
}

interface QuestionResponse {
  questionId: string;
  question: string;
  recordingStartTime: number;
  recordingEndTime: number;
  answered: boolean;
}

const GUIDED_QUESTIONS = [
  {
    id: 'overview',
    title: 'Project Overview',
    icon: <Target className="w-5 h-5" />,
    question: 'Please provide a brief overview of the project challenge and your final solution.',
    timeLimit: 180, // 3 minutes
    prompts: [
      'What was the main objective of the project?',
      'What was your final deliverable?',
      'How does your solution address the requirements?'
    ]
  },
  {
    id: 'approach',
    title: 'Technical Approach',
    icon: <Code className="w-5 h-5" />,
    question: 'Explain your technical approach and why you chose this particular method.',
    timeLimit: 240, // 4 minutes
    prompts: [
      'What technologies or tools did you use?',
      'Why did you choose this approach over alternatives?',
      'What was your development process?'
    ]
  },
  {
    id: 'challenges',
    title: 'Challenges & Solutions',
    icon: <AlertTriangle className="w-5 h-5" />,
    question: 'Describe the main challenges you faced and how you overcame them.',
    timeLimit: 240, // 4 minutes
    prompts: [
      'What were the biggest technical obstacles?',
      'How did you research and solve problems?',
      'What would you do differently next time?'
    ]
  },
  {
    id: 'implementation',
    title: 'Step-by-Step Implementation',
    icon: <Lightbulb className="w-5 h-5" />,
    question: 'Walk through your implementation process step by step.',
    timeLimit: 300, // 5 minutes
    prompts: [
      'What was your first step and why?',
      'How did you structure your work?',
      'Can you show key parts of your code/solution?'
    ]
  },
  {
    id: 'testing',
    title: 'Testing & Validation',
    icon: <CheckCircle className="w-5 h-5" />,
    question: 'Explain how you tested your solution and ensured it works correctly.',
    timeLimit: 180, // 3 minutes
    prompts: [
      'How did you test your solution?',
      'What edge cases did you consider?',
      'How did you validate the requirements were met?'
    ]
  }
];

export function ProjectChallengeVideoRecording({ 
  onBack, 
  onComplete, 
  projectTitle, 
  projectId,
  challengeDescription 
}: ProjectChallengeVideoRecordingProps) {
  const { getAccessToken } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex];
  const totalQuestions = GUIDED_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Initialize media devices
  useEffect(() => {
    checkMediaDevices();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const checkMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setHasCamera(devices.some(device => device.kind === 'videoinput'));
      setHasMicrophone(devices.some(device => device.kind === 'audioinput'));
    } catch (error) {
      console.error('Error checking media devices:', error);
      setPermissionError('Unable to access media devices');
    }
  };

  const startMediaAccess = async () => {
    try {
      setIsLoading(true);
      setPermissionError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

      // Request permission with proper constraints
      const constraints = {
        video: hasCamera ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: hasMicrophone ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        console.warn('VP9 codec not supported, falling back to default');
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      setMediaRecorder(recorder);
      toast.success('Camera and microphone ready');
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
          case 'OverconstrainedError':
            errorMessage = 'Camera settings not supported. Trying with basic settings.';
            setPermissionError('Camera configuration not supported. Please try again with basic settings.');
            break;
          case 'SecurityError':
            errorMessage = 'Security error. Please ensure you\'re using HTTPS.';
            setPermissionError('Security error accessing media devices. Please ensure you\'re using a secure connection.');
            break;
          default:
            setPermissionError(`Media access error: ${error.message}`);
        }
      } else {
        setPermissionError('Unknown error accessing media devices. Please check your browser permissions.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    if (!mediaRecorder || !mediaStream) {
      toast.error('Please setup camera and microphone first');
      return;
    }

    mediaRecorder.start(1000); // Record in 1-second chunks
    setIsRecording(true);
    setIsPaused(false);
    setQuestionStartTime(Date.now());
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    toast.success(`Recording ${currentQuestion.title}`);
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording) {
      if (isPaused) {
        mediaRecorder.resume();
        setIsPaused(false);
        toast.success('Recording resumed');
      } else {
        mediaRecorder.pause();
        setIsPaused(true);
        toast.success('Recording paused');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Record the response
      const response: QuestionResponse = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        recordingStartTime: questionStartTime,
        recordingEndTime: Date.now(),
        answered: true
      };

      setResponses(prev => [...prev, response]);
      toast.success('Question recorded successfully');
    }
  };

  const resetRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setRecordedBlob(null);
    chunksRef.current = [];
    
    toast.success('Recording reset');
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setRecordingTime(0);
      setRecordedBlob(null);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setRecordingTime(0);
      setRecordedBlob(null);
    }
  };

  const handleSubmit = async () => {
    if (responses.length !== totalQuestions) {
      toast.error('Please record answers to all questions before submitting');
      return;
    }

    if (!recordedBlob) {
      toast.error('No video recording found');
      return;
    }

    try {
      setIsLoading(true);
      
      const submissionData: VideoSubmissionData = {
        projectId,
        videoBlob: recordedBlob,
        responses,
        duration: responses.reduce((total, response) => 
          total + (response.recordingEndTime - response.recordingStartTime), 0),
        timestamp: Date.now()
      };

      // Get access token for API call
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      // Submit to backend API
      const result = await FilesAPI.submitProjectChallengeVideo(submissionData, accessToken);
      
      console.log('Video submission successful:', result);
      
      // Call the onComplete callback with the submission data
      await onComplete(submissionData);
      
      toast.success('Video explanation submitted successfully!');
    } catch (error) {
      console.error('Error submitting video:', error);
      toast.error(`Failed to submit video explanation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    const response = responses.find(r => r.questionId === GUIDED_QUESTIONS[index].id);
    if (response?.answered) return 'completed';
    if (index === currentQuestionIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Project</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Challenge Video Explanation</h1>
              <p className="text-muted-foreground mt-1">{projectTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              <FileVideo className="w-4 h-4 mr-2" />
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Badge>
            <Badge variant={mediaStream ? "default" : "secondary"} className="px-3 py-1">
              {mediaStream ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ready to Record
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Setup Required
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions Sidebar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Recording Steps</h3>
            {GUIDED_QUESTIONS.map((question, index) => {
              const status = getQuestionStatus(index);
              return (
                <Card 
                  key={question.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    status === 'current' ? 'ring-2 ring-primary border-primary' :
                    status === 'completed' ? 'bg-success-50 border-success-200' :
                    'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      status === 'completed' ? 'bg-success-500 text-white' :
                      status === 'current' ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {question.icon}
                        <h4 className="font-medium text-sm">{question.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {question.question}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Max {Math.floor(question.timeLimit / 60)} min</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Main Recording Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Permission Error */}
            {permissionError && (
              <Alert className="border-error-200 bg-error-50">
                <AlertCircle className="h-4 w-4 text-error-600" />
                <AlertDescription className="text-error-800">
                  <div className="space-y-2">
                    <p className="font-medium">Media Access Required</p>
                    <div className="text-sm whitespace-pre-line">{permissionError}</div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button 
                        onClick={startMediaAccess}
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

            {/* Current Question */}
            <Card className="p-6">
              <div className="flex items-start space-x-3 mb-6">
                {currentQuestion.icon}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{currentQuestion.title}</h2>
                  <p className="text-muted-foreground mb-4">{currentQuestion.question}</p>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Talking Points to Cover:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {currentQuestion.prompts.map((prompt, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-primary mt-1">ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Video Recording Interface */}
              <div className="space-y-6">
                {/* Video Preview */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>REC {formatTime(recordingTime)}</span>
                      {isPaused && <span className="text-yellow-200">(Paused)</span>}
                    </div>
                  )}

                  {/* Time Limit Warning */}
                  {recordingTime > currentQuestion.timeLimit * 0.8 && isRecording && (
                    <div className="absolute top-4 right-4 bg-warning-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1 inline" />
                      {formatTime(currentQuestion.timeLimit - recordingTime)} left
                    </div>
                  )}

                  {/* Setup Required Overlay */}
                  {!mediaStream && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center text-white max-w-md mx-auto px-6">
                        <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Camera & Microphone Setup</p>
                        <p className="text-sm opacity-75 mb-6">
                          This feature requires access to your camera and microphone to record your project explanation.
                          Your recordings are private and only shared with the hiring team.
                        </p>
                        
                        {/* Browser Instructions */}
                        <div className="bg-black/40 rounded-lg p-4 mb-6 text-left">
                          <p className="text-xs font-medium mb-2 text-center">Browser Permission Steps:</p>
                          <ol className="text-xs space-y-1 opacity-75">
                            <li>1. Click "Allow" when prompted</li>
                            <li>2. If blocked, click the camera icon in address bar</li>
                            <li>3. Select "Allow" for camera and microphone</li>
                            <li>4. Refresh page if needed</li>
                          </ol>
                        </div>
                        
                        <Button 
                          onClick={startMediaAccess} 
                          disabled={isLoading} 
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Requesting Access...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Enable Camera & Microphone
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recording Controls */}
                {mediaStream && (
                  <div className="flex items-center justify-center space-x-4">
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording}
                        size="lg"
                        className="bg-red-500 hover:bg-red-600 text-white px-8"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Button 
                          onClick={pauseRecording}
                          variant="outline"
                          size="lg"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={stopRecording}
                          size="lg"
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop & Save
                        </Button>
                        <Button 
                          onClick={resetRecording}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Reset
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Device Status */}
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    {hasCamera ? (
                      <Video className="w-4 h-4 text-success-500" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-error-500" />
                    )}
                    <span>Camera {hasCamera ? 'Available' : 'Not Found'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasMicrophone ? (
                      <Mic className="w-4 h-4 text-success-500" />
                    ) : (
                      <MicOff className="w-4 h-4 text-error-500" />
                    )}
                    <span>Microphone {hasMicrophone ? 'Available' : 'Not Found'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Question</span>
              </Button>

              <div className="flex items-center space-x-3">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button 
                    onClick={nextQuestion}
                    disabled={!responses.find(r => r.questionId === currentQuestion.id)?.answered}
                    className="flex items-center space-x-2"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={responses.length !== totalQuestions || isLoading}
                    size="lg"
                    className="bg-success-500 hover:bg-success-600 text-white flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Submit Video Explanation</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-2">Important Instructions</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ Record your answers in a quiet environment with good lighting</li>
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ Speak clearly and explain your thought process step by step</li>
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ Show relevant code, diagrams, or documentation when explaining</li>
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ Be honest about challenges and how you researched solutions</li>
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ Each question has a recommended time limit - use it effectively</li>
                <li>ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â‚¬Å¡Ã‚¬Ãƒâ€šÃ‚¢ You can pause, re-record, or move between questions before final submission</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}








