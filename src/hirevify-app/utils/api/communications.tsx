import { createClient } from "../supabase/client";

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  message: string;
  subject?: string;
  applicationId?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  type: "direct" | "system";
  attachment?: MessageAttachment;
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
  id: string;
  recruiterId: string;
  candidateId: string;
  applicationId?: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    userType: "recruiter" | "candidate";
    title?: string;
    company?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  subject: string | null;
  application_id: string | null;
  created_at: string;
  read: boolean;
  read_at: string | null;
  type: "direct" | "system";
  payload: {
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number;
  } | null;
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

type ConversationRow = {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  application_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type ProfileRow = {
  id: string;
  auth_user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
};

function normalizeUserType(profile: ProfileRow): "recruiter" | "candidate" {
  return profile.role === "recruiter" ? "recruiter" : "candidate";
}

function uniqueClean(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function mapMessage(row: MessageRow): Message {
  const payload = row.payload;
  const attachment: MessageAttachment | undefined =
    payload && payload.attachment_url
      ? {
          url: payload.attachment_url,
          name: payload.attachment_name || "Attachment",
          type: payload.attachment_type || "application/octet-stream",
          size: payload.attachment_size || 0,
        }
      : undefined;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    message: row.message,
    subject: row.subject || undefined,
    applicationId: row.application_id || undefined,
    createdAt: row.created_at,
    read: row.read,
    readAt: row.read_at || undefined,
    type: row.type || "direct",
    attachment,
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

async function getCurrentChatUserId(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("User is not authenticated.");
  }

  return data.user.id;
}

async function getParticipantAliases(id: string): Promise<string[]> {
  const supabase = createClient();
  const aliases = new Set<string>(uniqueClean([id]));

  const { data: profileById } = await supabase
    .from("profiles")
    .select("id, auth_user_id")
    .eq("id", id)
    .maybeSingle();

  if (profileById) {
    aliases.add(profileById.id);
    if (profileById.auth_user_id) aliases.add(profileById.auth_user_id);
  }

  const { data: profileByAuthId } = await supabase
    .from("profiles")
    .select("id, auth_user_id")
    .eq("auth_user_id", id)
    .maybeSingle();

  if (profileByAuthId) {
    aliases.add(profileByAuthId.id);
    if (profileByAuthId.auth_user_id) aliases.add(profileByAuthId.auth_user_id);
  }

  const { data: candidateById } = await supabase
    .from("candidate_profiles")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (candidateById) {
    aliases.add(candidateById.id);
    if (candidateById.user_id) aliases.add(candidateById.user_id);
  }

  const { data: candidateByUserId } = await supabase
    .from("candidate_profiles")
    .select("id, user_id")
    .eq("user_id", id)
    .maybeSingle();

  if (candidateByUserId) {
    aliases.add(candidateByUserId.id);
    if (candidateByUserId.user_id) aliases.add(candidateByUserId.user_id);
  }

  return [...aliases];
}

async function normalizeParticipantToAuthId(id: string): Promise<string> {
  const supabase = createClient();

  const { data: profileById } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", id)
    .maybeSingle();

  if (profileById?.auth_user_id) {
    return profileById.auth_user_id;
  }

  const { data: profileByAuthId } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("auth_user_id", id)
    .maybeSingle();

  if (profileByAuthId?.auth_user_id) {
    return profileByAuthId.auth_user_id;
  }

  const { data: candidateById } = await supabase
    .from("candidate_profiles")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (candidateById?.user_id) {
    return candidateById.user_id;
  }

  const { data: candidateByUserId } = await supabase
    .from("candidate_profiles")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle();

  if (candidateByUserId?.user_id) {
    return candidateByUserId.user_id;
  }

  return id;
}

async function normalizeParticipantToProfileId(id: string): Promise<string | null> {
  const supabase = createClient();

  const { data: profileById } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (profileById?.id) {
    return profileById.id;
  }

  const authId = await normalizeParticipantToAuthId(id);
  const { data: profileByAuthId } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authId)
    .maybeSingle();

  if (profileByAuthId?.id) {
    return profileByAuthId.id;
  }

  return null;
}

async function getProfileMap(participantIds: string[]) {
  const supabase = createClient();
  const uniqueIds = uniqueClean(participantIds);

  if (uniqueIds.length === 0) {
    return new Map<string, Conversation["otherUser"]>();
  }

  const [{ data: profilesById, error: profilesByIdError }, { data: profilesByAuthId, error: profilesByAuthIdError }] = await Promise.all([
    supabase
    .from("profiles")
    .select("id, auth_user_id, full_name, email, role, company_name, avatar_url")
      .in("id", uniqueIds),
    supabase
      .from("profiles")
      .select("id, auth_user_id, full_name, email, role, company_name, avatar_url")
      .in("auth_user_id", uniqueIds),
  ]);

  if (profilesByIdError || profilesByAuthIdError) {
    console.warn("Failed to load profile details:", profilesByIdError?.message || profilesByAuthIdError?.message);
  }

  const [{ data: candidatesById }, { data: candidatesByUserId }] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("id, user_id, full_name, email")
      .in("id", uniqueIds),
    supabase
      .from("candidate_profiles")
      .select("id, user_id, full_name, email")
      .in("user_id", uniqueIds),
  ]);

  const profileMap = new Map<string, Conversation["otherUser"]>();
  const profiles = [...(profilesById || []), ...(profilesByAuthId || [])];

  for (const profile of profiles as ProfileRow[]) {
    const canonicalId = profile.auth_user_id || profile.id;
    const user: Conversation["otherUser"] = {
      id: canonicalId,
      name: profile.full_name || profile.email || "User",
      email: profile.email || "",
      avatar: profile.avatar_url || undefined,
      userType: normalizeUserType(profile),
      company: profile.company_name || undefined,
    };

    profileMap.set(profile.id, user);
    if (profile.auth_user_id) {
      profileMap.set(profile.auth_user_id, user);
    }
  }

  for (const cp of [...(candidatesById || []), ...(candidatesByUserId || [])] as { id: string; user_id?: string; full_name?: string; email?: string }[]) {
    const canonicalId = cp.user_id || cp.id;
    if (!profileMap.has(cp.id)) {
      const user: Conversation["otherUser"] = {
        id: canonicalId,
        name: cp.full_name || cp.email || "User",
        email: cp.email || "",
        userType: "candidate",
      };

      profileMap.set(cp.id, user);
      if (cp.user_id) {
        profileMap.set(cp.user_id, user);
      }
    }
  }

  return profileMap;
}

