import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mi-horario', standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="panel">
      <h1><mat-icon>event</mat-icon> Mi horario</h1>
      <p>Perfil Docente — consulta de horario <strong>publicado</strong>.</p>
      <div class="aviso">
        <mat-icon>lock</mat-icon>
        <div>
          <strong>Pendiente de autenticación en el backend</strong>
          <p>Para mostrar exclusivamente el horario del docente autenticado,
            Spring Boot deberá asociar el usuario a su docenteId y aplicar el filtro en el servidor.
            No se permite introducir el ID de otro docente desde esta pantalla.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .panel{background:white;padding:28px;border-radius:12px;max-width:980px}
    h1{display:flex;align-items:center;gap:12px;color:#8b1538}
    .aviso{display:flex;gap:12px;background:#fff7e8;border:1px solid #f1d9aa;
      padding:18px;border-radius:10px;margin-top:24px}
    .aviso mat-icon{color:#925400;flex-shrink:0}
    .aviso p{line-height:1.6;color:#555}
  `]
})
export class MiHorario {}
