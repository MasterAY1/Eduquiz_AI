'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { useUIStore } from '@/store/uiStore';
import { useState } from 'react';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(0, 50),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useDocumentStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['document-status', id],
    queryFn: () => documentsApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.analysis_status;
      if (status === 'indexed' || status === 'failed') return false;
      return 3000;
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (file: File) =>
      documentsApi.upload(file, (progress) => setUploadProgress(progress)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'Document uploaded! AI is now analyzing it.' });
      setUploadProgress(0);
    },
    onError: (error: any) => {
      let message = 'Upload failed. Please try again.';
      const data = error.response?.data;
      
      if (data?.error?.message) {
        message = data.error.message;
      } else if (data?.detail) {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          message = data.detail[0].msg || message;
        }
      }
      
      addToast({ type: 'error', message });
      setUploadProgress(0);
    },
  });

  return { ...mutation, uploadProgress };
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'Document deleted successfully.' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to delete document. Please try again.' });
    },
  });
}
