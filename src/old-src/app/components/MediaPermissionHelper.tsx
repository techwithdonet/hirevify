import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Camera, 
  Mic, 
  AlertCircle, 
  CheckCircle, 
  VideoOff, 
  MicOff,
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MediaPermissionHelperProps {
  onMediaGranted: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  videoRequired?: boolean;
  audioRequired?: boolean;
  autoRequest?: boolean;
  className?: string;
}

interface MediaDeviceInfo {
  hasCamera: boolean;
  hasMicrophone: boolean;
  deviceCount: {
    video: number;
    audio: number;
  };
}

export function MediaPermissionHelper({
  onMediaGranted,
  onError,
  videoRequired = true,
  audioRequired = true,
  autoRequest = false,
  className = ""
}: MediaPermissionHelperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<MediaDeviceInfo | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    checkDeviceAvailability();
    if (autoRequest) {
      requestPermissions();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkDeviceAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Media devices not supported in this browser');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');

      setDeviceInfo({
        hasCamera: videoDevices.length > 0,
        hasMicrophone: audioDevices.length > 0,
        deviceCount: {
          video: videoDevices.length,
          audio: audioDevices.length
        }
      });
    } catch (error) {
      console.error('Error checking device availability:', error);
      setErrorMessage('Unable to detect media devices. Please check your browser permissions.');
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setPermissionState('pending');

      // Check HTTPS requirement
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera and microphone access requires a secure connection (HTTPS). Please contact the site administrator to enable HTTPS.');
      }

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Check device availability
      if (!deviceInfo) {
        await checkDeviceAvailability();
      }

      if (videoRequired && deviceInfo && !deviceInfo.hasCamera) {
        throw new Error('No camera detected. Please connect a camera to continue.');
      }

      if (audioRequired && deviceInfo && !deviceInfo.hasMicrophone) {
        throw new Error('No microphone detected. Please connect a microphone to continue.');
      }

      // Request media permissions
      const constraints: MediaStreamConstraints = {
        video: videoRequired ? {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } : false,
        audio: audioRequired ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 }
        } : false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      setPermissionState('granted');
      onMediaGranted(mediaStream);
      
      toast.success('Camera and microphone access granted');
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      
      let userFriendlyMessage = 'Failed to access camera and microphone';
      let technicalDetails = '';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            userFriendlyMessage = 'Camera and microphone access denied';
            technicalDetails = 'Please allow camera and microphone access in your browser:\n\n1. Click the camera icon in your browser\'s address bar\n2. Select "Allow" for both camera and microphone\n3. Refresh the page if needed\n\nIf the icon isn\'t visible, check your browser settings under Privacy & Security > Site Settings > Camera/Microphone.';
            setPermissionState('denied');
            break;
            
          case 'NotFoundError':
            userFriendlyMessage = 'Camera or microphone not found';
            technicalDetails = 'Please ensure your camera and microphone are:\n\n1. Properly connected to your computer\n2. Not being used by another application\n3. Recognized by your operating system\n\nTry disconnecting and reconnecting your devices, then refresh this page.';
            setPermissionState('error');
            break;
            
          case 'NotReadableError':
            userFriendlyMessage = 'Camera or microphone is busy';
            technicalDetails = 'Your camera or microphone is currently being used by another application.\n\nPlease:\n1. Close other video conferencing apps (Zoom, Teams, etc.)\n2. Close other browser tabs using camera/microphone\n3. Restart your browser if necessary\n4. Try again';
            setPermissionState('error');
            break;
            
          case 'OverconstrainedError':
            userFriendlyMessage = 'Camera settings not supported';
            technicalDetails = 'Your camera doesn\'t support the required video quality settings.\n\nThis might happen with older cameras. The app will try to use basic settings instead.';
            
            // Retry with basic constraints
            try {
              const basicConstraints = {
                video: videoRequired ? true : false,
                audio: audioRequired ? true : false
              };
              const basicStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
              setStream(basicStream);
              setPermissionState('granted');
              onMediaGranted(basicStream);
              toast.success('Camera and microphone access granted (basic quality)');
              return;
            } catch (retryError) {
              technicalDetails += '\n\nUnfortunately, even basic camera settings failed. Please try with a different camera or browser.';
            }
            setPermissionState('error');
            break;
            
          case 'SecurityError':
            userFriendlyMessage = 'Security error accessing media devices';
            technicalDetails = 'This usually happens when:\n\n1. The page is not served over HTTPS\n2. The browser blocks media access due to security policies\n3. Permissions have been permanently denied\n\nTry:\n1. Refreshing the page\n2. Clearing browser data for this site\n3. Using a different browser\n4. Ensuring the site URL starts with "https://"';
            setPermissionState('error');
            break;
            
          case 'TypeError':
            userFriendlyMessage = 'Browser compatibility issue';
            technicalDetails = 'Your browser doesn\'t support the required media features.\n\nPlease update your browser or try:\n• Chrome (recommended)\n• Firefox\n• Safari\n• Edge\n\nOlder browsers and some mobile browsers may not work properly.';
            setPermissionState('error');
            break;
            
          default:
            userFriendlyMessage = error.message;
            technicalDetails = `Technical error: ${error.name}\n\nPlease try:\n1. Refreshing the page\n2. Restarting your browser\n3. Checking your camera and microphone connections\n4. Using a different browser\n\nIf the problem persists, contact support with this error code: ${error.name}`;
            setPermissionState('error');
        }
      } else {
        technicalDetails = 'An unknown error occurred while accessing media devices. Please refresh the page and try again.';
        setPermissionState('error');
      }
      
      setErrorMessage(technicalDetails);
      onError?.(userFriendlyMessage);
      toast.error(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openBrowserSettings = () => {
    // Open browser-specific settings help
    const userAgent = navigator.userAgent.toLowerCase();
    let helpUrl = 'https://support.google.com/chrome/answer/2693767'; // Default to Chrome
    
    if (userAgent.includes('firefox')) {
      helpUrl = 'https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions';
    } else if (userAgent.includes('safari')) {
      helpUrl = 'https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac';
    } else if (userAgent.includes('edge')) {
      helpUrl = 'https://support.microsoft.com/en-us/windows/windows-camera-microphone-and-privacy-a83257bc-e990-d54a-d212-b5e41beba857';
    }
    
    window.open(helpUrl, '_blank');
  };

  const getStatusIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'denied':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />;
      default:
        return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (permissionState) {
      case 'granted':
        return 'Media access granted';
      case 'denied':
        return 'Permission denied';
      case 'error':
        return 'Setup error';
      default:
        return 'Media access required';
    }
  };

  if (permissionState === 'granted') {
    return (
      <div className={`flex items-center space-x-2 text-success text-sm ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span>Camera and microphone ready</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Display */}
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>

      {/* Device Information */}
      {deviceInfo && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            {deviceInfo.hasCamera ? (
              <Camera className="w-4 h-4 text-success" />
            ) : (
              <VideoOff className="w-4 h-4 text-error" />
            )}
            <span className={deviceInfo.hasCamera ? 'text-success' : 'text-error'}>
              Camera {deviceInfo.hasCamera ? `(${deviceInfo.deviceCount.video})` : 'Not Found'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {deviceInfo.hasMicrophone ? (
              <Mic className="w-4 h-4 text-success" />
            ) : (
              <MicOff className="w-4 h-4 text-error" />
            )}
            <span className={deviceInfo.hasMicrophone ? 'text-success' : 'text-error'}>
              Microphone {deviceInfo.hasMicrophone ? `(${deviceInfo.deviceCount.audio})` : 'Not Found'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <Alert className="border-error-200 bg-error-50">
          <AlertCircle className="h-4 w-4 text-error-600" />
          <AlertDescription className="text-error-800">
            <div className="space-y-3">
              <p className="font-medium">Media Access Issue</p>
              <div className="text-sm whitespace-pre-line">{errorMessage}</div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={requestPermissions}
                  size="sm"
                  className="bg-error-500 hover:bg-error-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
                <Button 
                  onClick={openBrowserSettings}
                  variant="outline"
                  size="sm"
                  className="border-error-300 text-error-700 hover:bg-error-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browser Help
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Button */}
      {permissionState === 'pending' && (
        <div className="text-center">
          <Button 
            onClick={requestPermissions}
            disabled={isLoading}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
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
          
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            Your privacy is important. We only access your camera and microphone for video recording. 
            No data is stored locally or shared without your consent.
          </p>
        </div>
      )}
    </div>
  );
}

// Utility hook for easier use in components
export function useMediaPermissions() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMediaGranted = (mediaStream: MediaStream) => {
    setStream(mediaStream);
    setHasPermission(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setHasPermission(false);
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setHasPermission(false);
    setError(null);
  };

  return {
    stream,
    hasPermission,
    error,
    handleMediaGranted,
    handleError,
    cleanup
  };
}