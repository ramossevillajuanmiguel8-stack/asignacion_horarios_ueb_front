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

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PeriodosService } from '../../../services/periodos';
import { CrearPeriodoRequest } from '../../../models/periodo.model';

@Component({
  selector: 'app-form-periodo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-periodo.html',
  styleUrl: './form-periodo.scss'
})
export class FormPeriodo {

  private fb = inject(FormBuilder);
  private periodosService = inject(PeriodosService);
  private dialogRef = inject(MatDialogRef<FormPeriodo>);

  guardando = signal(false);
  error = signal('');

  formulario = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.maxLength(20)
    ]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required]
  });

  cancelar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.guardando()) {
      return;
    }

    this.error.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();
    const nombre = datos.nombre.trim();

    if (!nombre) {
      this.error.set('El nombre del período es obligatorio.');
      return;
    }

    if (datos.fechaInicio >= datos.fechaFin) {
      this.error.set(
        'La fecha de inicio debe ser anterior a la fecha de fin.'
      );
      return;
    }

    const peticion: CrearPeriodoRequest = {
      nombre,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin
    };

    this.guardando.set(true);

    this.periodosService.crear(peticion).subscribe({
      next: periodo => {
        this.guardando.set(false);
        this.dialogRef.close(periodo);
      },

      error: (err: HttpErrorResponse) => {
        console.error('Error registrando período:', err);

        this.error.set(
          typeof err.error?.detail === 'string'
            ? err.error.detail
            : 'No fue posible registrar el período académico.'
        );

        this.guardando.set(false);
      }
    });
  }
}