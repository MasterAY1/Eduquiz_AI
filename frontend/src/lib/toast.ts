/**
 * Convenience wrapper around the UI store's addToast.
 *
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.success('It worked!');
 *   toast.error('Something failed.');
 */

import { useUIStore } from '@/store/uiStore';

function addToast(type: 'success' | 'error' | 'info' | 'warning', message: string) {
  // Access the store imperatively (outside React components)
  useUIStore.getState().addToast({ type, message });
}

export const toast = {
  success: (message: string) => addToast('success', message),
  error: (message: string) => addToast('error', message),
  info: (message: string) => addToast('info', message),
  warning: (message: string) => addToast('warning', message),
};
