import { createClient } from "../supabase/client";

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  subject?: string;
  applicationId?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  type: "direct" | "system";
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export interface Conversation {
  otherUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    userType: "recruiter" | "candidate";
    title?: string;
    company?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  subject: string | null;
  application_id: string | null;
  created_at: string;
  read: boolean;
  read_at: string | null;
  type: "direct" | "system";
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  created_at: string;
  read: boolean;
  read_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  user_type?: string | null;
  company_name?: string | null;
  title?: string | null;
  avatar_url?: string | null;
};

function normalizeUserType(profile: ProfileRow): "recruiter" | "candidate" {
  return profile.role === "recruiter" || profile.user_type === "recruiter"
    ? "recruiter"
    : "candidate";
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    message: row.message,
    subject: row.subject || undefined,
    applicationId: row.application_id || undefined,
    createdAt: row.created_at,
    read: row.read,
    readAt: row.read_at || undefined,
    type: row.type || "direct",
  };
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data,
    createdAt: row.created_at,
    read: row.read,
    readAt: row.read_at || undefined,
  };
}

async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("User is not authenticated.");
  }

  return data.user.id;
}

async function getProfileMap(userIds: string[]) {
  const supabase = createClient();
  const uniqueIds = [...new Set(userIds)].filter(Boolean);

  if (uniqueIds.length === 0) {
    return new Map<string, Conversation["otherUser"]>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, name, email, role, user_type, company_name, title, avatar_url")
    .in("id", uniqueIds);

  if (error) {
    console.warn("Failed to load message profile details:", error.message);
    return new Map<string, Conversation["otherUser"]>();
  }

  return new Map(
    ((data || []) as ProfileRow[]).map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name || profile.name || profile.email || "User",
        email: profile.email || "",
        avatar: profile.avatar_url || undefined,
        userType: normalizeUserType(profile),
        title: profile.title || undefined,
        company: profile.company_name || undefined,
      },
    ]),
  );
}

export class CommunicationsAPI {
  static async sendMessage(
    messageData: {
      recipientId: string;
      message: string;
      subject?: string;
      applicationId?: string;
    },
    _accessToken?: string,
  ): Promise<Message> {
    const supabase = createClient();
    const senderId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        recipient_id: messageData.recipientId,
        message: messageData.message,
        subject: messageData.subject || null,
        application_id: messageData.applicationId || null,
        type: "direct",
        read: false,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Failed to send message.");
    }

    return mapMessage(data as MessageRow);
  }

  static async getConversation(
    otherUserId: string,
    _accessToken?: string,
  ): Promise<Message[]> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message || "Failed to fetch conversation.");
    }

    return ((data || []) as MessageRow[]).map(mapMessage);
  }

  static async getConversations(_accessToken?: string): Promise<Conversation[]> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch conversations.");
    }

    const rows = ((data || []) as MessageRow[]).map(mapMessage);
    const byOtherUser = new Map<string, Conversation>();

    const otherUserIds = rows.map((message) =>
      message.senderId === currentUserId ? message.recipientId : message.senderId,
    );

    const profiles = await getProfileMap(otherUserIds);

    for (const message of rows) {
      const otherUserId =
        message.senderId === currentUserId ? message.recipientId : message.senderId;

      if (!byOtherUser.has(otherUserId)) {
        byOtherUser.set(otherUserId, {
          otherUser:
            profiles.get(otherUserId) || {
              id: otherUserId,
              name: "User",
              email: "",
              userType: "candidate",
            },
          lastMessage: message,
          unreadCount: 0,
        });
      }

      const conversation = byOtherUser.get(otherUserId);

      if (
        conversation &&
        message.recipientId === currentUserId &&
        !message.read
      ) {
        conversation.unreadCount += 1;
      }
    }

    return Array.from(byOtherUser.values());
  }

  static async getNotifications(_accessToken?: string): Promise<Notification[]> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch notifications.");
    }

    return ((data || []) as NotificationRow[]).map(mapNotification);
  }

  static async markNotificationAsRead(
    notificationId: string,
    _accessToken?: string,
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) {
      throw new Error(error.message || "Failed to mark notification as read.");
    }
  }
}
