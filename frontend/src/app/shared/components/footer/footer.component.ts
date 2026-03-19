import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <a href="https://www.esv.org" target="_blank" rel="noopener">ESV</a>
      <span> · </span>
      <a routerLink="/copyright">Copyright</a>
    </footer>
  `,
  styles: [`
    .footer {
      padding: 1rem 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--secondary-text);
      border-top: 1px solid var(--secondary);
    }
    .footer a {
      color: var(--primary);
    }
  `]
})
export class FooterComponent {}
