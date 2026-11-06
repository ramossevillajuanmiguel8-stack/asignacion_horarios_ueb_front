import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodoAcademico } from '../../../models/periodo.model';
import { Curso } from '../../../models/curso.model';
import { SesionHorario } from '../../../models/horario.model';
import { PeriodosService } from '../../../services/periodos';
import { CursosService } from '../../../services/cursos';
import { HorariosService } from '../../../services/horarios';

@Component({
  selector: 'app-consulta-publica', standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './consulta-publica.html',
  styleUrl: './consulta-publica.scss'
})
export class ConsultaPublica implements OnInit {
  private periodosService = inject(PeriodosService);
  private cursosService = inject(CursosService);
  private horariosService = inject(HorariosService);

  periodos = signal<PeriodoAcademico[]>([]);
  cursos = signal<Curso[]>([]);
  periodoId = signal<number | null>(null);
  cursoId = signal<number | null>(null);
  sesiones = signal<SesionHorario[]>([]);
  cargandoCatalogos = signal(false);
  consultando = signal(false);
  error = signal('');
  consultaRealizada = signal(false);

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.error.set('');
    forkJoin({
      periodos: this.periodosService.listar(),
      cursos: this.cursosService.listar()
    }).pipe(finalize(() => this.cargandoCatalogos.set(false)))
      .subscribe({
        next: datos => {
          this.periodos.set(datos.periodos);
          this.cursos.set(datos.cursos);
        },
        error: () => this.error.set('No se pudieron consultar los períodos y asignaturas.')
      });
  }

  cambiarPeriodo(id: number): void {
    this.periodoId.set(id);
    this.limpiarResultados();
  }

  cambiarCurso(id: number): void {
    this.cursoId.set(id);
    this.limpiarResultados();
  }

  private limpiarResultados(): void {
    this.sesiones.set([]);
    this.consultaRealizada.set(false);
    this.error.set('');
  }

  consultar(): void {
    const periodoId = this.periodoId();
    const cursoId = this.cursoId();
    if (periodoId === null || cursoId === null || this.consultando()) return;

    this.consultando.set(true);
    this.error.set('');
    this.sesiones.set([]);
    this.consultaRealizada.set(false);

    // Se obtiene solo el horario VIGENTE y PUBLICADO; nunca un borrador.
    this.horariosService.obtenerVigente(periodoId).pipe(
      switchMap(horario => {
        if (horario.estado !== 'PUBLICADO') {
          return throwError(() => new Error('No existe horario publicado para este período.'));
        }
        return this.horariosService.consultarSesiones(
          horario.id, undefined, cursoId, true
        );
      }),
      finalize(() => this.consultando.set(false))
    ).subscribe({
      next: sesiones => {
        this.sesiones.set([...sesiones].sort((a, b) =>
          a.dia - b.dia || a.horaInicio.localeCompare(b.horaInicio)));
        this.consultaRealizada.set(true);
      },
      error: (err: HttpErrorResponse | Error) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.error.set('Este período todavía no tiene un horario publicado.');
        } else if (err instanceof Error && !(err instanceof HttpErrorResponse)) {
          this.error.set(err.message);
        } else {
          this.error.set('No se pudo consultar el horario publicado.');
        }
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
}
