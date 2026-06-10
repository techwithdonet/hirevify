import { projectId } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface Message {
  id: string
  senderId: string
  recipientId: string
  message: string
  subject?: string
  applicationId?: string
  createdAt: string
  read: boolean
  readAt?: string
  type: 'direct' | 'system'
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  createdAt: string
  read: boolean
  readAt?: string
}

export interface Conversation {
  otherUser: any
  lastMessage: Message
  unreadCount: number
}

export class CommunicationsAPI {
  static async sendMessage(messageData: {
    recipientId: string
    message: string
    subject?: string
    applicationId?: string
  }, accessToken: string): Promise<Message> {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(messageData)
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message')
    }

    return result.message
  }

  static async getConversation(otherUserId: string, accessToken: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE}/conversations/${otherUserId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch conversation')
    }

    return result.messages
  }

  static async getConversations(accessToken: string): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE}/conversations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch conversations')
    }

    return result.conversations
  }

  static async getNotifications(accessToken: string): Promise<Notification[]> {
    const response = await fetch(`${API_BASE}/notifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch notifications')
    }

    return result.notifications
  }

  static async markNotificationAsRead(notificationId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark notification as read')
    }
  }
}




