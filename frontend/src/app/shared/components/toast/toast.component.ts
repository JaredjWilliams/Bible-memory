import { Component } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (msg of toast.messages(); track msg.id) {
        <div class="toast" [class]="msg.type" (click)="toast.dismiss(msg.id)">
          {{ msg.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 90vw;
    }
    .toast {
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      background: var(--primary-text);
      color: white;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .toast.error { background: var(--error); }
    .toast.success { background: var(--success); }
    .toast.info { background: var(--primary); }
  `]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