export class CommunicationsAPI {
  static async getCurrentProfileId(): Promise<string> {
    return getCurrentChatUserId();
  }

  static async getCurrentParticipantAliases(): Promise<string[]> {
    const currentUserId = await getCurrentChatUserId();
    return uniqueClean([currentUserId, ...(await getParticipantAliases(currentUserId))]);
  }

  static async getOrCreateConversation(conversationData: {
    recruiterProfileId: string;
    candidateProfileId: string;
    applicationId?: string;
  }): Promise<ConversationRow> {
    const supabase = createClient();

    if (!conversationData.recruiterProfileId || !conversationData.candidateProfileId) {
      throw new Error("Both recruiter and candidate profiles are required to open a conversation.");
    }

    const [recruiterId, candidateId, recruiterAliases, candidateAliases] = await Promise.all([
      normalizeParticipantToAuthId(conversationData.recruiterProfileId),
      normalizeParticipantToAuthId(conversationData.candidateProfileId),
      getParticipantAliases(conversationData.recruiterProfileId),
      getParticipantAliases(conversationData.candidateProfileId),
    ]);

    const findExisting = async () => {
      let query = supabase
        .from("conversations")
        .select("*")
        .in("recruiter_id", uniqueClean([recruiterId, ...recruiterAliases]))
        .in("candidate_id", uniqueClean([candidateId, ...candidateAliases]));

      query = conversationData.applicationId
        ? query.eq("application_id", conversationData.applicationId)
        : query.is("application_id", null);

      return query.maybeSingle();
    };

    const { data: existing, error: existingError } = await findExisting();

    if (existingError) {
      throw new Error(existingError.message || "Failed to find conversation.");
    }

    if (existing) {
      return existing as ConversationRow;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        recruiter_id: recruiterId,
        candidate_id: candidateId,
        application_id: conversationData.applicationId || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error('[getOrCreateConversation] Insert error:', error);
      // Unique constraint hit (race: another request created it first) â€" fetch the real row.
      if (error.code === "23505") {
        const { data: retried } = await findExisting();
        if (retried) return retried as ConversationRow;
      }

      if (error.code === "23503") {
        const [legacyRecruiterId, legacyCandidateId] = await Promise.all([
          normalizeParticipantToProfileId(conversationData.recruiterProfileId),
          normalizeParticipantToProfileId(conversationData.candidateProfileId),
        ]);

        if (legacyRecruiterId && legacyCandidateId) {
          const legacy = await supabase
            .from("conversations")
            .insert({
              recruiter_id: legacyRecruiterId,
              candidate_id: legacyCandidateId,
              application_id: conversationData.applicationId || null,
            })
            .select("*")
            .single();

          if (!legacy.error) {
            return legacy.data as ConversationRow;
          }
        }

        throw new Error("Chat database still depends on profile IDs. Run supabase_chat_identity_migration.sql in Supabase, then try Message candidate again.");
      }

      throw new Error(error.message || "Failed to create conversation.");
    }

    return data as ConversationRow;
  }

  static readonly MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB

