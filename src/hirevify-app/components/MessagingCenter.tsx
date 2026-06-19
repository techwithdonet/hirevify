import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Briefcase, Circle, MessageCircle, Search, Send, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { CommunicationsAPI, type Conversation, type Message } from '../utils/api/communications';
import { dashboardTheme } from '../theme/dashboardTheme';

interface MessagingCenterProps {
  onBack: () => void;
  onUpdateUnreadCount: (count: number) => void;
  selectedConversationId?: string | null;
}

export function MessagingCenter({ onBack, onUpdateUnreadCount, selectedConversationId }: MessagingCenterProps) {
  const { user } = useAuth();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) =>
      conversation.otherUser.name.toLowerCase().includes(term) ||
      conversation.otherUser.email.toLowerCase().includes(term) ||
      (conversation.lastMessage?.message.toLowerCase().includes(term) ?? false)
    );
  }, [conversations, searchTerm]);

  // Resolve the auth user to a profiles.id once — every conversation/message
  // FK and "is this mine" check downstream depends on this, not the auth uid.
  useEffect(() => {
    if (!user) return;
    CommunicationsAPI.getCurrentProfileId()
      .then(setCurrentProfileId)
      .catch((error) => console.error('Failed to resolve current profile:', error));
  }, [user?.id]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await CommunicationsAPI.getConversations();
      setConversations(data);
      onUpdateUnreadCount(data.reduce((sum, conversation) => sum + conversation.unreadCount, 0));
      setSelectedConversation((current) => {
        const selected = selectedConversationId
          ? data.find((conversation) => conversation.id === selectedConversationId)
          : null;
        const stillExists = current ? data.find((conversation) => conversation.id === current.id) : null;

        return selected || stillExists || data[0] || null;
      });
    } catch (error) {
      console.error('Failed to load real conversations:', error);
      setConversations([]);
      onUpdateUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user?.id]);

  // Live updates: refresh the inbox whenever any of the user's conversations
  // change or a new message lands anywhere, so unread counts/ordering stay current
  // even for threads that aren't currently open.
  useEffect(() => {
    if (!currentProfileId) return;
    const unsubscribe = CommunicationsAPI.subscribeToConversations(currentProfileId, () => {
      loadConversations();
    });
    return unsubscribe;
  }, [currentProfileId]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadThread = async () => {
      try {
        setIsThreadLoading(true);
        const data = await CommunicationsAPI.getMessages(selectedConversation.id);
        setMessages(data);
        await CommunicationsAPI.markConversationAsRead(selectedConversation.id);
        setConversations((current) =>
          current.map((c) => (c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c)),
        );
      } catch (error) {
        console.error('Failed to load real message thread:', error);
        setMessages([]);
      } finally {
        setIsThreadLoading(false);
      }
    };

    loadThread();
  }, [selectedConversation?.id]);

  // Live updates within the open thread: append messages from the other party
  // as they arrive. Messages we send ourselves are already appended optimistically
  // in sendMessage, so skip those here to avoid duplicates.
  useEffect(() => {
    if (!selectedConversation || !currentProfileId) return;

    const unsubscribe = CommunicationsAPI.subscribeToMessages(selectedConversation.id, (message) => {
      if (message.senderId === currentProfileId) return;

      setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
      CommunicationsAPI.markConversationAsRead(selectedConversation.id).catch(() => {});
    });

    return unsubscribe;
  }, [selectedConversation?.id, currentProfileId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setIsSending(true);

    try {
      const sentMessage = await CommunicationsAPI.sendMessage({
        recipientId: selectedConversation.otherUser.id,
        message: messageText,
        conversationId: selectedConversation.id,
      });

      setMessages((current) => [...current, sentMessage]);
      setNewMessage('');
      await loadConversations();
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send real message:', error);
      toast.error(error instanceof Error ? error.message : 'Message was not sent.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getInitial = (name?: string) => (name || 'User').slice(0, 1).toUpperCase();

  return (
    <div className={dashboardTheme.page}>
      <header className={dashboardTheme.pageHeader}>
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Messages</p>
              <h1 className="text-2xl font-semibold text-slate-950">HireVify Inbox</h1>
            </div>
          </div>
          <Badge className="border border-blue-200 bg-blue-50 text-blue-700">Real conversations only</Badge>
        </div>
      </header>

      <main className="mx-auto grid h-[calc(100vh-105px)] max-w-[1500px] grid-cols-1 overflow-hidden border-x border-slate-200 bg-white lg:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search messages"
                className="rounded-full bg-slate-50 pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-6 text-sm text-slate-500">Loading real conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-950">No real conversations yet</p>
                <p className="mt-1 text-sm text-slate-500">When a candidate or recruiter sends a message, it will appear here.</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conversation) => {
                  const active = selectedConversation?.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.otherUser.avatar} />
                          <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                            {getInitial(conversation.otherUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-slate-950">{conversation.otherUser.name || 'User'}</p>
                          <span className="text-xs text-slate-400">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{conversation.otherUser.userType}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {conversation.lastMessage ? conversation.lastMessage.message : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </aside>

        <section className="flex min-h-0 flex-col bg-slate-50">
          {selectedConversation ? (
            <>
              <div className="border-b border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={selectedConversation.otherUser.avatar} />
                    <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                      {getInitial(selectedConversation.otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-slate-950">{selectedConversation.otherUser.name || 'User'}</h2>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                      <span>{selectedConversation.otherUser.userType}</span>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-5">
                {isThreadLoading ? (
                  <div className="text-sm text-slate-500">Loading real messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                      <p className="font-semibold text-slate-950">No real messages in this thread</p>
                      <p className="mt-1 text-sm text-slate-500">Send the first message to start the conversation.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const mine = message.senderId === currentProfileId;

                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${mine ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                            <p className={`mt-1 text-right text-[11px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <Textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Write a message..."
                    rows={2}
                    className="min-h-[48px] resize-none border-0 bg-transparent text-slate-950 shadow-none focus-visible:ring-0"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="rounded-full bg-blue-600 px-4 text-white hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <MessageCircle className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h2 className="text-lg font-semibold text-slate-950">Select a conversation</h2>
                <p className="mt-1 text-sm text-slate-500">Real messages from Supabase will open here.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="hidden border-l border-slate-200 bg-white p-5 lg:block">
          {selectedConversation ? (
            <div className="space-y-5">
              <div className="text-center">
                <Avatar className="mx-auto h-20 w-20">
                  <AvatarImage src={selectedConversation.otherUser.avatar} />
                  <AvatarFallback className="bg-blue-100 text-2xl font-semibold text-blue-700">
                    {getInitial(selectedConversation.otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 font-semibold text-slate-950">{selectedConversation.otherUser.name || 'User'}</h3>
                <p className="text-sm text-slate-500">{selectedConversation.otherUser.email || 'No email saved'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Profile</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{selectedConversation.otherUser.userType}</span>
                  </div>
                  {selectedConversation.otherUser.company && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span>{selectedConversation.otherUser.company}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={onBack}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Choose a thread to see profile details.</div>
          )}
        </aside>
      </main>
    </div>
  );
}