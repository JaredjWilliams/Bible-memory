import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { activeProfileGuard } from './core/guards/active-profile.guard';
import { defaultRedirectGuard } from './core/guards/default-redirect.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', canActivate: [defaultRedirectGuard], loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'copyright', loadComponent: () => import('./features/copyright/copyright.component').then(m => m.CopyrightComponent) },
      {
        path: 'collections',
        loadComponent: () => import('./features/collections/collection-list/collection-list.component').then(m => m.CollectionListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'collections/:id',
        loadComponent: () => import('./features/collections/collection-detail/collection-detail.component').then(m => m.CollectionDetailComponent),
        canActivate: [authGuard, activeProfileGuard]
      },
      {
        path: 'typing/:collectionId',
        loadComponent: () => import('./features/typing/typing-practice/typing-practice.component').then(m => m.TypingPracticeComponent),
        canActivate: [authGuard, activeProfileGuard]
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
      }
    ]
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
