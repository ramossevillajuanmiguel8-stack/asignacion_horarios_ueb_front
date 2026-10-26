import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/auth/login/login';

export const routes: Routes = [

  {
    path: 'login',
    component: Login
  },

  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./features/docentes/docentes')
            .then(m => m.Docentes)
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];