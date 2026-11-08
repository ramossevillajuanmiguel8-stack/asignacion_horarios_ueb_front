import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, map, of, switchMap, finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DocentesService } from '../../services/docentes';
import { CursosService } from '../../services/cursos';
import { PeriodosService } from '../../services/periodos';
import { GruposService } from '../../services/grupos';

interface Estadistica { titulo: string; valor: string; icono: string; }

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html', styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly docentes = inject(DocentesService);
  private readonly cursos = inject(CursosService);
  private readonly periodos = inject(PeriodosService);
  private readonly grupos = inject(GruposService);

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly estadisticas = signal<Estadistica[]>([]);

  ngOnInit(): void { this.actualizar(); }

  actualizar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      docentes: this.docentes.listar(),
      cursos: this.cursos.listar(),
      periodos: this.periodos.listar()
    }).pipe(
      switchMap(datos => {
        const ids = datos.periodos.map(periodo => periodo.id);
        const conteos = ids.length
          ? forkJoin(ids.map(id => this.grupos.listarPorPeriodo(id).pipe(map(g => g.length))))
          : of([] as number[]);
        return conteos.pipe(map(cantidad => ({
          docentes: datos.docentes.length,
          cursos: datos.cursos.length,
          periodos: datos.periodos.length,
          grupos: cantidad.reduce((acumulado, total) => acumulado + total, 0)
        })));
      }),
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: datos => this.estadisticas.set([
        { titulo: 'Docentes', valor: String(datos.docentes), icono: 'people' },
        { titulo: 'Asignaturas', valor: String(datos.cursos), icono: 'menu_book' },
        { titulo: 'Períodos', valor: String(datos.periodos), icono: 'date_range' },
        { titulo: 'Grupos', valor: String(datos.grupos), icono: 'groups' }
      ]),
      error: () => this.error.set('No fue posible obtener las estadísticas. Comprueba tu sesión y la conexión con Spring Boot.')
    });
  }
}
