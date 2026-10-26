import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';



import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PeriodoAcademico } from '../../models/periodo.model';

import {
  Horario,
  ResultadoGeneracion
} from '../../models/horario.model';

import { PeriodosService } from '../../services/periodos';
import { HorariosService } from '../../services/horarios';

import { finalize } from 'rxjs';
import { DatePipe, JsonPipe } from '@angular/common';
@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [
    DatePipe,
    JsonPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss'
})
export class Horarios implements OnInit {

  private periodosService = inject(PeriodosService);
  private horariosService = inject(HorariosService);
  private dialog = inject(MatDialog);

  periodos = signal<PeriodoAcademico[]>([]);
  historial = signal<Horario[]>([]);

  periodoSeleccionado = signal<number | null>(null);
  horarioSeleccionado = signal<Horario | null>(null);

  cargando = signal(false);
  generando = signal(false);
  error = signal('');

  resultadoGeneracion = signal<ResultadoGeneracion | null>(null);

  validando = signal(false);

  resultadoValidacion = signal<unknown | null>(null);

  errorValidacion = signal('');


  sesionesOrdenadas = computed(() => {
    const horario = this.horarioSeleccionado();

    if (!horario) return [];

    return [...horario.sesiones].sort(
      (a, b) =>
        a.dia - b.dia ||
        a.horaInicio.localeCompare(b.horaInicio)
    );
  });

  diasSemana = [
    { numero: 1, nombre: 'Lunes' },
    { numero: 2, nombre: 'Martes' },
    { numero: 3, nombre: 'Miércoles' },
    { numero: 4, nombre: 'Jueves' },
    { numero: 5, nombre: 'Viernes' },
    { numero: 6, nombre: 'Sábado' }
  ];

  sesionesPorDia = computed(() => {

    const sesiones = this.sesionesOrdenadas();

    return this.diasSemana.map(dia => ({
      ...dia,

      sesiones: sesiones.filter(
        sesion => sesion.dia === dia.numero
      )
    }));

  });


  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.periodosService.listar().subscribe({
      next: periodos => {
        this.periodos.set(periodos);

        const seleccionado = this.periodoSeleccionado();

        if (
          seleccionado !== null &&
          periodos.some(p => p.id === seleccionado)
        ) {
          this.cargarHistorial(seleccionado);
        } else if (periodos.length > 0) {
          this.seleccionarPeriodo(periodos[0].id);
        } else {
          this.periodoSeleccionado.set(null);
          this.historial.set([]);
          this.horarioSeleccionado.set(null);
          this.cargando.set(false);
        }
      },
      error: err => {
        console.error('Error consultando períodos:', err);
        this.error.set(
          'No se pudieron consultar los períodos académicos.'
        );
        this.cargando.set(false);
      }
    });
  }

  seleccionarPeriodo(periodoId: number): void {
    this.resultadoValidacion.set(null);
    this.errorValidacion.set('');

    this.periodoSeleccionado.set(periodoId);
    this.horarioSeleccionado.set(null);
    this.resultadoGeneracion.set(null);

    this.cargarHistorial(periodoId);
  }

  cargarHistorial(
    periodoId: number,
    horarioPreferidoId?: number
  ): void {

    this.cargando.set(true);
    this.error.set('');

    this.horariosService.listarPorPeriodo(periodoId).subscribe({
      next: horarios => {
        if (this.periodoSeleccionado() !== periodoId) return;

        this.historial.set(horarios);

        const idActual =
          horarioPreferidoId ??
          this.horarioSeleccionado()?.id;

        const seleccionado =
          horarios.find(h => h.id === idActual) ??
          horarios[0] ??
          null;

        this.horarioSeleccionado.set(seleccionado);
        this.cargando.set(false);
      },

      error: err => {
        if (this.periodoSeleccionado() !== periodoId) return;

        console.error('Error consultando historial:', err);
        this.error.set(
          'No se pudo consultar el historial de horarios.'
        );
        this.cargando.set(false);
      }
    });
  }

  seleccionarHorario(id: number): void {
    const horario = this.historial().find(h => h.id === id);

    if (horario) {
      this.horarioSeleccionado.set(horario);
      this.resultadoGeneracion.set(null);
      this.resultadoValidacion.set(null);
      this.errorValidacion.set('');
    }
  }

  async confirmarGeneracion(): Promise<void> {
    const periodoId = this.periodoSeleccionado();

    if (periodoId === null || this.generando() || this.cargando()) {
      return;
    }

    const { ConfirmarGeneracion } = await import(
      './confirmar-generacion/confirmar-generacion'
    );

    const referencia = this.dialog.open(ConfirmarGeneracion, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        tieneHorarios: this.historial().length > 0
      }
    });

    referencia.afterClosed().subscribe(confirmado => {
      if (confirmado === true) {
        this.generarHorario(periodoId);
      }
    });
  }

  private generarHorario(periodoId: number): void {
    this.generando.set(true);
    this.error.set('');
    this.resultadoGeneracion.set(null);

    this.horariosService.generar(periodoId).subscribe({
      next: resultado => {
        this.generando.set(false);
        this.resultadoGeneracion.set(resultado);

        this.cargarHistorial(
          periodoId,
          resultado.horarioId
        );
      },

      error: err => {
        console.error('Error generando horario:', err);

        const mensaje =
          err.error?.detail ??
          err.error?.error;

        this.error.set(
          typeof mensaje === 'string' && mensaje.trim()
            ? mensaje
            : 'No fue posible generar el horario.'
        );

        this.generando.set(false);
      }
    });
  }

  nombreDia(dia: number): string {
    const dias: Record<number, string> = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado'
    };

    return dias[dia] ?? `Día ${dia}`;
  }

  formatHora(hora: string): string {
    return hora.substring(0, 5);
  }
  validarHorario(): void {

    const horario = this.horarioSeleccionado();

    if (!horario || this.validando() || this.generando()) {
      return;
    }

    this.validando.set(true);
    this.resultadoValidacion.set(null);
    this.errorValidacion.set('');

    this.horariosService.validar(horario.id)
      .pipe(
        finalize(() => this.validando.set(false))
      )
      .subscribe({

        next: resultado => {
          this.resultadoValidacion.set(resultado);
        },

        error: err => {

          console.error(
            'Error validando horario:',
            err
          );

          const mensaje =
            err.error?.detail ??
            err.error?.error ??
            err.error?.message;

          this.errorValidacion.set(
            typeof mensaje === 'string'
              ? mensaje
              : 'No fue posible validar el horario.'
          );
        }

      });
  }
}