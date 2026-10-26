import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Docente } from '../../../models/docente.model';
import { Curso } from '../../../models/curso.model';

import { DocentesService } from '../../../services/docentes';
import { CursosService } from '../../../services/cursos';

@Component({
  selector: 'app-cursos-habilitados',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cursos-habilitados.html',
  styleUrl: './cursos-habilitados.scss'
})
export class CursosHabilitados implements OnInit {

  private docentesService = inject(DocentesService);
  private cursosService = inject(CursosService);

  private dialogRef = inject(
    MatDialogRef<CursosHabilitados>
  );

  docente = inject<Docente>(MAT_DIALOG_DATA);

  cursos = signal<Curso[]>([]);
  seleccionados = signal<Set<number>>(new Set());

  filtro = signal('');
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  cursosFiltrados = computed(() => {

    const busqueda = this.filtro()
      .trim()
      .toLowerCase();

    return this.cursos().filter(curso =>
      curso.nombre.toLowerCase().includes(busqueda) ||
      (curso.codigo ?? '')
        .toLowerCase()
        .includes(busqueda)
    );

  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {

    this.cargando.set(true);
    this.error.set('');

    forkJoin({
      cursos: this.cursosService.listar(),
      habilitados: this.docentesService
        .obtenerCursosHabilitados(this.docente.id)
    }).subscribe({

      next: datos => {

        this.cursos.set(datos.cursos);

        this.seleccionados.set(
          new Set(datos.habilitados)
        );

        this.cargando.set(false);
      },

      error: err => {

        console.error(
          'Error cargando habilitaciones:',
          err
        );

        this.error.set(
          'No se pudieron cargar las asignaturas.'
        );

        this.cargando.set(false);
      }
    });
  }

  estaSeleccionado(cursoId: number): boolean {
    return this.seleccionados().has(cursoId);
  }

  cambiarSeleccion(
    cursoId: number,
    seleccionado: boolean
  ): void {

    const nuevos = new Set(this.seleccionados());

    if (seleccionado) {
      nuevos.add(cursoId);
    } else {
      nuevos.delete(cursoId);
    }

    this.seleccionados.set(nuevos);
  }

  guardar(): void {

    if (this.guardando() || this.cargando() || this.error()) {
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const ids = [...this.seleccionados()].sort(
      (a, b) => a - b
    );

    this.docentesService
      .actualizarCursosHabilitados(
        this.docente.id,
        ids
      )
      .subscribe({

        next: resultado => {
          this.guardando.set(false);
          this.dialogRef.close(resultado);
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Error guardando habilitaciones:',
            err
          );

          const mensaje =
            err.error?.detail ??
            err.error?.message;

          this.error.set(
            typeof mensaje === 'string' && mensaje.trim()
              ? mensaje
              : 'No fue posible guardar las asignaturas.'
          );

          this.guardando.set(false);
        }
      });
  }

  cerrar(): void {
    if (!this.guardando()) {
      this.dialogRef.close();
    }
  }
}