import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, FooterComponent],
  template: `
    <header class="header">
      <a routerLink="/" class="logo">Bible Memory</a>
      <nav class="nav">
        @if (auth.isAuthenticated()) {
          <a routerLink="/collections">Collections</a>
          <span class="username">{{ auth.username() }}</span>
          <button type="button" (click)="auth.logout()">Logout</button>
        } @else {
          <a routerLink="/login">Login</a>
          <a routerLink="/signup">Signup</a>
        }
      </nav>
    </header>
    <main class="main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--primary);
      color: white;
    }
    .logo {
      font-weight: 700;
      font-size: 1.25rem;
      color: white;
      text-decoration: none;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .nav a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
    }
    .nav a:hover {
      color: white;
      text-decoration: underline;
    }
    .username {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    .nav button {
      padding: 0.4rem 0.8rem;
      border: 1px solid rgba(255,255,255,0.5);
      background: transparent;
      color: white;
      border-radius: 4px;
    }
    .nav button:hover {
      background: rgba(255,255,255,0.1);
    }
    .main {
      min-height: calc(100vh - 120px);
      padding: 1.5rem;
    }
  `]
})
export class LayoutComponent {
  constructor(public auth: AuthService) {}
}
