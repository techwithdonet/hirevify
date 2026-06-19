import { CommunicationsAPI } from './api/communications';

export interface OpenConversationParams {
 recruiterProfileId: string;
 candidateProfileId: string;
 currentUserProfileId: string;
 navigateToMessages: (conversationId?: string) => void;
 initialMessage?: string;
}

export async function openOrCreateConversationAndNavigate({
 recruiterProfileId,
 candidateProfileId,
 currentUserProfileId,
 navigateToMessages,
}: OpenConversationParams) {
 if (!currentUserProfileId) {
 throw new Error('Current user profile is required to open messages.');
 }

 if (!recruiterProfileId ||!candidateProfileId) {
 throw new Error('Recruiter and candidate profiles are required to open messages.');
 }

 const conversation = await CommunicationsAPI.getOrCreateConversation({
 recruiterProfileId,
 candidateProfileId,
 });

 navigateToMessages(conversation.id);
 return conversation;
}
