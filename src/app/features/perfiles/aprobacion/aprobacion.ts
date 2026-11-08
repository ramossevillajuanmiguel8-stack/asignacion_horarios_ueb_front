import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodoAcademico } from '../../../models/periodo.model';
import { Horario } from '../../../models/horario.model';
import { PeriodosService } from '../../../services/periodos';
import { HorariosService } from '../../../services/horarios';

@Component({
  selector: 'app-aprobacion', standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatProgressSpinnerModule],
  template: `
    <section class="panel">
      <h1><mat-icon>fact_check</mat-icon> Publicación de horarios</h1>
      <p>Esta operación requiere una sesión con rol Comité Táctico.</p>
      <mat-card><mat-card-content>
        <div class="controles">
          <mat-form-field appearance="outline">
            <mat-label>Período académico</mat-label>
            <mat-select [value]="periodoId()" [disabled]="cargando() || publicando()"
                        (valueChange)="seleccionarPeriodo($event)">
              @for (periodo of periodos(); track periodo.id) {
                <mat-option [value]="periodo.id">{{ periodo.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button [disabled]="cargando() || publicando()"
                  (click)="cargarPeriodos()"><mat-icon>refresh</mat-icon> Actualizar</button>
        </div>
        @if (cargando()) { <mat-spinner diameter="32"></mat-spinner> }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @if (mensaje()) { <p class="exito" role="status">{{ mensaje() }}</p> }
        @if (periodoId() !== null && !cargando()) {
          <p><strong>{{ borradores().length }}</strong> borrador(es) en este período.</p>
          @for (horario of horarios(); track horario.id) {
            <div class="horario">
              <div><strong>Horario #{{ horario.id }}</strong>
                <p>Estado: {{ horario.estado }} · Sesiones: {{ horario.sesiones.length }}</p>
              </div>
              @if (horario.estado === 'BORRADOR') {
                <button mat-flat-button [disabled]="publicando()"
                        (click)="publicar(horario)"><mat-icon>publish</mat-icon> Publicar</button>
              }
            </div>
          } @empty { <p>No hay horarios generados para este período.</p> }
        }
        <p class="nota">Antes de publicar, revisa las sesiones en Gestión de horarios.
          El servidor verificará integridad, conflictos y autorizaciones.
          El cierre de grupos no tiene un endpoint disponible en esta versión.</p>
      </mat-card-content></mat-card>
    </section>
  `,
  styles: [`
    .panel{background:white;padding:28px;border-radius:12px;max-width:1000px}
    h1{display:flex;align-items:center;gap:12px;color:#004040}
    .controles{display:flex;gap:15px;align-items:center;flex-wrap:wrap;margin-top:14px}
    .controles mat-form-field{min-width:250px}.controles button{margin-bottom:18px}
    .horario{display:flex;align-items:center;justify-content:space-between;gap:15px;
      border-bottom:1px solid #e1e9e5;padding:16px 4px}
    .horario p{margin:5px 0;color:#52625e;font-size:13px}
    .error{color:#9d2727;background:#ffecec;padding:12px;border-radius:8px}
    .exito{color:#0a6547;background:#e9f8f1;padding:12px;border-radius:8px}
    .nota{font-size:12px;line-height:1.6;color:#61756e;margin-top:24px}
  `]
})
export class Aprobacion implements OnInit {
  private readonly periodosApi = inject(PeriodosService);
  private readonly horariosApi = inject(HorariosService);
  readonly periodos = signal<PeriodoAcademico[]>([]);
  readonly horarios = signal<Horario[]>([]);
  readonly periodoId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly publicando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly borradores = computed(() => this.horarios().filter(h => h.estado === 'BORRADOR'));

  ngOnInit(): void { this.cargarPeriodos(); }

  cargarPeriodos(): void {
    this.cargando.set(true);
    this.error.set('');
    this.periodosApi.listar().subscribe({
      next: periodos => {
        this.periodos.set(periodos);
        if (this.periodoId() !== null && periodos.some(p => p.id === this.periodoId())) {
          this.seleccionarPeriodo(this.periodoId()!);
        } else if (periodos.length) {
          this.seleccionarPeriodo(periodos[0].id);
        } else {
          this.cargando.set(false);
          this.periodoId.set(null);
          this.horarios.set([]);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar los períodos.');
      }
    });
  }

  seleccionarPeriodo(id: number): void {
    this.periodoId.set(id);
    this.horarios.set([]);
    this.error.set('');
    this.mensaje.set('');
    this.cargando.set(true);
    this.horariosApi.listarPorPeriodo(id).pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: datos => { if (this.periodoId() === id) this.horarios.set(datos); },
        error: () => this.error.set('No se pudieron cargar los horarios del período.')
      });
  }

  publicar(horario: Horario): void {
    if (this.publicando() || horario.estado !== 'BORRADOR') return;
    if (!window.confirm(`¿Publicar el horario #${horario.id} del período ${horario.periodoId}? La publicación bloqueará su edición.`)) return;
    this.publicando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.horariosApi.publicar(horario.id).pipe(finalize(() => this.publicando.set(false)))
      .subscribe({
        next: publicado => {
          this.mensaje.set(`Horario #${publicado.id} publicado correctamente.`);
          this.horarios.update(items => items.map(h => h.id === publicado.id ? publicado : h));
        },
        error: (error: HttpErrorResponse) => this.error.set(error.status === 409
          ? 'No se puede publicar: revisa las sesiones faltantes o los conflictos del horario.'
          : error.status === 403 ? 'Tu sesión no tiene permiso para publicar.'
          : 'No fue posible publicar el horario.')
      });
  }
}
