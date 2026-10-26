import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Docente } from '../../models/docente.model';
import { DocentesService } from '../../services/docentes';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormDocente } from './form-docente/form-docente';

import { RestriccionesDocente } from './restricciones-docente/restricciones-docente';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-docentes',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './docentes.html',
  styleUrl: './docentes.scss'
})
export class Docentes implements OnInit {

  private docentesService = inject(DocentesService);
  private cdr = inject(ChangeDetectorRef);

  docentes: Docente[] = [];
  filtro = '';
  cargando = false;
  error = '';

  columnas = [
    'id',
    'nombre',
    'tipoVinculacion',
    'especialidades',
    'acciones'
  ];

  private dialog = inject(MatDialog);

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(FormDocente, {
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado && resultado.id) {
        this.cargarDocentes();
      }
    });
  }
  verRestricciones(docente: Docente): void {
    this.dialog.open(RestriccionesDocente, {
      width: '650px',
      maxWidth: '95vw',
      autoFocus: false,
      data: docente
    });
  }


  ngOnInit(): void {
    this.cargarDocentes();
  }

  cargarDocentes(): void {
    this.cargando = true;
    this.error = '';

    this.docentesService.listar().subscribe({

      next: (datos) => {
        this.docentes = datos;
        this.cargando = false;

        // Notificar a Angular que debe actualizar la vista
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('Error al cargar docentes:', err);

        this.error =
          'No se pudieron cargar los docentes. Verifica la conexión con el backend.';

        this.cargando = false;

        // Actualizar la vista después del error
        this.cdr.markForCheck();
      }

    });
  }

  get docentesFiltrados(): Docente[] {
    const busqueda = this.filtro.toLowerCase().trim();

    return this.docentes.filter(docente =>
      docente.nombre.toLowerCase().includes(busqueda) ||
      docente.tipoVinculacion.toLowerCase().includes(busqueda) ||
      (docente.especialidades ?? []).some(
        especialidad =>
          especialidad.toLowerCase().includes(busqueda)
      )
    );
  }

  async administrarCursos(docente: Docente): Promise<void> {

    const { CursosHabilitados } = await import(
      './cursos-habilitados/cursos-habilitados'
    );

    this.dialog.open(CursosHabilitados, {
      width: '680px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data: docente
    });
  }

}