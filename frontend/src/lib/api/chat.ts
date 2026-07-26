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

  streamMessage: async function* (sessionId: string, content: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the incomplete line in the buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              yield parsed.chunk;
            }
            if (parsed.done) {
              return;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.warn('Failed to parse stream chunk', dataStr, e);
          }
        }
      }
    }
  },
};
