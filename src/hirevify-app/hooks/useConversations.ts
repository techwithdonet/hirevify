import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { CommunicationsAPI, type Conversation } from '../utils/api/communications';

export function useConversations() {
  const { user } = useAuth();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve auth uid -> profiles.id once per session. Every FK on conversations
  // and messages is keyed off profiles.id, not the Supabase auth user id.
  useEffect(() => {
    if (!user) {
      setCurrentProfileId(null);
      return;
    }
    CommunicationsAPI.getCurrentProfileId()
      .then(setCurrentProfileId)
      .catch((error) => console.error('Failed to resolve current profile:', error));
  }, [user?.id]);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await CommunicationsAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentProfileId) return;
    reload();
  }, [currentProfileId, reload]);

  // Live updates: any conversation change involving this user, or any new
  // message anywhere, triggers a refetch so unread counts/ordering stay current
  // even for threads that aren't open right now.
  useEffect(() => {
    if (!currentProfileId) return;
    return CommunicationsAPI.subscribeToConversations(currentProfileId, reload);
  }, [currentProfileId, reload]);

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, isLoading, unreadCount, currentProfileId, reload };
}