import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import {
  Docente,
  RestriccionHoraria
} from '../../../models/docente.model';

import { DocentesService } from '../../../services/docentes';

@Component({
  selector: 'app-restricciones-docente',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './restricciones-docente.html',
  styleUrl: './restricciones-docente.scss'
})
export class RestriccionesDocente implements OnInit {

  private docentesService = inject(DocentesService);

  private dialogRef = inject(
    MatDialogRef<RestriccionesDocente>
  );

  docente = inject<Docente>(MAT_DIALOG_DATA);

  restricciones = signal<RestriccionHoraria[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.cargarRestricciones();
  }

  cargarRestricciones(): void {
    this.cargando.set(true);
    this.error.set('');

    this.docentesService
      .obtenerRestricciones(this.docente.id)
      .subscribe({
        next: (datos) => {
          this.restricciones.set(datos);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error(
            'Error al consultar restricciones:',
            err
          );

          this.error.set(
            'No fue posible consultar las restricciones del docente.'
          );

          this.cargando.set(false);
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

    return dias[dia] ?? 'Día desconocido';
  }

  nombreTipo(tipo: string): string {
    return tipo === 'FIRME'
      ? 'Restricción firme'
      : 'Preferencia';
  }

  nombreSentido(sentido: string): string {
    return sentido === 'DISPONIBLE'
      ? 'Disponible'
      : 'No disponible';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}