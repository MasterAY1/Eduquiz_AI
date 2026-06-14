import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  document_id: string | null;
  created_at: string;
  messages: ChatMessage[];
}

export const chatApi = {
  getSessions: async () => {
    const { data } = await apiClient.get<ChatSession[]>('/chat/sessions');
    return data;
  },

  createSession: async (title: string, document_id?: string | null) => {
    const { data } = await apiClient.post<ChatSession>('/chat/sessions', {
      title,
      document_id: document_id || null,
    });
    return data;
  },

  getMessages: async (sessionId: string) => {
    const { data } = await apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
    return data;
  },

  sendMessage: async (sessionId: string, content: string) => {
    const { data } = await apiClient.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
      content,
    });
    return data;
  },
};
