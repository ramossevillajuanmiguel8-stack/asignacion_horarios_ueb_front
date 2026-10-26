import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CursosService } from '../../../services/cursos';
import { CrearCursoRequest } from '../../../models/curso.model';

@Component({
  selector: 'app-form-curso',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-curso.html',
  styleUrl: './form-curso.scss'
})
export class FormCurso {

  private fb = inject(FormBuilder);
  private cursosService = inject(CursosService);
  private dialogRef = inject(MatDialogRef<FormCurso>);

  guardando = signal(false);
  error = signal('');

  formulario = this.fb.nonNullable.group({
    codigo: ['', Validators.maxLength(20)],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    sesionesSemanales: [
      2,
      [Validators.required, Validators.min(1), Validators.max(10)]
    ],
    duracionSesionMin: [
      60,
      [Validators.required, Validators.min(30), Validators.max(240)]
    ],
    necesitaAulaEspecial: [false]
  });

  cancelar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.guardando()) return;

    this.error.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();

    const nombre = datos.nombre.trim();
    const codigo = datos.codigo.trim();

    if (!nombre) {
      this.error.set('El nombre de la asignatura es obligatorio.');
      return;
    }

    if (
      !Number.isInteger(datos.sesionesSemanales) ||
      !Number.isInteger(datos.duracionSesionMin)
    ) {
      this.error.set('Las sesiones y la duración deben ser números enteros.');
      return;
    }

    const peticion: CrearCursoRequest = {
      codigo: codigo || null,
      nombre,
      sesionesSemanales: datos.sesionesSemanales,
      duracionSesionMin: datos.duracionSesionMin,
      necesitaAulaEspecial: datos.necesitaAulaEspecial
    };

    this.guardando.set(true);

    this.cursosService.crear(peticion).subscribe({
      next: curso => {
        this.guardando.set(false);
        this.dialogRef.close(curso);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear curso:', err);

        this.guardando.set(false);

        this.error.set(
          typeof err.error?.detail === 'string'
            ? err.error.detail
            : 'No se pudo registrar la asignatura.'
        );
      }
    });
  }
}