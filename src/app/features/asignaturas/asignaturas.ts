import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Curso } from '../../models/curso.model';
import { CursosService } from '../../services/cursos';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './asignaturas.html',
  styleUrl: './asignaturas.scss'
})
export class Asignaturas implements OnInit {

  private cursosService = inject(CursosService);
  private dialog = inject(MatDialog);

  cursos = signal<Curso[]>([]);
  filtro = signal('');
  cargando = signal(false);
  error = signal('');

  columnas = [
    'codigo',
    'nombre',
    'sesionesSemanales',
    'duracionSesionMin',
    'necesitaAulaEspecial'
  ];

  cursosFiltrados = computed(() => {
    const busqueda = this.filtro().trim().toLowerCase();

    return this.cursos().filter(curso =>
      curso.nombre.toLowerCase().includes(busqueda) ||
      (curso.codigo ?? '').toLowerCase().includes(busqueda)
    );
  });

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.cursosService.listar().subscribe({
      next: datos => {
        this.cursos.set(datos);
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando cursos:', err);
        this.error.set(
          'No se pudieron cargar las asignaturas.'
        );
        this.cargando.set(false);
      }
    });
  }

  async abrirFormulario(): Promise<void> {
    const { FormCurso } = await import(
      './form-curso/form-curso'
    );

    const referencia = this.dialog.open(FormCurso, {
      width: '650px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true
    });

    referencia.afterClosed().subscribe(resultado => {
      if (resultado?.id) {
        this.cargarCursos();
      }
    });
  }
}