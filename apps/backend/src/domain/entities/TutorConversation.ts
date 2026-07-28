export interface TutorConversation {
    id: string;
    userId: string;
    title: string;
    topic: string | null;
    lastMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TutorMessage {
    id: string;
    conversationId: string;
    isAI: boolean;
    content: string;
    suggestedActions: Array<{ label: string; icon: string }> | null;
    createdAt: Date;
}
