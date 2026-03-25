import { useEffect, useState } from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open?: boolean;
}

let count = 0;
function genId() { return String(++count); }

const toastStore: { toasts: ToasterToast[]; listeners: Array<(toasts: ToasterToast[]) => void> } = {
  toasts: [],
  listeners: [],
};

function dispatch(toasts: ToasterToast[]) {
  toastStore.toasts = toasts;
  toastStore.listeners.forEach((l) => l(toasts));
}

export function toast({ title, description, variant = 'default' }: Omit<ToasterToast, 'id' | 'open'>) {
  const id = genId();
  const t: ToasterToast = { id, title, description, variant, open: true };
  dispatch([t, ...toastStore.toasts].slice(0, TOAST_LIMIT));
  setTimeout(() => {
    dispatch(toastStore.toasts.map((x) => (x.id === id ? { ...x, open: false } : x)));
    setTimeout(() => dispatch(toastStore.toasts.filter((x) => x.id !== id)), 300);
  }, TOAST_REMOVE_DELAY);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>(toastStore.toasts);

  useEffect(() => {
    toastStore.listeners.push(setToasts);
    return () => { toastStore.listeners = toastStore.listeners.filter((l) => l !== setToasts); };
  }, []);

  return { toasts, toast };
}
