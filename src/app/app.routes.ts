import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/auth/login/login';
import { perfilGuard, vistaPreviaGuard } from './core/perfiles/perfil.guard';

const OPERADORES = ['COMITE_TACTICO', 'COORDINACION_ACADEMICA'] as const;

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'consulta-publica',
    loadComponent: () => import('./features/perfiles/consulta-publica/consulta-publica')
      .then(m => m.ConsultaPublica)
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [vistaPreviaGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard, canActivate: [perfilGuard], data: { roles: OPERADORES } },
      {
        path: 'docentes', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/docentes/docentes').then(m => m.Docentes)
      },
      {
        path: 'asignaturas', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/asignaturas/asignaturas').then(m => m.Asignaturas)
      },
      {
        path: 'periodos', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/periodos/periodos').then(m => m.Periodos)
      },
      {
        path: 'grupos', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/grupos/grupos').then(m => m.Grupos)
      },
      {
        path: 'horarios', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/horarios/horarios').then(m => m.Horarios)
      },
      {
        path: 'aprobacion', canActivate: [perfilGuard], data: { roles: ['COMITE_TACTICO'] },
        loadComponent: () => import('./features/perfiles/aprobacion/aprobacion').then(m => m.Aprobacion)
      },
      {
        path: 'mi-horario', canActivate: [perfilGuard], data: { roles: ['DOCENTE'] },
        loadComponent: () => import('./features/perfiles/mi-horario/mi-horario').then(m => m.MiHorario)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
