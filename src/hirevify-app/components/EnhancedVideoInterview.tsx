import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Square, Pause, RotateCcw, Video, VideoOff, Mic, MicOff, Monitor, User, Clock, Eye, Download, Share2, Settings, Camera, Volume2, VolumeX, Maximize, Minimize, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface VideoQuestion {
  id: string;
  question: string;
  description?: string;
  timeLimit: number; // in seconds
  preparationTime: number; // thinking time before recording
  isRequired: boolean;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface VideoRecording {
  id: string;
  questionId: string;
  blob: Blob;
  duration: number;
  recordedAt: string;
  retakeCount: number;
}

interface InterviewTemplate {
  id: string;
  title: string;
  description: string;
  questions: VideoQuestion[];
  timeLimit: number;
  allowRetakes: boolean;
  maxRetakes: number;
  showQuestionPreview: boolean;
  recordingQuality: 'low' | 'medium' | 'high';
}

interface EnhancedVideoInterviewProps {
  onBack: () => void;
  onComplete: (recordings: VideoRecording[]) => void;
  template?: InterviewTemplate;
  mode: 'candidate' | 'recruiter-preview' | 'recruiter-review';
  existingRecordings?: VideoRecording[];
  candidateName?: string;
  positionTitle?: string;
}

export function EnhancedVideoInterview({ 
  onBack, 
  onComplete, 
  template, 
  mode = 'candidate',
  existingRecordings = [],
  candidateName,
  positionTitle 
}: EnhancedVideoInterviewProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparationTime, setIsPreparationTime] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'instructions' | 'interview' | 'review' | 'complete'>('setup');
  
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(0);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  
  const [recordings, setRecordings] = useState<VideoRecording[]>(existingRecordings);
  const [currentRecordingChunks, setCurrentRecordingChunks] = useState<Blob[]>([]);
  
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(50);
  
  const [deviceSettings, setDeviceSettings] = useState({
    videoDevice: '',
    audioDevice: '',
    resolution: '720p',
    frameRate: 30
  });

  // Default template if none provided
  const defaultTemplate: InterviewTemplate = {
    id: 'default',
    title: 'Standard Video Interview',
    description: 'A comprehensive video interview to assess communication skills and cultural fit',
    questions: [
      {
        id: 'q1',
        question: 'Tell us about yourself and your professional background.',
        description: 'Provide a 2-3 minute overview of your experience, skills, and what drives you professionally.',
        timeLimit: 180,
        preparationTime: 30,
        isRequired: true,
        category: 'Background',
        difficulty: 'easy'
      },
      {
        id: 'q2',
        question: 'Describe a challenging project you worked on and how you overcame obstacles.',
        description: 'Focus on your problem-solving approach, teamwork, and the final outcome.',
        timeLimit: 300,
        preparationTime: 60,
        isRequired: true,
        category: 'Experience',
        difficulty: 'medium'
      },
      {
        id: 'q3',
        question: 'Where do you see yourself in 5 years, and how does this role fit into your career goals?',
        description: 'Discuss your career aspirations and how this position aligns with your growth plans.',
        timeLimit: 240,
        preparationTime: 45,
        isRequired: true,
        category: 'Goals',
        difficulty: 'medium'
      },
      {
        id: 'q4',
        question: 'Describe a time when you had to learn a new technology or skill quickly.',
        description: 'Highlight your learning abilities and adaptability in a professional context.',
        timeLimit: 240,
        preparationTime: 45,
        isRequired: false,
        category: 'Learning',
        difficulty: 'medium'
      }
    ],
    timeLimit: 1800, // 30 minutes total
    allowRetakes: true,
    maxRetakes: 2,
    showQuestionPreview: true,
    recordingQuality: 'high'
  };

  const interviewTemplate = template || defaultTemplate;
  const currentQuestion = interviewTemplate.questions[currentQuestionIndex];

  useEffect(() => {
    if (currentPhase === 'setup') {
      initializeCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentPhase]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPreparationTime && preparationTimeLeft > 0) {
      interval = setInterval(() => {
        setPreparationTimeLeft(prev => {
          if (prev <= 1) {
            setIsPreparationTime(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isRecording && recordingTimeLeft > 0) {
      interval = setInterval(() => {
        setRecordingTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
        setTotalElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPreparationTime, isRecording, preparationTimeLeft, recordingTimeLeft]);

  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          width: deviceSettings.resolution === '1080p' ? 1920 : deviceSettings.resolution === '720p' ? 1280 : 640,
          height: deviceSettings.resolution === '1080p' ? 1080 : deviceSettings.resolution === '720p' ? 720 : 480,
          frameRate: deviceSettings.frameRate,
          deviceId: deviceSettings.videoDevice || undefined
        },
        audio: {
          deviceId: deviceSettings.audioDevice || undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast.success('Camera and microphone access granted');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera or microphone. Please check your permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startPreparation = () => {
    setIsPreparationTime(true);
    setPreparationTimeLeft(currentQuestion.preparationTime);
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      toast.error('Camera not available');
      return;
    }

    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: interviewTemplate.recordingQuality === 'high' ? 2500000 : 
                           interviewTemplate.recordingQuality === 'medium' ? 1500000 : 800000
      };

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      setCurrentRecordingChunks([]);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setCurrentRecordingChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        saveRecording();
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTimeLeft(currentQuestion.timeLimit);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast.info('Recording resumed');
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast.info('Recording paused');
      }
    }
  };

  const saveRecording = () => {
    if (currentRecordingChunks.length === 0) return;

    const blob = new Blob(currentRecordingChunks, { type: 'video/webm' });
    const recording: VideoRecording = {
      id: `recording_${currentQuestion.id}_${Date.now()}`,
      questionId: currentQuestion.id,
      blob,
      duration: currentQuestion.timeLimit - recordingTimeLeft,
      recordedAt: new Date().toISOString(),
      retakeCount: recordings.filter(r => r.questionId === currentQuestion.id).length
    };

    // Replace existing recording for this question or add new one
    const updatedRecordings = recordings.filter(r => r.questionId !== currentQuestion.id);
    setRecordings([...updatedRecordings, recording]);
    
    setCurrentRecordingChunks([]);
    toast.success('Recording saved successfully');
  };

  const retakeRecording = () => {
    const existingRecording = recordings.find(r => r.questionId === currentQuestion.id);
    const retakeCount = existingRecording ? existingRecording.retakeCount + 1 : 1;
    
    if (retakeCount > interviewTemplate.maxRetakes) {
      toast.error(`Maximum retakes (${interviewTemplate.maxRetakes}) reached for this question`);
      return;
    }
    
    setRecordingTimeLeft(currentQuestion.timeLimit);
    startRecording();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < interviewTemplate.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordingTimeLeft(0);
      setPreparationTimeLeft(0);
    } else {
      setCurrentPhase('review');
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setRecordingTimeLeft(0);
      setPreparationTimeLeft(0);
    }
  };

  const completeInterview = () => {
    const requiredQuestions = interviewTemplate.questions.filter(q => q.isRequired);
    const recordedRequiredQuestions = requiredQuestions.filter(q => 
      recordings.some(r => r.questionId === q.id)
    );

    if (recordedRequiredQuestions.length < requiredQuestions.length) {
      toast.error('Please complete all required questions before submitting');
      return;
    }

    onComplete(recordings);
    setCurrentPhase('complete');
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderSetup = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            Interview Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Camera Preview</Label>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  <Button variant="outline" size="sm" onClick={toggleCamera}>
                    {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleMicrophone}>
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Recording Quality</Label>
                <Select 
                  value={deviceSettings.resolution} 
                  onValueChange={(value) => setDeviceSettings(prev => ({ ...prev, resolution: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p (Standard)</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Audio Level Test</Label>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${volume}%` }} />
                  </div>
                  <span className="text-sm">{volume}%</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">System Check</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    {cameraEnabled ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                    Camera {cameraEnabled ? 'Ready' : 'Disabled'}
                  </div>
                  <div className="flex items-center text-sm">
                    {micEnabled ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                    Microphone {micEnabled ? 'Ready' : 'Disabled'}
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Network Connection Stable
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setCurrentPhase('instructions')} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Continue to Instructions
            </Button>
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInstructions = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Interview Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{interviewTemplate.questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(interviewTemplate.timeLimit / 60)}min</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{interviewTemplate.maxRetakes}</div>
              <div className="text-sm text-muted-foreground">Retakes Allowed</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>You'll see each question with preparation time to think</li>
              <li>When ready, start recording your response</li>
              <li>You can pause, resume, or retake each question if needed</li>
              <li>Review all your answers before final submission</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Tips for success:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Speak clearly and maintain eye contact with the camera</li>
              <li>Use specific examples and quantify your achievements</li>
              <li>Keep your answers concise and within the time limit</li>
              <li>Ensure good lighting and minimal background noise</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setCurrentPhase('interview')} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Start Interview
            </Button>
            <Button variant="outline" onClick={() => setCurrentPhase('setup')}>
              Back to Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInterview = () => (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Badge>Question {currentQuestionIndex + 1} of {interviewTemplate.questions.length}</Badge>
              <Badge variant="outline" className={
                currentQuestion.difficulty === 'easy' ? 'text-green-600' :
                currentQuestion.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }>
                {currentQuestion.difficulty}
              </Badge>
              {currentQuestion.isRequired && <Badge variant="outline">Required</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTime(totalElapsedTime)} elapsed
            </div>
          </div>
          <Progress 
            value={(currentQuestionIndex + 1) / interviewTemplate.questions.length * 100} 
            className="h-2" 
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isPreparationTime ? 'Preparation Time' : isRecording ? 'Recording' : 'Question'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">{currentQuestion.question}</h3>
              {currentQuestion.description && (
                <p className="text-muted-foreground text-sm">{currentQuestion.description}</p>
              )}
            </div>

            {isPreparationTime && (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatTime(preparationTimeLeft)}
                </div>
                <p className="text-sm text-muted-foreground">Time to prepare your answer</p>
                <Button 
                  onClick={() => {
                    setIsPreparationTime(false);
                    setPreparationTimeLeft(0);
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Skip Preparation
                </Button>
              </div>
            )}

            {!isPreparationTime && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recording Time:</span>
                  <span className="text-lg font-bold">
                    {formatTime(isRecording ? recordingTimeLeft : currentQuestion.timeLimit)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!isRecording ? (
                    <>
                      <Button onClick={startRecording} className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                      <Button variant="outline" onClick={startPreparation}>
                        <Clock className="w-4 h-4 mr-2" />
                        Prepare
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={pauseRecording} variant="outline">
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                      <Button onClick={stopRecording} variant="destructive">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>

                {recordings.find(r => r.questionId === currentQuestion.id) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Response recorded successfully
                    </div>
                    {interviewTemplate.allowRetakes && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={retakeRecording}
                        className="mt-2"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Video Preview</span>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleCamera}>
                  {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleMicrophone}>
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-80 bg-black rounded-lg object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">REC</span>
                  </div>
                </div>
              )}

              {isRecording && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Progress 
                    value={(1 - recordingTimeLeft / currentQuestion.timeLimit) * 100} 
                    className="h-2 bg-black/50" 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {recordings.length} of {interviewTemplate.questions.filter(q => q.isRequired).length} required completed
              </div>
              
              <Button 
                onClick={nextQuestion}
                disabled={currentQuestion.isRequired && !recordings.find(r => r.questionId === currentQuestion.id)}
              >
                {currentQuestionIndex === interviewTemplate.questions.length - 1 ? 'Review' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interviewTemplate.questions.map((question, index) => {
              const recording = recordings.find(r => r.questionId === question.id);
              return (
                <div key={question.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{question.question}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {recording ? (
                      <>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                        <span className="text-sm">{formatTime(recording.duration)}</span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        {question.isRequired ? 'Required' : 'Skipped'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={completeInterview} className="flex-1">
              Submit Interview
            </Button>
            <Button variant="outline" onClick={() => setCurrentPhase('interview')}>
              Back to Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <Card>
        <CardContent className="py-12">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Interview Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for completing the video interview. Your responses have been submitted and will be reviewed by our team.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{recordings.length}</div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(recordings.reduce((sum, r) => sum + r.duration, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Recording Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{formatTime(totalElapsedTime)}</div>
              <div className="text-sm text-muted-foreground">Total Interview Time</div>
            </div>
          </div>
          <Button onClick={onBack} className="mt-6">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {mode === 'recruiter-review' ? `${candidateName}'s Interview` : 'Video Interview'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'recruiter-review' ? positionTitle : interviewTemplate.title}
              </p>
            </div>
          </div>
          
          {currentPhase === 'interview' && (
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {formatTime(totalElapsedTime)} / {formatTime(interviewTemplate.timeLimit)}
              </Badge>
              <Badge className={isRecording ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                {isRecording ? 'Recording' : 'Ready'}
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {currentPhase === 'setup' && renderSetup()}
        {currentPhase === 'instructions' && renderInstructions()}
        {currentPhase === 'interview' && renderInterview()}
        {currentPhase === 'review' && renderReview()}
        {currentPhase === 'complete' && renderComplete()}
      </main>
    </div>
  );
}







