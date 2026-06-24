'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Video, VideoOff, Circle, Square, RotateCcw, Check, Play, Pause } from 'lucide-react';
import { cn } from './ui/utils';

interface VideoRecorderProps {
  onSave: (videoBlob: Blob | null, videoUrl: string | null, comment: string) => void;
  initialVideoUrl?: string | null;
  initialComment?: string;
  disabled?: boolean;
}

const MAX_RECORDING_TIME = 5 * 60; // 5 minutes in seconds

export function VideoRecorder({ onSave, initialVideoUrl, initialComment = '', disabled }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(initialVideoUrl || null);
  const [comment, setComment] = useState(initialComment);
  const [timeRemaining, setTimeRemaining] = useState(MAX_RECORDING_TIME);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState(0); // Force re-render when stream changes
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl && !recordedUrl.startsWith('blob:')) {
        // Don't revoke URLs that came from the server
      } else if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  // Handle video playback when recording starts
  useEffect(() => {
    if (isRecording && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isRecording, streamKey]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      
      // Store stream for useEffect
      streamRef.current = stream;
      
      // Force re-render to trigger useEffect
      setStreamKey(prev => prev + 1);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setShowPreview(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setTimeRemaining(MAX_RECORDING_TIME);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError('Camera/microphone access denied. Please allow access and try again.');
      console.error('Error accessing media devices:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetRecording = () => {
    if (recordedUrl && !recordedUrl.startsWith('blob:')) {
      // Server URL - don't revoke
    } else if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setComment('');
    setShowPreview(false);
    setTimeRemaining(MAX_RECORDING_TIME);
  };

  const handleSave = () => {
    if (recordedBlob) {
      onSave(recordedBlob, recordedUrl, comment);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Preview mode after recording
  if (showPreview && recordedUrl) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg mx-auto" style={{ aspectRatio: '16/9', maxWidth: '500px' }}>
          <video 
            ref={videoRef}
            src={recordedUrl} 
            controls 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div>
          <Label className="premium-label mb-2 block">Add a comment about this video</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="E.g., This video explains my experience with React and Node.js..."
            className="premium-textarea"
            rows={2}
          />
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={resetRecording} 
            variant="outline" 
            className="premium-btn-secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Record Again
          </Button>
          <Button 
            onClick={handleSave} 
            className="premium-btn-accent"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Video
          </Button>
        </div>
      </div>
    );
  }

  // Recording mode
  if (isRecording) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg mx-auto" style={{ aspectRatio: '1/1', maxWidth: '400px' }}>
          <video 
            key={streamKey}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Recording indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
            <span className={cn("w-2.5 h-2.5 rounded-full", isPaused ? "bg-yellow-400" : "bg-white animate-pulse")} />
            {isPaused ? 'PAUSED' : 'REC'}
          </div>
          
          {/* Timer */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-lg shadow-lg">
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {isPaused ? (
            <Button onClick={resumeRecording} className="premium-btn-accent">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button onClick={pauseRecording} variant="outline" className="premium-btn-secondary">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={stopRecording} variant="destructive" className="bg-red-600 hover:bg-red-700">
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Maximum recording time: 5 minutes. Recording will auto-stop when time expires.
        </p>
      </div>
    );
  }

  // Initial state - show record button
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {recordedUrl && !showPreview ? (
        // Already has saved video
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <video 
              src={recordedUrl}
              controls 
              className="w-full max-h-[200px] object-contain bg-black"
            />
          </div>
          
          {comment && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium text-slate-700">Comment:</span> {comment}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={resetRecording} 
              variant="outline" 
              className="premium-btn-secondary"
              disabled={disabled}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Record New
            </Button>
          </div>
        </div>
      ) : (
        // No video yet
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Record Introduction Video</h3>
          <p className="text-sm text-slate-500 mb-4">
            Record a short video (up to 5 minutes) to introduce yourself to recruiters.
            Show your personality and communication skills.
          </p>
          <Button 
            onClick={startRecording} 
            className="premium-btn-accent"
            disabled={disabled}
          >
            <Circle className="w-4 h-4 mr-2 fill-current" />
            Start Recording
          </Button>
          <p className="text-xs text-slate-400 mt-3">
            Requires camera and microphone access
          </p>
        </div>
      )}
    </div>
  );
}
