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
import { construirSemanaDocente } from './mi-horario-calendario';

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
          <div class="resultado-cabecera">
            <p>{{ sesiones().length }} sesión(es) publicadas para este docente en el período.</p>
            @if (sesiones().length) {
              <div class="selector-vista" role="group" aria-label="Vista del horario">
                <button mat-stroked-button type="button" [class.activo]="vista() === 'semana'"
                  [attr.aria-pressed]="vista() === 'semana'" (click)="vista.set('semana')">
                  <mat-icon>calendar_view_week</mat-icon> Semanal
                </button>
                <button mat-stroked-button type="button" [class.activo]="vista() === 'tabla'"
                  [attr.aria-pressed]="vista() === 'tabla'" (click)="vista.set('tabla')">
                  <mat-icon>table_rows</mat-icon> Tabla
                </button>
              </div>
            }
          </div>
          @if (vista() === 'semana' && sesiones().length) {
            <p class="modo-consulta"><mat-icon>lock_outline</mat-icon> Vista de solo lectura: no se pueden mover sesiones.</p>
            @if (calendario().noGraficadas) {
              <p class="aviso" role="status">
                {{ calendario().noGraficadas }} sesión(es) no se pueden representar en la cuadrícula.
                Consúltalas en la vista Tabla.
              </p>
            }
            @if (calendario().horas.length) {
              <div class="calendario-scroll" role="region" aria-label="Horario semanal, desplazamiento horizontal" tabindex="0">
                <div class="calendario-semanal">
                  <div class="encabezado-hora">Hora</div>
                  @for (dia of calendario().dias; track dia.numero) {
                    <div class="encabezado-dia">{{ dia.nombre }}</div>
                  }
                  <div class="eje-horas" [style.height.px]="calendario().altura">
                    @for (hora of calendario().horas; track hora) {
                      <div class="etiqueta-hora">{{ hora }}</div>
                    }
                  </div>
                  @for (dia of calendario().dias; track dia.numero) {
                    <div class="columna-dia" [style.height.px]="calendario().altura">
                      @for (evento of dia.eventos; track evento.sesion.id) {
                        <article class="evento" [class.compacto]="evento.compacto"
                          [style.top.px]="evento.top" [style.height.px]="evento.alto"
                          [style.left.%]="evento.izquierda" [style.width.%]="evento.ancho"
                          [attr.aria-label]="evento.sesion.curso + ', grupo ' + evento.sesion.grupo + ', de ' + evento.sesion.horaInicio.slice(0,5) + ' a ' + evento.sesion.horaFin.slice(0,5)"
                          [title]="evento.sesion.curso + ' · ' + evento.sesion.horaInicio.slice(0,5) + '–' + evento.sesion.horaFin.slice(0,5) + ' · Grupo ' + evento.sesion.grupo">
                          <strong>{{ evento.sesion.curso }}</strong>
                          <span>{{ evento.sesion.horaInicio.slice(0,5) }}–{{ evento.sesion.horaFin.slice(0,5) }}</span>
                          @if (!evento.compacto) { <small>Grupo {{ evento.sesion.grupo }}</small> }
                        </article>
                      }
                    </div>
                  }
                </div>
              </div>
              <p class="nota-scroll">En pantallas pequeñas, desplaza el calendario horizontalmente para ver todos los días.</p>
            }
          }
          @if (vista() === 'tabla' || sesiones().length === 0) {
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
        }
      </mat-card-content></mat-card>
    </section>
  `,
  styles: [`
    .panel{background:#fff;padding:28px;border-radius:12px;max-width:1200px;box-sizing:border-box}
    h1{display:flex;align-items:center;gap:10px;color:#004040}
    .filtros{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-top:12px}
    .filtros mat-form-field{min-width:230px}.filtros button{margin-bottom:18px}
    .error{padding:12px;background:#ffeded;color:#982222;border-radius:8px}
    .tabla{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:560px}
    th,td{text-align:left;padding:13px;border-bottom:1px solid #e6eeee}
    th{background:#f0f7f4}
    .resultado-cabecera{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:8px 0 14px}
    .resultado-cabecera p{margin:0}
    .selector-vista{display:flex;gap:6px}
    .selector-vista button{border-color:#c7ddd5;color:#004e49}
    .selector-vista button.activo{background:#006f61;color:white;border-color:#006f61}
    .modo-consulta{display:flex;align-items:center;gap:6px;color:#43625d;font-size:13px}
    .modo-consulta mat-icon{font-size:18px;width:18px;height:18px}
    .aviso{padding:10px 12px;background:#fff4de;border-radius:6px;color:#674500}
    .calendario-scroll{overflow-x:auto;border:1px solid #c9ddd5;border-radius:10px;max-width:100%}
    .calendario-semanal{display:grid;grid-template-columns:64px repeat(6,minmax(136px,1fr));min-width:890px}
    .encabezado-hora,.encabezado-dia{padding:12px 5px;text-align:center;background:#eaf4ef;color:#004040;font-weight:700;border-right:1px solid #d5e7e0;border-bottom:1px solid #c9ddd5}
    .eje-horas{background:#f7faf8;border-right:1px solid #d5e7e0}
    .etiqueta-hora{height:80px;box-sizing:border-box;padding:6px 8px;color:#42635d;font-size:12px;border-top:1px solid #d5e7e0}
    .columna-dia{position:relative;border-right:1px solid #d5e7e0;background:repeating-linear-gradient(to bottom,#d5e7e0 0,#d5e7e0 1px,#fff 1px,#fff 80px)}
    .columna-dia:nth-child(even){background:repeating-linear-gradient(to bottom,#d5e7e0 0,#d5e7e0 1px,#f9fcfa 1px,#f9fcfa 80px)}
    .evento{position:absolute;box-sizing:border-box;overflow:hidden;background:#d8f0e7;border:1px solid #91c4b1;border-left:4px solid #007566;border-radius:6px;padding:7px 5px;display:flex;flex-direction:column;gap:4px;font-size:12px;color:#004040;z-index:1}
    .evento strong{display:block;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
    .evento span,.evento small{display:block;font-size:11px;line-height:1.3}
    .evento.compacto{padding:3px;gap:1px}
    .evento.compacto strong{white-space:nowrap}
    .nota-scroll{font-size:12px;color:#60736d;margin:8px 0 0}
    @media(max-width:650px){.panel{padding:12px}.filtros mat-form-field{width:100%}.filtros button{margin-bottom:12px}}
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
  readonly vista = signal<'semana' | 'tabla'>('semana');
  readonly calendario = computed(() => construirSemanaDocente(this.sesiones()));
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
