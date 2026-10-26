import { Component, OnInit, inject, signal } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  PeriodoAcademico,
  ParametrosPeriodoRequest
} from '../../../models/periodo.model';

import { PeriodosService } from '../../../services/periodos';

@Component({
  selector: 'app-editar-parametros',
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
  templateUrl: './editar-parametros.html',
  styleUrl: './editar-parametros.scss'
})
export class EditarParametros implements OnInit {

  private fb = inject(FormBuilder);
  private periodosService = inject(PeriodosService);

  private dialogRef = inject(
    MatDialogRef<EditarParametros>
  );

  periodo = inject<PeriodoAcademico>(MAT_DIALOG_DATA);

  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');

  formulario = this.fb.nonNullable.group({

    horaInicioSemana: ['', Validators.required],
    horaFinSemana: ['', Validators.required],

    horaInicioSabado: ['', Validators.required],
    horaFinSabado: ['', Validators.required],

    almuerzoInicio: ['', Validators.required],
    almuerzoFin: ['', Validators.required],

    duracionBloqueMin: [
      120,
      [
        Validators.required,
        Validators.min(30),
        Validators.max(240)
      ]
    ],

    maxSesionesSemana: [
      4,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(10)
      ]
    ],

    cupoMaximoBase: [
      40,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(32767)
      ]
    ],

    cupoMinimo: [
      10,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(32767)
      ]
    ],

    toleranciaCupoPct: [
      10,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(100)
      ]
    ]

  });

  ngOnInit(): void {
    this.cargarParametros();
  }

  cargarParametros(): void {
    this.cargando.set(true);
    this.error.set('');

    this.periodosService.obtener(this.periodo.id).subscribe({

      next: datos => {

        this.periodo = datos;

        this.formulario.patchValue({

          horaInicioSemana:
            this.normalizarHora(datos.horaInicioSemana),

          horaFinSemana:
            this.normalizarHora(datos.horaFinSemana),

          horaInicioSabado:
            this.normalizarHora(datos.horaInicioSabado),

          horaFinSabado:
            this.normalizarHora(datos.horaFinSabado),

          almuerzoInicio:
            this.normalizarHora(datos.almuerzoInicio),

          almuerzoFin:
            this.normalizarHora(datos.almuerzoFin),

          duracionBloqueMin: datos.duracionBloqueMin,
          maxSesionesSemana: datos.maxSesionesSemana,
          cupoMaximoBase: datos.cupoMaximoBase,
          cupoMinimo: datos.cupoMinimo,
          toleranciaCupoPct: datos.toleranciaCupoPct

        });

        this.cargando.set(false);
      },

      error: err => {
        console.error('Error cargando parámetros:', err);

        this.error.set(
          'No se pudieron consultar los parámetros del período.'
        );

        this.cargando.set(false);
      }

    });
  }

  private normalizarHora(hora: string): string {
    return hora?.substring(0, 5) ?? '';
  }

  guardar(): void {

    if (this.guardando() || this.cargando()) {
      return;
    }

    this.error.set('');
    this.exito.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revisa los campos del formulario.');
      return;
    }

    const datos = this.formulario.getRawValue();

    if (
      datos.horaInicioSemana >= datos.horaFinSemana ||
      datos.horaInicioSabado >= datos.horaFinSabado ||
      datos.almuerzoInicio >= datos.almuerzoFin
    ) {
      this.error.set(
        'Las horas de inicio deben ser anteriores a las horas de finalización.'
      );
      return;
    }

    if (datos.cupoMinimo > datos.cupoMaximoBase) {
      this.error.set(
        'El cupo mínimo no puede superar el cupo máximo.'
      );
      return;
    }

    const camposEnteros = [
      datos.duracionBloqueMin,
      datos.maxSesionesSemana,
      datos.cupoMaximoBase,
      datos.cupoMinimo
    ];

    if (!camposEnteros.every(Number.isInteger)) {
      this.error.set(
        'La duración, sesiones y cupos deben ser números enteros.'
      );
      return;
    }

    const peticion: ParametrosPeriodoRequest = {
      horaInicioSemana: datos.horaInicioSemana,
      horaFinSemana: datos.horaFinSemana,
      horaInicioSabado: datos.horaInicioSabado,
      horaFinSabado: datos.horaFinSabado,
      almuerzoInicio: datos.almuerzoInicio,
      almuerzoFin: datos.almuerzoFin,
      duracionBloqueMin: datos.duracionBloqueMin,
      maxSesionesSemana: datos.maxSesionesSemana,
      cupoMaximoBase: datos.cupoMaximoBase,
      cupoMinimo: datos.cupoMinimo,
      toleranciaCupoPct: datos.toleranciaCupoPct
    };

    this.guardando.set(true);

    this.periodosService
      .actualizarParametros(this.periodo.id, peticion)
      .subscribe({

        next: periodoActualizado => {

          this.guardando.set(false);
          this.exito.set('Parámetros actualizados correctamente.');

          this.dialogRef.close(periodoActualizado);
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Error actualizando parámetros:',
            err
          );

          const mensaje =
            err.error?.detail ??
            err.error?.message ??
            (typeof err.error === 'string'
              ? err.error
              : null);

          this.error.set(
            typeof mensaje === 'string' && mensaje.trim()
              ? mensaje
              : 'No fue posible actualizar los parámetros.'
          );

          this.guardando.set(false);
        }

      });
  }

  cancelar(): void {
    if (!this.guardando()) {
      this.dialogRef.close();
    }
  }
}