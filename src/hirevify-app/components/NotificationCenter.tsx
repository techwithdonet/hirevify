import { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle2, X, MessageCircle, Users, Calendar, Award, Briefcase, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { cn } from './ui/utils';

// Local types to avoid API dependency issues
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  onBack: () => void;
  onUpdateUnreadCount: (count: number) => void;
  onOpenNotification?: (notification: Notification) => void;
}

export function NotificationCenter({ onBack, onUpdateUnreadCount, onOpenNotification }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock notifications immediately
  const generateMockNotifications = (): Notification[] => {
    if (!user) return [];

    const mockNotifications: Notification[] = user.userType === 'recruiter'? [
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
    ]: [
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
    
    // Load real notifications from Supabase only
    setNotifications([]);
    onUpdateUnreadCount(0);
    
    setIsLoading(false);
    
    // Optional: Try to load real data in the background
    loadNotificationsInBackground();
  }, [user, onUpdateUnreadCount]);

  const loadNotificationsInBackground = async () => {
    if (!user) return;
    
    try {
      // Try to import and use the real API
      const { CommunicationsAPI } = await import('../utils/api/communications');
      const data = await CommunicationsAPI.getNotifications();
      
      // Only update if we got valid data
      if (data && Array.isArray(data)) {
        setNotifications(data as any);
        const unreadCount = data.filter(n =>!n.read).length;
        onUpdateUnreadCount(unreadCount);
      }
    } catch (error) {
      // Silently fail - we already have mock data loaded
      console.error('Failed to load notifications from Supabase:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId? {...notif, read: true, readAt: new Date().toISOString() }: notif
      )
    );
    
    const newUnreadCount = notifications.filter(n =>!n.read && n.id!== notificationId).length;
    onUpdateUnreadCount(newUnreadCount);
    
    if (user) {
      try {
        // Try to update on server in background
        const { CommunicationsAPI } = await import('../utils/api/communications');
        await CommunicationsAPI.markNotificationAsRead(notificationId);
      } catch (error) {
        // Silently fail - UI is already updated
        console.log('Background mark as read failed:', error);
      }
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onOpenNotification?.(notification);
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n =>!n.read);
    
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(notif => ({...notif, read: true, readAt: new Date().toISOString() }))
    );
    
    onUpdateUnreadCount(0);
    toast.success('All notifications marked as read');
    
    if (user) {
      try {
        // Try to update on server in background
        const { CommunicationsAPI } = await import('../utils/api/communications');
        await Promise.all(
          unreadNotifications.map(notif => 
            CommunicationsAPI.markNotificationAsRead(notif.id)
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
        return 'bg-emerald-500';
      case 'interview_scheduled':
      case 'interview_reminder':
        return 'bg-purple-500';
      case 'interview_completed':
        return 'bg-indigo-500';
      case 'new_message':
        return 'bg-amber-500';
      case 'skill_assessment':
        return 'bg-orange-500';
      default:
        return 'bg-slate-500';
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

  const unreadCount = notifications.filter(n =>!n.read).length;

  if (isLoading) {
    return (
      <DashboardPageLayout
        title="Notifications"
        subtitle="Loading..."
        onBack={onBack}
        backLabel="Close"
        shellClassName="max-w-4xl"
      >
        <div className="premium-loading">
          <div className="premium-spinner" />
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Notifications"
      subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      onBack={onBack}
      backLabel="Close"
      shellClassName="max-w-4xl"
      actions={unreadCount > 0 && (
        <Button 
          variant="outline" 
          onClick={markAllAsRead} 
          className="premium-btn-secondary"
        >
          <Check className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
      )}
    >
      {notifications.length === 0 ? (
        <div className="premium-empty">
          <Bell className="premium-empty-icon" />
          <h3 className="premium-empty-title">No notifications yet</h3>
          <p className="premium-empty-description">
            You'll see notifications about applications, interviews, and messages here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "group cursor-pointer rounded-2xl border bg-white p-4 transition-all duration-200",
                !notification.read 
                  ? 'border-blue-200 bg-blue-50/30 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
                  getNotificationColor(notification.type)
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPageLayout>
  );
}
