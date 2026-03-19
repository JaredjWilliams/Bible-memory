import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveProfileService } from '../services/active-profile.service';

export const activeProfileGuard = () => {
  const activeProfile = inject(ActiveProfileService);
  const router = inject(Router);
  if (activeProfile.hasActiveProfile()) return true;
  router.navigate(['/collections']);
  return false;
};
