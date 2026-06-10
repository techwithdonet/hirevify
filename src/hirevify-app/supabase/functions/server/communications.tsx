import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const communications = new Hono();

// CORS configuration
communications.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Send message
communications.post('/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { recipientId, message, applicationId, subject, messageType } = await c.req.json();
    
    // Validation
    if (!recipientId || !message) {
      return c.json({ error: 'Recipient ID and message are required' }, 400);
    }
    
    if (message.trim().length === 0) {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }
    
    if (message.length > 5000) {
      return c.json({ error: 'Message is too long (max 5000 characters)' }, 400);
    }
    
    // Check if recipient exists
    const recipient = await kv.get(`user:${recipientId}`);
    if (!recipient) {
      return c.json({ error: 'Recipient not found' }, 404);
    }
    
    const messageId = `message:${crypto.randomUUID()}`;
    
    const messageData = {
      id: messageId,
      senderId: user.id,
      recipientId,
      message: message.trim(),
      subject: subject?.trim() || '',
      applicationId,
      messageType: messageType || 'direct',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'direct'
    };
    
    await kv.set(messageId, messageData);
    
    // Add to conversation thread
    const conversationKey = `conversation:${[user.id, recipientId].sort().join(':')}`;
    const conversation = await kv.get(conversationKey) || [];
    conversation.push(messageId);
    await kv.set(conversationKey, conversation);
    
    // Create notification for recipient
    const senderName = user.user_metadata?.name || user.email?.split('@')[0] || 'A user';
    const notification = {
      id: crypto.randomUUID(),
      type: 'new_message',
      title: 'New Message',
      message: subject 
        ? `${senderName} sent you a message: "${subject}"`
        : `You have a new message from ${senderName}`,
      data: { messageId, senderId: user.id, conversationKey },
      createdAt: new Date().toISOString(),
      read: false
    };
    
    const recipientNotifications = await kv.get(`notifications:${recipientId}`) || [];
    recipientNotifications.unshift(notification);
    await kv.set(`notifications:${recipientId}`, recipientNotifications.slice(0, 100)); // Keep more notifications
    
    // Get sender info for response
    const senderInfo = {
      id: user.id,
      name: senderName,
      email: user.email
    };
    
    return c.json({ 
      message: {
        ...messageData,
        sender: senderInfo
      },
      success: true
    });
  } catch (error) {
    console.error('Message sending error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get conversation between two users
communications.get('/conversations/:otherUserId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const otherUserId = c.req.param('otherUserId');
    if (!otherUserId) {
      return c.json({ error: 'Other user ID is required' }, 400);
    }
    
    // Check if other user exists
    const otherUser = await kv.get(`user:${otherUserId}`);
    if (!otherUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const conversationKey = `conversation:${[user.id, otherUserId].sort().join(':')}`;
    const messageIds = await kv.get(conversationKey) || [];
    const messages = await kv.mget(messageIds);
    
    // Mark messages as read if they're sent to current user
    const readUpdates = [];
    const validMessages = [];
    
    for (const message of messages.filter(Boolean)) {
      // Add sender/recipient info
      const sender = await kv.get(`user:${message.senderId}`);
      const enrichedMessage = {
        ...message,
        sender: sender ? {
          id: sender.id,
          name: sender.name || sender.email?.split('@')[0] || 'Unknown',
          email: sender.email
        } : null
      };
      
      validMessages.push(enrichedMessage);
      
      // Mark as read if recipient is current user
      if (message.recipientId === user.id && !message.read) {
        message.read = true;
        message.readAt = new Date().toISOString();
        readUpdates.push(kv.set(message.id, message));
      }
    }
    
    await Promise.all(readUpdates);
    
    // Sort messages by creation date
    validMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return c.json({ 
      messages: validMessages,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        userType: otherUser.userType
      }
    });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// Get all conversations for a user
communications.get('/conversations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all conversation keys that include this user
    const allConversations = await kv.getByPrefix('conversation:');
    const userConversations = allConversations.filter(conv => 
      conv.key && conv.key.includes(user.id)
    );
    
    const conversations = [];
    
    for (const conv of userConversations) {
      try {
        const messageIds = conv.value || [];
        if (messageIds.length === 0) continue;
        
        // Get the other user ID from the conversation key
        const keyParts = conv.key.split(':');
        const otherUserId = keyParts.find(id => id !== user.id && id !== 'conversation');
        
        if (!otherUserId) continue;
        
        // Get the last message
        const lastMessageId = messageIds[messageIds.length - 1];
        const lastMessage = await kv.get(lastMessageId);
        
        if (!lastMessage) continue;
        
        // Get other user info
        const otherUser = await kv.get(`user:${otherUserId}`);
        if (!otherUser) continue;
        
        // Count unread messages
        const unreadMessages = await kv.mget(messageIds);
        const unreadCount = unreadMessages.filter(msg => 
          msg && msg.recipientId === user.id && !msg.read
        ).length;
        
        conversations.push({
          conversationId: conv.key,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            userType: otherUser.userType
          },
          lastMessage: {
            ...lastMessage,
            sender: lastMessage.senderId === user.id ? 'You' : otherUser.name
          },
          unreadCount,
          updatedAt: lastMessage.createdAt
        });
      } catch (convError) {
        console.error('Error processing conversation:', convError);
        continue;
      }
    }
    
    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    return c.json({ conversations });
  } catch (error) {
    console.error('Conversations list error:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Get notifications
communications.get('/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    
    // Sort by creation date (newest first)
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return c.json({ 
      notifications: sortedNotifications,
      unreadCount: sortedNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark notification as read
communications.put('/notifications/:id/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const notificationId = c.req.param('id');
    if (!notificationId) {
      return c.json({ error: 'Notification ID is required' }, 400);
    }
    
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true, readAt: new Date().toISOString() }
        : notif
    );
    
    await kv.set(`notifications:${user.id}`, updatedNotifications);
    
    return c.json({ 
      message: 'Notification marked as read',
      success: true
    });
  } catch (error) {
    console.error('Notification update error:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
});

// Mark all notifications as read
communications.put('/notifications/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    const currentTime = new Date().toISOString();
    
    const updatedNotifications = notifications.map(notif => ({
      ...notif,
      read: true,
      readAt: notif.readAt || currentTime
    }));
    
    await kv.set(`notifications:${user.id}`, updatedNotifications);
    
    return c.json({ 
      message: 'All notifications marked as read',
      success: true,
      updatedCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return c.json({ error: 'Failed to update notifications' }, 500);
  }
});

// Delete notification
communications.delete('/notifications/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const notificationId = c.req.param('id');
    if (!notificationId) {
      return c.json({ error: 'Notification ID is required' }, 400);
    }
    
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
    
    await kv.set(`notifications:${user.id}`, updatedNotifications);
    
    return c.json({ 
      message: 'Notification deleted',
      success: true
    });
  } catch (error) {
    console.error('Notification deletion error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// Get message statistics
communications.get('/messages/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all conversations for this user
    const allConversations = await kv.getByPrefix('conversation:');
    const userConversations = allConversations.filter(conv => 
      conv.key && conv.key.includes(user.id)
    );
    
    let totalMessages = 0;
    let unreadMessages = 0;
    let totalConversations = userConversations.length;
    
    for (const conv of userConversations) {
      const messageIds = conv.value || [];
      totalMessages += messageIds.length;
      
      const messages = await kv.mget(messageIds);
      unreadMessages += messages.filter(msg => 
        msg && msg.recipientId === user.id && !msg.read
      ).length;
    }
    
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    const unreadNotifications = notifications.filter(n => !n.read).length;
    
    return c.json({
      stats: {
        totalConversations,
        totalMessages,
        unreadMessages,
        unreadNotifications,
        responseRate: totalMessages > 0 ? Math.round((totalMessages / (totalMessages + unreadMessages)) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Message stats error:', error);
    return c.json({ error: 'Failed to fetch message statistics' }, 500);
  }
});

// Search conversations and messages
communications.get('/search', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const query = c.req.query('q');
    if (!query || query.trim().length < 2) {
      return c.json({ error: 'Search query must be at least 2 characters' }, 400);
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    // Get all conversations for this user
    const allConversations = await kv.getByPrefix('conversation:');
    const userConversations = allConversations.filter(conv => 
      conv.key && conv.key.includes(user.id)
    );
    
    const searchResults = [];
    
    for (const conv of userConversations) {
      const messageIds = conv.value || [];
      const messages = await kv.mget(messageIds);
      
      const otherUserId = conv.key.split(':').find(id => id !== user.id && id !== 'conversation');
      const otherUser = await kv.get(`user:${otherUserId}`);
      
      if (!otherUser) continue;
      
      // Search in messages
      const matchingMessages = messages.filter(msg => 
        msg && (
          msg.message.toLowerCase().includes(searchTerm) ||
          msg.subject.toLowerCase().includes(searchTerm)
        )
      );
      
      // Search in user names
      const userNameMatch = otherUser.name?.toLowerCase().includes(searchTerm) ||
                           otherUser.email?.toLowerCase().includes(searchTerm);
      
      if (matchingMessages.length > 0 || userNameMatch) {
        searchResults.push({
          conversation: {
            conversationId: conv.key,
            otherUser: {
              id: otherUser.id,
              name: otherUser.name,
              email: otherUser.email,
              userType: otherUser.userType
            }
          },
          matchingMessages: matchingMessages.map(msg => ({
            ...msg,
            sender: msg.senderId === user.id ? 'You' : otherUser.name
          })),
          userNameMatch
        });
      }
    }
    
    return c.json({ 
      results: searchResults,
      query: searchTerm,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Failed to search messages' }, 500);
  }
});

// Health check endpoint
communications.get('/health', (c) => {
  return c.json({ status: 'Communications service is running' });
});

export default communications;




