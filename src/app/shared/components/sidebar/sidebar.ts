import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RolInterno } from '../../../core/perfiles/perfiles';
import { AuthApiService } from '../../../services/auth-api';

interface ItemMenu {
  nombre: string;
  icono: string;
  ruta: string;
  roles: readonly RolInterno[];
}

const OPERADORES = ['COMITE_TACTICO', 'COORDINACION_ACADEMICA'] as const;
const MENU: ItemMenu[] = [
  { nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard', roles: OPERADORES },
  { nombre: 'Docentes', icono: 'people', ruta: '/docentes', roles: OPERADORES },
  { nombre: 'Asignaturas', icono: 'menu_book', ruta: '/asignaturas', roles: OPERADORES },
  { nombre: 'Períodos', icono: 'date_range', ruta: '/periodos', roles: OPERADORES },
  { nombre: 'Grupos', icono: 'groups', ruta: '/grupos', roles: OPERADORES },
  { nombre: 'Aulas', icono: 'meeting_room', ruta: '/aulas', roles: OPERADORES },
  { nombre: 'Horarios', icono: 'calendar_month', ruta: '/horarios', roles: OPERADORES },
  { nombre: 'Aprobación y cierre', icono: 'fact_check', ruta: '/aprobacion', roles: ['COMITE_TACTICO'] },
  { nombre: 'Mi horario', icono: 'event', ruta: '/mi-horario', roles: ['DOCENTE'] }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  private readonly sesion = inject(AuthApiService);
  readonly menu = computed(() => {
    const rol = this.sesion.rol() as RolInterno | null;
    return rol ? MENU.filter(item => item.roles.includes(rol)) : [];
  });
}
