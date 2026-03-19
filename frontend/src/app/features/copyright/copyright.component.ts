import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="copyright-page">
      <h1>Copyright</h1>
      <p>
        Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®),
        copyright © 2001 by Crossway, a publishing ministry of Good News Publishers.
        Used by permission. All rights reserved.
      </p>
      <a routerLink="/">Back</a>
    </div>
  `,
  styles: [`
    .copyright-page {
      max-width: 600px;
      margin: 0 auto;
    }
    .copyright-page h1 {
      color: var(--primary);
      margin-bottom: 1rem;
    }
    .copyright-page p {
      line-height: 1.7;
      color: var(--primary-text);
    }
  `]
})
export class CopyrightComponent {}
