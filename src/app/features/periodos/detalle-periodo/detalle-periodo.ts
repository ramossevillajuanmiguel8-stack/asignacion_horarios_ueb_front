import { Component, inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PeriodoAcademico } from '../../../models/periodo.model';

@Component({
  selector: 'app-detalle-periodo',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './detalle-periodo.html',
  styleUrl: './detalle-periodo.scss'
})
export class DetallePeriodo {

  periodo = inject<PeriodoAcademico>(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<DetallePeriodo>);

  cerrar(): void {
    this.dialogRef.close();
  }
}