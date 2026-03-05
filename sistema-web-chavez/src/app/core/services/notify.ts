import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private seq = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message?: string | null) {
    this.push('success', (message ?? '').trim() || 'Operación realizada correctamente');
  }

  error(message?: string | null) {
    this.push('error', (message ?? '').trim() || 'Ocurrió un error');
  }

  info(message?: string | null) {
    this.push('info', (message ?? '').trim() || 'Información');
  }

  remove(id: number) {
    this.toasts.update((xs) => xs.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string) {
    const id = this.seq++;
    this.toasts.update((xs) => [...xs, { id, type, message }]);
    setTimeout(() => this.remove(id), type === 'error' ? 4500 : 3000);
  }
}