  static async uploadAttachment(
    file: File,
    conversationId: string,
  ): Promise<MessageAttachment> {
    if (file.size > CommunicationsAPI.MAX_ATTACHMENT_SIZE) {
      throw new Error("File is too large. Maximum size is 5MB.");
    }

    const supabase = createClient();
    const senderId = await getCurrentChatUserId();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${conversationId}/${senderId}-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Failed to upload attachment.");
    }

    const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  static async sendMessage(messageData: {
    conversationId: string;
    recipientId: string;
    message: string;
    subject?: string;
    applicationId?: string;
    attachment?: MessageAttachment;
  }): Promise<Message> {
    const supabase = createClient();
    const senderId = await getCurrentChatUserId();

    if (!messageData.conversationId) {
      throw new Error("A conversation is required to send a message.");
    }

    if (!messageData.message.trim() && !messageData.attachment) {
      throw new Error("Message text or an attachment is required.");
    }

    const payload = messageData.attachment
      ? {
          attachment_url: messageData.attachment.url,
          attachment_name: messageData.attachment.name,
          attachment_type: messageData.attachment.type,
          attachment_size: messageData.attachment.size,
        }
      : null;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: messageData.conversationId,
        sender_id: senderId,
        recipient_id: messageData.recipientId,
        message: messageData.message,
        subject: messageData.subject || null,
        application_id: messageData.applicationId || null,
        type: "direct",
        read: false,
        payload,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Failed to send message.");
    }

    // last_message_at on conversations is kept current by the DB trigger.
    return mapMessage(data as MessageRow);
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message || "Failed to fetch messages.");
    }

    return ((data || []) as MessageRow[]).map(mapMessage);
  }

  static async markConversationAsRead(conversationId: string): Promise<void> {
    const supabase = createClient();
    const currentUserId = await getCurrentChatUserId();
    const currentUserAliases = await getParticipantAliases(currentUserId);

    const { error } = await supabase
      .from("messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .in("recipient_id", uniqueClean([currentUserId, ...currentUserAliases]))
      .eq("read", false);

    if (error) {
      throw new Error(error.message || "Failed to mark conversation as read.");
    }
  }

  static async getConversations(): Promise<Conversation[]> {
    const supabase = createClient();
    const currentUserId = await getCurrentChatUserId();
    const currentUserAliases = uniqueClean([currentUserId, ...(await getParticipantAliases(currentUserId))]);

    const { data: conversationRows, error: conversationsError } = await supabase
      .from("conversations")
      .select("*")
      .or(`recruiter_id.in.(${currentUserAliases.join(",")}),candidate_id.in.(${currentUserAliases.join(",")})`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (conversationsError) {
      throw new Error(conversationsError.message || "Failed to fetch conversations.");
    }

    const conversationList = (conversationRows || []) as ConversationRow[];

    if (conversationList.length === 0) {
      return [];
    }

    const conversationIds = conversationList.map((c) => c.id);

    const { data: messageRows, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (messagesError) {
      throw new Error(messagesError.message || "Failed to fetch conversations.");
    }

    const messagesByConversation = new Map<string, Message[]>();
    for (const row of (messageRows || []) as MessageRow[]) {
      const message = mapMessage(row);
      const list = messagesByConversation.get(message.conversationId) || [];
      list.push(message);
      messagesByConversation.set(message.conversationId, list);
    }

    const otherUserIds = conversationList.map((c) =>
      currentUserAliases.includes(c.recruiter_id) ? c.candidate_id : c.recruiter_id,
    );
    const profiles = await getProfileMap(otherUserIds);

    return conversationList.map((conversation) => {
      const otherUserId =
        currentUserAliases.includes(conversation.recruiter_id) ? conversation.candidate_id : conversation.recruiter_id;
      const messages = messagesByConversation.get(conversation.id) || [];
      const unreadCount = messages.filter((m) => !currentUserAliases.includes(m.senderId) && !m.read).length;

      return {
        id: conversation.id,
        recruiterId: conversation.recruiter_id,
        candidateId: conversation.candidate_id,
        applicationId: conversation.application_id || undefined,
        otherUser: profiles.get(otherUserId) || {
          id: otherUserId,
          name: "User",
          email: "",
          userType: conversation.recruiter_id === otherUserId ? "recruiter" : "candidate",
        },
        lastMessage: messages[0],
        unreadCount,
      };
    });
  }

  static subscribeToMessages(conversationId: string, onMessage: (message: Message) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(mapMessage(payload.new as MessageRow));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static subscribeToConversations(profileId: string, onChange: () => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversations:${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `recruiter_id=eq.${profileId}` },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `candidate_id=eq.${profileId}` },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static async getNotifications(): Promise<Notification[]> {
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

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      throw new Error(error.message || "Failed to mark notification as read.");
    }
  }
}
