import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  estadisticas = [
    { titulo: 'Docentes', valor: '—', icono: 'people' },
    { titulo: 'Asignaturas', valor: '—', icono: 'menu_book' },
    { titulo: 'Aulas', valor: '—', icono: 'meeting_room' },
    { titulo: 'Grupos', valor: '—', icono: 'groups' }
  ];
}