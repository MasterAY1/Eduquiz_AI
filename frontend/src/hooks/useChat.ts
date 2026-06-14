import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';

export const useChatSessions = () => {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatApi.getSessions,
  });
};

export const useChatMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: () => chatApi.getMessages(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });
};

export const useCreateChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, document_id }: { title: string; document_id?: string | null }) =>
      chatApi.createSession(title, document_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      chatApi.sendMessage(sessionId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.sessionId] });
    },
  });
};
