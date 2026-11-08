import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Horario, SesionHorario } from '../../../models/horario.model';
import { HorariosService } from '../../../services/horarios';

@Component({
  selector: 'app-mi-horario', standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule],
  template: `
    <section class="panel">
      <h1><mat-icon>event</mat-icon> Mi horario publicado</h1>
      <p>Solo se consulta el horario del docente autenticado en el servidor.</p>
      <mat-card><mat-card-content>
        <div class="filtros">
          <mat-form-field appearance="outline">
            <mat-label>Número del período académico</mat-label>
            <input matInput type="number" min="1" [(ngModel)]="periodoEntrada" placeholder="Ej. 1" />
          </mat-form-field>
          <button mat-flat-button [disabled]="cargando()" (click)="consultar()">
            <mat-icon>search</mat-icon> Consultar mi horario
          </button>
        </div>
        @if (cargando()) { <mat-spinner diameter="30"></mat-spinner> }
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
export class MiHorario {
  private readonly horarios = inject(HorariosService);
  periodoEntrada: number | null = null;
  readonly sesiones = signal<SesionHorario[]>([]);
  readonly cargando = signal(false);
  readonly consultado = signal(false);
  readonly error = signal('');
  readonly sesionesOrdenadas = computed(() => [...this.sesiones()].sort((a, b) =>
    a.dia - b.dia || a.horaInicio.localeCompare(b.horaInicio)));

  consultar(): void {
    const id = Number(this.periodoEntrada);
    if (!Number.isInteger(id) || id <= 0 || this.cargando()) {
      this.error.set('Ingresa un número de período válido.');
      return;
    }
    this.cargando.set(true);
    this.consultado.set(false);
    this.error.set('');
    this.sesiones.set([]);
    this.horarios.obtenerHorarioDocente(id).pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.sesiones.set(Array.isArray(respuesta) ? respuesta : (respuesta as Horario).sesiones ?? []);
          this.consultado.set(true);
        },
        error: (error: HttpErrorResponse) => this.error.set(error.status === 404
          ? 'El docente no tiene horario publicado en este período.'
          : 'No fue posible consultar tu horario.')
      });
  }

  nombreDia(dia: number): string {
    const nombres: Record<number, string> = {1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado'};
    return nombres[dia] ?? `Día ${dia}`;
  }
}
