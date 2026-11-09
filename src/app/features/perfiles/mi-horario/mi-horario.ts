import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Horario, SesionHorario } from '../../../models/horario.model';
import { HorariosService, PeriodoPublicadoDocente } from '../../../services/horarios';

@Component({
  selector: 'app-mi-horario', standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <section class="panel">
      <h1><mat-icon>event</mat-icon> Mi horario publicado</h1>
      <p>Solo se consulta el horario del docente autenticado en el servidor.</p>
      <mat-card><mat-card-content>
        <div class="filtros">
          <mat-form-field appearance="outline">
            <mat-label>Período académico</mat-label>
            <mat-select [(ngModel)]="periodoEntrada" [disabled]="cargandoPeriodos() || cargando()"
              (selectionChange)="limpiarConsulta()">
              @for (periodo of periodos(); track periodo.id) {
                <mat-option [value]="periodo.id">{{ periodo.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-flat-button [disabled]="cargando() || cargandoPeriodos() || periodoEntrada === null"
            (click)="consultar()">
            <mat-icon>search</mat-icon> Consultar mi horario
          </button>
        </div>
        @if (cargandoPeriodos()) {
          <p>Cargando períodos publicados...</p>
          <mat-spinner diameter="30" aria-label="Cargando períodos"></mat-spinner>
        }
        @if (errorPeriodos()) {
          <p class="error" role="alert">{{ errorPeriodos() }}</p>
          <button mat-button [disabled]="cargandoPeriodos()" (click)="cargarPeriodos()">
            Reintentar
          </button>
        }
        @if (!cargandoPeriodos() && !errorPeriodos() && periodos().length === 0) {
          <p>No tienes períodos con sesiones publicadas disponibles.</p>
        }
        @if (cargando()) { <mat-spinner diameter="30" aria-label="Consultando horario"></mat-spinner> }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @if (consultado()) {
          <p>{{ sesiones().length }} sesión(es) publicadas para este docente en el período.</p>
          <div class="tabla"><table>
            <thead><tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Curso</th><th>Grupo</th></tr></thead>
            <tbody>
              @for (sesion of sesionesOrdenadas(); track sesion.id) {
                <tr><td>{{ nombreDia(sesion.dia) }}</td><td>{{ sesion.horaInicio.slice(0,5) }}</td>
                  <td>{{ sesion.horaFin.slice(0,5) }}</td><td>{{ sesion.curso }}</td>
                  <td>{{ sesion.grupo }}</td></tr>
              } @empty { <tr><td colspan="5">No hay sesiones publicadas.</td></tr> }
            </tbody>
          </table></div>
        }
      </mat-card-content></mat-card>
    </section>
  `,
  styles: [`
    .panel{background:white;padding:28px;border-radius:12px;max-width:1050px}
    h1{display:flex;align-items:center;gap:10px;color:#004040}
    .filtros{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-top:12px}
    .filtros mat-form-field{min-width:230px}.filtros button{margin-bottom:18px}
    .error{padding:12px;background:#ffeded;color:#982222;border-radius:8px}
    .tabla{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:560px}
    th,td{text-align:left;padding:13px;border-bottom:1px solid #e6eeee}
    th{background:#f0f7f4}
  `]
})
export class MiHorario implements OnInit {
  private readonly horarios = inject(HorariosService);
  periodoEntrada: number | null = null;
  readonly periodos = signal<PeriodoPublicadoDocente[]>([]);
  readonly cargandoPeriodos = signal(false);
  readonly errorPeriodos = signal('');
  readonly sesiones = signal<SesionHorario[]>([]);
  readonly cargando = signal(false);
  readonly consultado = signal(false);
  readonly error = signal('');
  readonly sesionesOrdenadas = computed(() => [...this.sesiones()].sort((a, b) =>
    a.dia - b.dia || a.horaInicio.localeCompare(b.horaInicio)));

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    if (this.cargandoPeriodos()) return;
    this.cargandoPeriodos.set(true);
    this.errorPeriodos.set('');
    this.periodos.set([]);
    this.periodoEntrada = null;
    this.limpiarConsulta();
    this.horarios.listarPeriodosPublicadosDocente()
      .pipe(finalize(() => this.cargandoPeriodos.set(false)))
      .subscribe({
        next: periodos => {
          this.periodos.set(periodos);
          if (periodos.length === 1) this.periodoEntrada = periodos[0].id;
        },
        error: (err: HttpErrorResponse) => this.errorPeriodos.set(err.status === 401
          ? 'Tu sesión ha caducado. Inicia sesión nuevamente.'
          : err.status === 403
            ? 'Tu usuario no tiene permiso para consultar los períodos del docente.'
            : 'No fue posible cargar los períodos académicos.')
      });
  }

  limpiarConsulta(): void {
    this.consultado.set(false);
    this.error.set('');
    this.sesiones.set([]);
  }

  consultar(): void {
    const id = Number(this.periodoEntrada);
    if (!Number.isInteger(id) || id <= 0 || !this.periodos().some(p => p.id === id)) {
      this.error.set('Selecciona un período académico disponible.');
      return;
    }
    if (this.cargando() || this.cargandoPeriodos()) return;
    this.cargando.set(true);
    this.limpiarConsulta();
    this.horarios.obtenerHorarioDocente(id).pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.sesiones.set(Array.isArray(respuesta) ? respuesta : (respuesta as Horario).sesiones ?? []);
          this.consultado.set(true);
        },
        error: (err: HttpErrorResponse) => this.error.set(err.status === 404
          ? 'El docente no tiene horario publicado en este período.'
          : err.status === 401
            ? 'Tu sesión ha caducado. Inicia sesión nuevamente.'
            : 'No fue posible consultar tu horario.')
      });
  }

  nombreDia(dia: number): string {
    const nombres: Record<number, string> = {1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado'};
    return nombres[dia] ?? `Día ${dia}`;
  }
}
