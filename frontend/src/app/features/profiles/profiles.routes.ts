import { Routes } from '@angular/router';

export const profilesRoutes: Routes = [
  { path: '', loadComponent: () => import('./profile-list/profile-list.component').then(m => m.ProfileListComponent) }
];
