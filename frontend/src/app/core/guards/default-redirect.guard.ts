import { inject } from '@angular/core';
import { Router, type UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const defaultRedirectGuard = (): UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/collections']);
  }
  return router.createUrlTree(['/login']);
};
