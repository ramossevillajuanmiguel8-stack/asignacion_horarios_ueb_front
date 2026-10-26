import { Component, inject, signal, computed } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PeriodoAcademico } from '../../../models/periodo.model';
import { Docente } from '../../../models/docente.model';
import { Curso } from '../../../models/curso.model';
import { CrearGrupoRequest } from '../../../models/grupo.model';
import { GruposService } from '../../../services/grupos';
import { DestroyRef } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  of,
  switchMap,
  catchError,
  distinctUntilChanged,
  startWith
} from 'rxjs';

import { DocenteHabilitado } from '../../../models/docente.model';

import { DocentesService } from '../../../services/docentes';

interface DatosFormulario {
  periodo: PeriodoAcademico;
  docentes: Docente[];
  cursos: Curso[];
}

@Component({
  selector: 'app-form-grupo',
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
  templateUrl: './form-grupo.html',
  styleUrl: './form-grupo.scss'
})
export class FormGrupo {
  constructor() {

    this.formulario.controls.cursoId.valueChanges
      .pipe(
        startWith(this.formulario.controls.cursoId.value),

        distinctUntilChanged(),

        switchMap(cursoId => {

          // Limpiar el docente anterior
          this.formulario.controls.docenteId.setValue(0);

          this.docentesHabilitados.set([]);
          this.errorDocentes.set('');

          this.formulario.controls.docenteId.disable({
            emitEvent: false
          });

          if (!cursoId || cursoId <= 0) {
            this.cursoSeleccionado.set(null);
            this.cargandoDocentes.set(false);

            return of(null);
          }

          this.cursoSeleccionado.set(cursoId);
          this.cargandoDocentes.set(true);

          return this.docentesService
            .listarHabilitadosPorCurso(cursoId)
            .pipe(
              catchError(err => {
                console.error(
                  'Error cargando docentes habilitados:',
                  err
                );

                this.errorDocentes.set(
                  'No fue posible consultar los docentes habilitados.'
                );

                return of(null);
              })
            );
        }),

        takeUntilDestroyed(this.destroyRef)

      )
      .subscribe(docentes => {

        this.docentesHabilitados.set(docentes ?? []);
        this.cargandoDocentes.set(false);
        
        if (docentes && docentes.length > 0) {
          this.formulario.controls.docenteId.enable({
            emitEvent: false
          });
        } else {
          this.formulario.controls.docenteId.disable({
            emitEvent: false
          });
        }

      });

  }

  private fb = inject(FormBuilder);
  private gruposService = inject(GruposService);
  private dialogRef = inject(MatDialogRef<FormGrupo>);
  private docentesService = inject(DocentesService);
  private destroyRef = inject(DestroyRef);

  docentesHabilitados = signal<DocenteHabilitado[]>([]);

  cargandoDocentes = signal(false);

  errorDocentes = signal('');

  cursoSeleccionado = signal<number | null>(null);
  datos = inject<DatosFormulario>(MAT_DIALOG_DATA);

  guardando = signal(false);
  error = signal('');

  personalizarCupos = signal(false);

  cursosCompatibles = this.datos.cursos.filter(curso =>
    curso.duracionSesionMin ===
    this.datos.periodo.duracionBloqueMin &&
    curso.sesionesSemanales <=
    this.datos.periodo.maxSesionesSemana
  );

  formulario = this.fb.nonNullable.group({
    cursoId: [0, [Validators.required, Validators.min(1)]],
    docenteId: [0, [Validators.required, Validators.min(1)]],
    codigo: ['', [
      Validators.required,
      Validators.maxLength(10)
    ]],
    inscritos: [0, [
      Validators.required,
      Validators.min(0),
      Validators.max(32767)
    ]],
    cupoMaximo: [
      this.datos.periodo.cupoMaximoBase,
      [Validators.required, Validators.min(1), Validators.max(32767)]
    ],
    cupoMinimo: [
      this.datos.periodo.cupoMinimo,
      [Validators.required, Validators.min(0), Validators.max(32767)]
    ]
  });

  limiteOperativo = computed(() => {
    const max = this.personalizarCupos()
      ? this.formulario.controls.cupoMaximo.value
      : this.datos.periodo.cupoMaximoBase;

    return Math.floor(
      max * (
        1 + this.datos.periodo.toleranciaCupoPct / 100
      )
    );
  });

  cambiarCupos(valor: boolean): void {
    this.personalizarCupos.set(valor);

    if (!valor) {
      this.formulario.patchValue({
        cupoMaximo: this.datos.periodo.cupoMaximoBase,
        cupoMinimo: this.datos.periodo.cupoMinimo
      });
    }
  }

  cancelar(): void {
    if (!this.guardando()) {
      this.dialogRef.close();
    }
  }

  guardar(): void {
    if (this.guardando()) return;

    this.error.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Completa correctamente los campos.');
      return;
    }

    const datos = this.formulario.getRawValue();
    const codigo = datos.codigo.trim();

    if (!codigo) {
      this.error.set('El código del grupo es obligatorio.');
      return;
    }

    if (!this.cursosCompatibles.some(c => c.id === datos.cursoId)) {
      this.error.set(
        'La asignatura no es compatible con los parámetros del período.'
      );
      return;
    }

    if (this.cargandoDocentes() || this.errorDocentes()) {
      this.error.set(
        'Debes esperar a que carguen los docentes habilitados.'
      );
      return;
    }

    const docenteHabilitado = this.docentesHabilitados()
      .some(d => d.id === datos.docenteId);

    if (!docenteHabilitado) {
      this.error.set(
        'El docente seleccionado no está habilitado para impartir esta asignatura.'
      );
      return;
    }

    const max = this.personalizarCupos()
      ? datos.cupoMaximo
      : this.datos.periodo.cupoMaximoBase;

    const min = this.personalizarCupos()
      ? datos.cupoMinimo
      : this.datos.periodo.cupoMinimo;

    if (min > max) {
      this.error.set(
        'El cupo mínimo no puede superar el cupo máximo.'
      );
      return;
    }

    const limite = Math.floor(
      max * (1 + this.datos.periodo.toleranciaCupoPct / 100)
    );

    if (datos.inscritos > limite) {
      this.error.set(
        `Los inscritos no pueden superar el límite operativo (${limite}).`
      );
      return;
    }

    const peticion: CrearGrupoRequest = {
      periodoId: this.datos.periodo.id,
      cursoId: datos.cursoId,
      docenteId: datos.docenteId,
      codigo,
      inscritos: datos.inscritos,
      cupoMaximo: this.personalizarCupos() ? max : null,
      cupoMinimo: this.personalizarCupos() ? min : null
    };

    this.guardando.set(true);

    this.gruposService.crear(peticion).subscribe({
      next: grupo => {
        this.guardando.set(false);
        this.dialogRef.close(grupo);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error registrando grupo:', err);

        const mensaje =
          err.error?.detail ?? err.error?.message;

        this.error.set(
          typeof mensaje === 'string' && mensaje.trim()
            ? mensaje
            : 'No fue posible registrar el grupo.'
        );

        this.guardando.set(false);
      }
    });
  }
}