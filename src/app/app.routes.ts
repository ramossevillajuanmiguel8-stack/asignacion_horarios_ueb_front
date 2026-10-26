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
      },
      {
        path: 'asignaturas',
        loadComponent: () =>
          import('./features/asignaturas/asignaturas')
            .then(m => m.Asignaturas)
      },
      {
        path: 'periodos',
        loadComponent: () =>
          import('./features/periodos/periodos')
            .then(m => m.Periodos)
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./features/grupos/grupos')
            .then(m => m.Grupos)
      },
      {
        path: 'horarios',
        loadComponent: () =>
          import('./features/horarios/horarios')
            .then(m => m.Horarios)
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];