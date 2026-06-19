import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { useAuth } from '../components/AuthProvider';

export interface AppNotification {
  id: string;
  userId: string;
  type: string; // 'application' | 'assessment_completed' | 'profile_view' | 'system' | ...
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data,
    read: row.read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications((data || []).map(mapRow));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription: new notification inserted for this user
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications((prev) => [mapRow(payload.new), ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? mapRow(payload.new) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      )
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read (e.g. when the bell dropdown is opened)
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true, readAt: new Date().toISOString() }))
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
