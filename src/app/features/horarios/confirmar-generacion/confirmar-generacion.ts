import { Component, inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmar-generacion',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirmar-generacion.html',
  styleUrl: './confirmar-generacion.scss'
})
export class ConfirmarGeneracion {

  datos = inject<{ tieneHorarios: boolean }>(MAT_DIALOG_DATA);

  private dialogRef = inject(
    MatDialogRef<ConfirmarGeneracion>
  );

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}