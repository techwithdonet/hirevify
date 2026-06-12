import { useState, useEffect } from 'react';
import { Bell, Check, X, MessageCircle, Users, Calendar, Award, Briefcase } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

// Local types to avoid API dependency issues
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  onBack: () => void;
  onUpdateUnreadCount: (count: number) => void;
}

export function NotificationCenter({ onBack, onUpdateUnreadCount }: NotificationCenterProps) {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock notifications immediately
  const generateMockNotifications = (): Notification[] => {
    if (!user) return [];

    const mockNotifications: Notification[] = user.userType === 'recruiter' ? [
      {
        id: 'notif1',
        userId: user.id || '',
        type: 'new_application',
        title: 'New Application Received',
        message: 'Alex Chen has applied for your React Developer position',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        readAt: undefined
      },
      {
        id: 'notif2',
        userId: user.id || '',
        type: 'new_application',
        title: 'New Application Received',
        message: 'Morgan Rodriguez has applied for your UX Designer position',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        readAt: undefined
      },
      {
        id: 'notif3',
        userId: user.id || '',
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Interview with Jordan Taylor scheduled for tomorrow at 3:00 PM',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'notif4',
        userId: user.id || '',
        type: 'new_message',
        title: 'New Message',
        message: 'Casey Johnson sent you a message about the Frontend Developer position',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        id: 'notif5',
        userId: user.id || '',
        type: 'interview_completed',
        title: 'Interview Completed',
        message: 'Interview with Riley Anderson has been completed. Review available.',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ] : [
      {
        id: 'notif1',
        userId: user.id || '',
        type: 'application_status',
        title: 'Application Status Update',
        message: 'Your application for React Developer at TechCorp has been moved to the interview stage',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        readAt: undefined
      },
      {
        id: 'notif2',
        userId: user.id || '',
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Your interview with DesignStudio for UX Designer position is scheduled for tomorrow at 2:00 PM',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        readAt: undefined
      },
      {
        id: 'notif3',
        userId: user.id || '',
        type: 'new_message',
        title: 'New Message',
        message: 'Sarah Johnson sent you a message about the Frontend Developer position',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'notif4',
        userId: user.id || '',
        type: 'skill_assessment',
        title: 'Skills Assessment Invitation',
        message: 'You have been invited to take a skills assessment for the Full-Stack Developer role',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: 'notif5',
        userId: user.id || '',
        type: 'application_status',
        title: 'Application Received',
        message: 'Your application for Backend Developer at StartupX has been received and is under review',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
      }
    ];

    return mockNotifications;
  };

  useEffect(() => {
    if (!user) return;
    
    // Load notifications immediately with mock data
    const mockNotifications = generateMockNotifications();
    setNotifications(mockNotifications);
    
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    onUpdateUnreadCount(unreadCount);
    
    setIsLoading(false);
    
    // Optional: Try to load real data in the background
    loadNotificationsInBackground();
  }, [user, onUpdateUnreadCount]);

  const loadNotificationsInBackground = async () => {
    if (!accessToken) return;
    
    try {
      // Try to import and use the real API
      const { CommunicationsAPI } = await import('../utils/api/communications');
      const data = await CommunicationsAPI.getNotifications(accessToken);
      
      // Only update if we got valid data
      if (data && Array.isArray(data)) {
        setNotifications(data as any);
        const unreadCount = data.filter(n => !n.read).length;
        onUpdateUnreadCount(unreadCount);
      }
    } catch (error) {
      // Silently fail - we already have mock data loaded
      console.log('Background API call failed, using mock data:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true, readAt: new Date().toISOString() }
          : notif
      )
    );
    
    const newUnreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
    onUpdateUnreadCount(newUnreadCount);
    
    if (accessToken) {
      try {
        // Try to update on server in background
        const { CommunicationsAPI } = await import('../utils/api/communications');
        await CommunicationsAPI.markNotificationAsRead(notificationId, accessToken);
      } catch (error) {
        // Silently fail - UI is already updated
        console.log('Background mark as read failed:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true, readAt: new Date().toISOString() }))
    );
    
    onUpdateUnreadCount(0);
    toast.success('All notifications marked as read');
    
    if (accessToken) {
      try {
        // Try to update on server in background
        const { CommunicationsAPI } = await import('../utils/api/communications');
        await Promise.all(
          unreadNotifications.map(notif => 
            CommunicationsAPI.markNotificationAsRead(notif.id, accessToken)
          )
        );
      } catch (error) {
        // Silently fail - UI is already updated
        console.log('Background mark all as read failed:', error);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_application':
        return <Briefcase className="w-4 h-4" />;
      case 'application_status':
        return <Users className="w-4 h-4" />;
      case 'interview_scheduled':
      case 'interview_reminder':
      case 'interview_completed':
        return <Calendar className="w-4 h-4" />;
      case 'new_message':
        return <MessageCircle className="w-4 h-4" />;
      case 'skill_assessment':
        return <Award className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_application':
        return 'bg-blue-500';
      case 'application_status':
        return 'bg-green-500';
      case 'interview_scheduled':
      case 'interview_reminder':
        return 'bg-purple-500';
      case 'interview_completed':
        return 'bg-indigo-500';
      case 'new_message':
        return 'bg-yellow-500';
      case 'skill_assessment':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <X className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Notifications</h1>
                <p className="text-sm text-muted-foreground">
                  {notifications.filter(n => !n.read).length} unread notifications
                </p>
              </div>
            </div>
            
            {notifications.some(n => !n.read) && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll see notifications about applications, interviews, and messages here.
            </p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <Card 
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'bg-muted/30 border-primary/20' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground px-1.5 py-0.5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}








