import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { AulasService, AsignacionAula } from '../../services/aulas';

/** Etiqueta compacta reutilizable en el calendario, Mi horario y consulta pública. */
@Component({
  selector: 'app-aula-etiqueta',
  standalone: true,
  template: `
    @if (aula(); as asignacion) {
      <span class="aula-pill" [title]="asignacion.nombre + ' · ' + asignacion.edificio">
        <strong>Aula {{ asignacion.codigo }}</strong>
        <small>· {{ nombreTipo(asignacion.tipo) }}</small>
      </span>
    } @else {
      <span class="aula-pendiente">Aula pendiente</span>
    }
  `,
  styles: [`
    :host { display:block; margin-top:5px; max-width:100%; }
    .aula-pill { display:inline-flex; flex-wrap:wrap; gap:4px; align-items:center;
      background:#e5f4ed; color:#005745; border:1px solid #a5d4bd;
      border-radius:6px; padding:3px 6px; font-size:11px; font-weight:700; }
    small { font-size:10px; font-weight:500; }
    .aula-pendiente { font-size:10px; color:#835a0c; font-weight:600; }
  `]
})
export class AulaEtiqueta implements OnChanges {
  @Input({ required: true }) horarioId!: number;
  @Input({ required: true }) sesionId!: number;
  @Input() publico = false;
  private servicio = inject(AulasService);
  readonly aula = signal<AsignacionAula | null>(null);
  ngOnChanges(): void {
    this.aula.set(null);
    if (!(this.horarioId > 0) || !(this.sesionId > 0)) return;
    this.servicio.asignaciones(this.horarioId, this.publico).subscribe({
      next: items => this.aula.set(items.find(a => a.sesionId === this.sesionId) ?? null),
      error: () => this.aula.set(null)
    });
  }
  nombreTipo(tipo: string): string {
    return ({PEDAGOGICA:'Pedagógica',COMPUTACION:'Computación',LABORATORIO:'Laboratorio',MULTIMEDIA:'Multimedia'} as Record<string,string>)[tipo] ?? tipo;
  }
}
