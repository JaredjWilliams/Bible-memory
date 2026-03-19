import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>Page not found</p>
      <a routerLink="/">Go home</a>
    </div>
  `,
  styles: [`
    .not-found {
      text-align: center;
      padding: 3rem 1rem;
    }
    .not-found h1 {
      font-size: 4rem;
      color: var(--primary);
      margin: 0;
    }
    .not-found p {
      margin: 0.5rem 0 1.5rem;
      color: var(--secondary-text);
    }
  `]
})
export class NotFoundComponent {}
