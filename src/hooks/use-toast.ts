import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

let toastIdCounter = 0;
const listeners: Array<(t: Toast) => void> = [];

export function toast({ title, description, variant }: Omit<Toast, 'id'>) {
  const t: Toast = { id: String(++toastIdCounter), title, description, variant };
  listeners.forEach((fn) => fn(t));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  // Register listener on first call
  if (!listeners.includes(addToast)) {
    listeners.push(addToast);
  }

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
