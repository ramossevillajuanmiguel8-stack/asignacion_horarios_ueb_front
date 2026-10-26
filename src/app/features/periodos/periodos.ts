import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PeriodoAcademico } from '../../models/periodo.model';
import { PeriodosService } from '../../services/periodos';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './periodos.html',
  styleUrl: './periodos.scss'
})
export class Periodos implements OnInit {

  private periodosService = inject(PeriodosService);
  private dialog = inject(MatDialog);

  periodos = signal<PeriodoAcademico[]>([]);
  filtro = signal('');
  cargando = signal(false);
  error = signal('');

  columnas = [
    'nombre',
    'fechaInicio',
    'fechaFin',
    'acciones'
  ];

  periodosFiltrados = computed(() => {
    const busqueda = this.filtro().trim().toLowerCase();

    return this.periodos().filter(periodo =>
      periodo.nombre.toLowerCase().includes(busqueda)
    );
  });

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.periodosService.listar().subscribe({
      next: datos => {
        this.periodos.set(datos);
        this.cargando.set(false);
      },

      error: err => {
        console.error('Error consultando períodos:', err);

        this.error.set(
          'No fue posible consultar los períodos académicos.'
        );

        this.cargando.set(false);
      }
    });
  }

  async nuevoPeriodo(): Promise<void> {
    const { FormPeriodo } = await import(
      './form-periodo/form-periodo'
    );

    const dialogRef = this.dialog.open(FormPeriodo, {
      width: '600px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado?.id) {
        this.cargarPeriodos();
      }
    });
  }

  async verParametros(periodo: PeriodoAcademico): Promise<void> {
    const { DetallePeriodo } = await import(
      './detalle-periodo/detalle-periodo'
    );

    this.dialog.open(DetallePeriodo, {
      width: '700px',
      maxWidth: '95vw',
      data: periodo
    });
  }

  async editarParametros(
  periodo: PeriodoAcademico
): Promise<void> {

  const { EditarParametros } = await import(
    './editar-parametros/editar-parametros'
  );

  const dialogRef = this.dialog.open(EditarParametros, {
    width: '800px',
    maxWidth: '96vw',
    maxHeight: '95vh',
    autoFocus: false,
    disableClose: true,
    data: periodo
  });

  dialogRef.afterClosed().subscribe(resultado => {

    if (resultado?.id) {
      this.cargarPeriodos();
    }

  });
}

}