import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Horario, SesionHorario } from '../../../models/horario.model';
import { HorariosService } from '../../../services/horarios';

interface CursoPublicado { id: number; nombre: string; }

@Component({
  selector: 'app-consulta-publica', standalone: true,
  imports: [RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './consulta-publica.html', styleUrl: './consulta-publica.scss'
})
export class ConsultaPublica {
  private readonly horariosService = inject(HorariosService);
  periodoEntrada: number | null = null;
  periodoId = signal<number | null>(null);
  cursoId = signal<number | null>(null);
  cursos = signal<CursoPublicado[]>([]);
  sesiones = signal<SesionHorario[]>([]);
  horario = signal<Horario | null>(null);
  cargando = signal(false);
  consultando = signal(false);
  error = signal('');
  consultaRealizada = signal(false);
  readonly urlCsv = computed(() => {
    const periodo = this.periodoId();
    const curso = this.cursoId();
    return periodo !== null && curso !== null
      ? this.horariosService.urlCsvPublico(periodo, curso) : null;
  });

  cargarPeriodo(): void {
    const id = Number(this.periodoEntrada);
    if (!Number.isInteger(id) || id <= 0 || this.cargando()) {
      this.error.set('Ingresa el número válido de un período académico.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.periodoId.set(null);
    this.cursoId.set(null);
    this.horario.set(null);
    this.cursos.set([]);
    this.sesiones.set([]);
    this.consultaRealizada.set(false);

    this.horariosService.obtenerVigentePublico(id).pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: horario => {
        if (horario.estado !== 'PUBLICADO') {
          this.error.set('El período aún no cuenta con un horario publicado.');
          return;
        }
        this.periodoId.set(id);
        this.horario.set(horario);
        const cursos = new Map<number, string>();
        for (const sesion of horario.sesiones ?? []) {
          cursos.set(sesion.cursoId, sesion.curso);
        }
        this.cursos.set([...cursos].map(([cursoId, nombre]) => ({ id: cursoId, nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)));
      },
      error: (error: HttpErrorResponse) => this.error.set(error.status === 404
        ? 'No existe un horario publicado para ese período.'
        : 'No se pudo consultar el período. Revisa la conexión con el backend.')
    });
  }

  cambiarCurso(id: number): void {
    this.cursoId.set(id);
    this.sesiones.set([]);
    this.consultaRealizada.set(false);
  }

  consultar(): void {
    const periodo = this.periodoId();
    const curso = this.cursoId();
    if (periodo === null || curso === null || this.consultando()) return;
    this.consultando.set(true);
    this.error.set('');
    this.sesiones.set([]);
    this.consultaRealizada.set(false);
    this.horariosService.sesionesPublicas(periodo, curso).pipe(
      finalize(() => this.consultando.set(false))
    ).subscribe({
      next: sesiones => {
        this.sesiones.set([...sesiones].sort((a, b) =>
          a.dia - b.dia || a.horaInicio.localeCompare(b.horaInicio)));
        this.consultaRealizada.set(true);
      },
      error: () => this.error.set('No se pudo consultar el horario publicado del curso.')
    });
  }

  nombreDia(dia: number): string {
    return ({ 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
      4: 'Jueves', 5: 'Viernes', 6: 'Sábado' } as Record<number, string>)[dia] ?? `Día ${dia}`;
  }
}
