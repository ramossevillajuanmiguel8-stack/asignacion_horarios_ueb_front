import { Routes } from '@angular/router';

import { perfilGuard, sesionGuard } from './core/perfiles/perfil.guard';

const OPERADORES = ['COMITE_TACTICO', 'COORDINACION_ACADEMICA'] as const;

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'consulta-publica',
    loadComponent: () => import('./features/perfiles/consulta-publica/consulta-publica')
      .then(m => m.ConsultaPublica)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivateChild: [sesionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
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
      { path: 'aulas', canActivate: [perfilGuard], data: { roles: OPERADORES },
        loadComponent: () => import('./features/aulas/aulas').then(m => m.Aulas) },
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
