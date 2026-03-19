import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  messages = signal<ToastMessage[]>([]);

  error(message: string): void {
    this.add({ message, type: 'error' });
  }

  success(message: string): void {
    this.add({ message, type: 'success' });
  }

  info(message: string): void {
    this.add({ message, type: 'info' });
  }

  private add(msg: Omit<ToastMessage, 'id'>): void {
    const id = this.nextId++;
    this.messages.update((list) => [...list, { ...msg, id }]);
    setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }
}
