import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-aprobacion', standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="panel">
      <h1><mat-icon>fact_check</mat-icon> Aprobación y cierre de grupos</h1>
      <p>Perfil Comité Táctico</p>
      <div class="aviso">
        <mat-icon>info</mat-icon>
        <div>
          <strong>Flujo de decisiones pendiente de integrar</strong>
          <p>El Comité Táctico tendrá autoridad para revisar la propuesta,
            aprobarla y publicarla, así como decidir el cierre de grupos.
            Los botones de aprobación y cierre se incorporarán cuando el backend
            aplique autorización por rol, registre decisiones y compruebe las validaciones.
            No se simulan aprobaciones ni cierres.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .panel{background:white;padding:28px;border-radius:12px;max-width:980px}
    h1{display:flex;align-items:center;gap:12px;color:#8b1538}
    .aviso{display:flex;gap:12px;background:#f7eef2;border:1px solid #ead4dd;
      padding:18px;border-radius:10px;margin-top:24px}
    .aviso mat-icon{color:#8b1538;flex-shrink:0}
    .aviso p{line-height:1.6;color:#555}
  `]
})
export class Aprobacion {}
