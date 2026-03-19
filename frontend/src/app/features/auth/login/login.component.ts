import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-form">
      <h1>Login</h1>
      <form (ngSubmit)="onSubmit()" #f="ngForm">
        <label>
          <span>Username</span>
          <input type="text" name="username" [(ngModel)]="username" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" [(ngModel)]="password" required />
        </label>
        @if (errorMessage) {
          <p class="error">{{ errorMessage }}</p>
        }
        <button type="submit" [disabled]="loading || !f.valid">Login</button>
      </form>
      <a routerLink="/signup">Create account</a>
    </div>
  `,
  styles: [`
    .auth-form {
      max-width: 360px;
      margin: 2rem auto;
    }
    .auth-form h1 {
      color: var(--primary);
      margin-bottom: 1.5rem;
    }
    .auth-form label {
      display: block;
      margin-bottom: 1rem;
    }
    .auth-form label span {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }
    .auth-form input {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--secondary);
      border-radius: 6px;
      font-size: 1rem;
    }
    .auth-form .error {
      color: var(--error);
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }
    .auth-form button {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
    }
    .auth-form button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .auth-form a {
      display: block;
      margin-top: 1rem;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/collections']),
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Invalid username or password';
      }
    });
  }
}
