import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <h1>Bible Memory</h1>
      <p>Memorize Scripture with typing practice and spaced repetition.</p>
      @if (auth.isAuthenticated()) {
        <a routerLink="/collections" class="btn">Go to Collections</a>
      } @else {
        <a routerLink="/login" class="btn">Login</a>
        <a routerLink="/signup" class="btn secondary">Sign up</a>
      }
    </div>
  `,
  styles: [`
    .home {
      text-align: center;
      padding: 2rem 1rem;
    }
    .home h1 {
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .home p {
      color: var(--secondary-text);
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      margin: 0 0.5rem;
      background: var(--primary);
      color: white;
      border-radius: 8px;
      text-decoration: none;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .btn.secondary {
      background: var(--secondary);
      color: var(--primary-text);
    }
  `]
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
