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
    const { data } = await apiClient.get<ChatSession[]>('/api/v1/chat/sessions');
    return data;
  },

  createSession: async (title: string, document_id?: string | null) => {
    const { data } = await apiClient.post<ChatSession>('/api/v1/chat/sessions', {
      title,
      document_id: document_id || null,
    });
    return data;
  },

  getMessages: async (sessionId: string) => {
    const { data } = await apiClient.get<ChatMessage[]>(`/api/v1/chat/sessions/${sessionId}/messages`);
    return data;
  },

  sendMessage: async (sessionId: string, content: string) => {
    const { data } = await apiClient.post<ChatMessage>(`/api/v1/chat/sessions/${sessionId}/messages`, {
      content,
    });
    return data;
  },
};
