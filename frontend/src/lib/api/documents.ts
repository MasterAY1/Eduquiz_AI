import { apiClient } from './client';
import type { Document, DocumentStatus, DocumentListResponse } from '@/types';

export const documentsApi = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<Document>('/api/v1/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      })
      .then((r) => r.data);
  },

  list: (skip = 0, limit = 20) =>
    apiClient.get<DocumentListResponse>('/api/v1/documents', { params: { skip, limit } }).then((r) => r.data),

  get: (id: string) => apiClient.get<Document>(`/api/v1/documents/${id}`).then((r) => r.data),

  getStatus: (id: string) =>
    apiClient.get<DocumentStatus>(`/api/v1/documents/${id}/status`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/documents/${id}`).then((r) => r.data),
};
