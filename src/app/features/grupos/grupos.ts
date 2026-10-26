import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { Grupo } from '../../models/grupo.model';
import { PeriodoAcademico } from '../../models/periodo.model';
import { Docente } from '../../models/docente.model';
import { Curso } from '../../models/curso.model';

import { GruposService } from '../../services/grupos';
import { PeriodosService } from '../../services/periodos';
import { DocentesService } from '../../services/docentes';
import { CursosService } from '../../services/cursos';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './grupos.html',
  styleUrl: './grupos.scss'
})
export class Grupos implements OnInit {

  private gruposService = inject(GruposService);
  private periodosService = inject(PeriodosService);
  private docentesService = inject(DocentesService);
  private cursosService = inject(CursosService);
  private dialog = inject(MatDialog);

  periodos = signal<PeriodoAcademico[]>([]);
  docentes = signal<Docente[]>([]);
  cursos = signal<Curso[]>([]);
  grupos = signal<Grupo[]>([]);

  periodoSeleccionado = signal<number | null>(null);
  filtro = signal('');

  cargando = signal(false);
  cargandoCatalogos = signal(false);
  error = signal('');

  columnas = [
    'codigo',
    'curso',
    'docente',
    'inscritos',
    'limiteOperativo',
    'estado'
  ];

  gruposFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();

    return this.grupos().filter(grupo =>
      grupo.codigo.toLowerCase().includes(busqueda) ||
      this.nombreCurso(grupo.cursoId)
        .toLowerCase().includes(busqueda) ||
      this.nombreDocente(grupo.docenteId)
        .toLowerCase().includes(busqueda)
    );
  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.error.set('');

    forkJoin({
      periodos: this.periodosService.listar(),
      docentes: this.docentesService.listar(),
      cursos: this.cursosService.listar()
    }).subscribe({
      next: datos => {
        this.periodos.set(datos.periodos);
        this.docentes.set(datos.docentes);
        this.cursos.set(datos.cursos);

        this.cargandoCatalogos.set(false);

        const actual = this.periodoSeleccionado();

        if (
          actual !== null &&
          datos.periodos.some(p => p.id === actual)
        ) {
          this.cargarGrupos();
        } else if (datos.periodos.length > 0) {
          this.seleccionarPeriodo(datos.periodos[0].id);
        } else {
          this.periodoSeleccionado.set(null);
          this.grupos.set([]);
        }
      },

      error: err => {
        console.error('Error cargando catálogos:', err);
        this.cargandoCatalogos.set(false);
        this.error.set(
          'No se pudieron cargar períodos, docentes o asignaturas.'
        );
      }
    });
  }

  seleccionarPeriodo(id: number): void {
    this.periodoSeleccionado.set(id);
    this.filtro.set('');
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    const id = this.periodoSeleccionado();

    if (id === null) {
      this.grupos.set([]);
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.gruposService.listarPorPeriodo(id).subscribe({
      next: datos => {
        this.grupos.set(datos);
        this.cargando.set(false);
      },

      error: err => {
        console.error('Error cargando grupos:', err);
        this.error.set('No se pudieron consultar los grupos.');
        this.cargando.set(false);
      }
    });
  }

  nombreCurso(id: number): string {
    return this.cursos().find(c => c.id === id)?.nombre
      ?? `Curso #${id}`;
  }

  nombreDocente(id: number): string {
    return this.docentes().find(d => d.id === id)?.nombre
      ?? `Docente #${id}`;
  }

  async nuevoGrupo(): Promise<void> {
    const id = this.periodoSeleccionado();
    if (id === null) return;

    const periodo = this.periodos().find(p => p.id === id);
    if (!periodo) return;

    const { FormGrupo } = await import(
      './form-grupo/form-grupo'
    );

    const referencia = this.dialog.open(FormGrupo, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      autoFocus: false,
      data: {
        periodo,
        docentes: this.docentes(),
        cursos: this.cursos()
      }
    });

    referencia.afterClosed().subscribe(resultado => {
      if (resultado?.id) {
        this.cargarGrupos();
      }
    });
  }
}