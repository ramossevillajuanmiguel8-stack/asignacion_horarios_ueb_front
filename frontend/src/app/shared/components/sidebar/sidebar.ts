import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  menu = [
    { nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard' },
    { nombre: 'Docentes', icono: 'people', ruta: '/docentes' },
    { nombre: 'Asignaturas', icono: 'menu_book', ruta: '/asignaturas' },
    { nombre: 'Aulas', icono: 'meeting_room', ruta: '/aulas' },
    { nombre: 'Grupos', icono: 'groups', ruta: '/grupos' },
    { nombre: 'Horarios', icono: 'calendar_month', ruta: '/horarios' },
    { nombre: 'Asignación', icono: 'event_available', ruta: '/asignacion' },
    { nombre: 'Reportes', icono: 'assessment', ruta: '/reportes' }
  ];
}