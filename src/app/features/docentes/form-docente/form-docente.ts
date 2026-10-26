import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
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
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  CrearDocenteRequest,
  RestriccionHoraria,
  TipoVinculacion,
  TipoRestriccion,
  SentidoRestriccion
} from '../../../models/docente.model';

import { DocentesService } from '../../../services/docentes';

@Component({
  selector: 'app-form-docente',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-docente.html',
  styleUrl: './form-docente.scss'
})
export class FormDocente {

  private fb = inject(FormBuilder);
  private docentesService = inject(DocentesService);
  private dialogRef = inject(MatDialogRef<FormDocente>);

  guardando = signal(false);
  error = signal('');

  vinculaciones: {
    valor: TipoVinculacion;
    nombre: string;
  }[] = [
    { valor: 'TC', nombre: 'Tiempo completo' },
    { valor: 'TRES_CUARTOS', nombre: 'Tres cuartos de tiempo' },
    { valor: 'MEDIO_TIEMPO', nombre: 'Medio tiempo' },
    { valor: 'CUARTO_TIEMPO', nombre: 'Cuarto de tiempo' }
  ];

  dias = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' }
  ];

  tipos: { valor: TipoRestriccion; nombre: string }[] = [
    { valor: 'FIRME', nombre: 'Firme' },
    { valor: 'PREFERENCIA', nombre: 'Preferencia' }
  ];

  sentidos: { valor: SentidoRestriccion; nombre: string }[] = [
    { valor: 'DISPONIBLE', nombre: 'Disponible' },
    { valor: 'NO_DISPONIBLE', nombre: 'No disponible' }
  ];

  formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    tipoVinculacion: ['TC' as TipoVinculacion, Validators.required],
    especialidades: [''],
    sinRestricciones: [true],
    restricciones: this.fb.array([
    ])
  });

  get restricciones(): FormArray {
    return this.formulario.controls.restricciones;
  }

  crearRestriccion() {
    return this.fb.nonNullable.group({
      dia: [1, [Validators.required, Validators.min(1), Validators.max(6)]],
      horaInicio: ['08:00', Validators.required],
      horaFin: ['10:00', Validators.required],
      tipo: ['FIRME' as TipoRestriccion, Validators.required],
      sentido: ['NO_DISPONIBLE' as SentidoRestriccion, Validators.required]
    });
  }

  cambiarSinRestricciones(valor: boolean): void {
    if (valor) {
      this.restricciones.clear();
    } else if (this.restricciones.length === 0) {
      this.agregarRestriccion();
    }
  }

  agregarRestriccion(): void {
    this.restricciones.push(this.crearRestriccion());
  }

  eliminarRestriccion(indice: number): void {
    this.restricciones.removeAt(indice);
  }

  cancelar(): void {
    this.dialogRef.close(false);
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
      this.error.set('El nombre no puede estar vacío.');
      return;
    }

    if (!datos.sinRestricciones && datos.restricciones.length === 0) {
      this.error.set('Agrega al menos una restricción horaria.');
      return;
    }

    const restricciones: RestriccionHoraria[] =
      datos.restricciones as RestriccionHoraria[];

    for (const restriccion of restricciones) {
      if (restriccion.horaInicio >= restriccion.horaFin) {
        this.error.set(
          'La hora de inicio debe ser anterior a la hora de fin.'
        );
        return;
      }
    }

    const especialidades = [
      ...new Set(
        datos.especialidades
          .split(',')
          .map(valor => valor.trim())
          .filter(valor => valor.length > 0)
      )
    ];

    if (especialidades.some(valor => valor.length > 100)) {
      this.error.set(
        'Cada especialidad debe tener máximo 100 caracteres.'
      );
      return;
    }

    const peticion: CrearDocenteRequest = {
      nombre,
      tipoVinculacion: datos.tipoVinculacion,
      especialidades,
      sinRestricciones: datos.sinRestricciones,
      restricciones: datos.sinRestricciones ? [] : restricciones
    };

    this.guardando.set(true);

    this.docentesService.crear(peticion).subscribe({
      next: (docente) => {
        this.guardando.set(false);
        this.dialogRef.close(docente);
      },

      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);

        console.error('Error al registrar docente:', err);

        this.error.set(
          typeof err.error?.detail === 'string'
            ? err.error.detail
            : 'No fue posible registrar el docente.'
        );
      }
    });
  }
}