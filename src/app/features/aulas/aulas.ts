import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AulasService, Aula, AsignacionAula, TipoCurso, TipoAula, TIPOS_AULA } from '../../services/aulas';
import { PeriodosService } from '../../services/periodos';
import { HorariosService } from '../../services/horarios';
import { CursosService } from '../../services/cursos';
import { Curso } from '../../models/curso.model';
import { Horario } from '../../models/horario.model';
import { PeriodoAcademico } from '../../models/periodo.model';

const VACIA = (): Aula => ({ id:null,codigo:'',nombre:'',tipo:'PEDAGOGICA',edificio:'',piso:'1',capacidad:35,activa:true,observaciones:'' });

@Component({
  selector:'app-aulas', standalone:true,
  imports:[FormsModule,MatButtonModule,MatIconModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatSlideToggleModule],
  templateUrl:'./aulas.html',styleUrl:'./aulas.scss'
})
export class Aulas implements OnInit {
  private aulasApi = inject(AulasService);
  private periodosApi = inject(PeriodosService);
  private horariosApi = inject(HorariosService);
  private cursosApi = inject(CursosService);

  readonly tipos = TIPOS_AULA;
  readonly aulas = signal<Aula[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly requisitos = signal<TipoCurso[]>([]);
  readonly periodos = signal<PeriodoAcademico[]>([]);
  readonly horarios = signal<Horario[]>([]);
  readonly horario = signal<Horario | null>(null);
  readonly asignaciones = signal<AsignacionAula[]>([]);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly procesando = signal(false);
  readonly formulario = signal(false);
  readonly filtro = signal('');
  readonly pestana = signal<'catalogo'|'asignaciones'|'requisitos'>('catalogo');
  readonly filtradas = computed(() => this.aulas().filter(a =>
    `${a.codigo} ${a.nombre} ${a.tipo} ${a.edificio}`.toLowerCase().includes(this.filtro().trim().toLowerCase())));
  actual: Aula = VACIA();
  periodoId: number|null = null;
  horarioId: number|null = null;
  tipoPorCurso: Record<number,TipoAula> = {};
  seleccionadoPorSesion: Record<number,number|null> = {};

  ngOnInit(): void { this.recargar(); }
  recargar(): void {
    this.aulasApi.listar().subscribe({next: d=>this.aulas.set(d),error:()=>this.error.set('No se pudieron cargar las aulas. Comprueba la migración de MySQL.')});
    this.cursosApi.listar().subscribe({next:d=>this.cursos.set(d),error:()=>{}});
    this.aulasApi.requisitos().subscribe({next:d=>{this.requisitos.set(d);for(const e of d)this.tipoPorCurso[e.cursoId]=e.tipo;},error:()=>{}});
    this.periodosApi.listar().subscribe({next:d=>{this.periodos.set(d);if(this.periodoId===null && d.length){this.periodoId=d[0].id;this.cambiarPeriodo();}},error:()=>{}});
  }
  nuevo(): void {this.actual=VACIA();this.formulario.set(true);}
  editar(a:Aula):void {this.actual={...a};this.formulario.set(true);}
  guardar():void {
    this.error.set(''); this.mensaje.set(''); this.procesando.set(true);
    const req=this.actual.id ? this.aulasApi.actualizar(this.actual.id,this.actual) : this.aulasApi.crear(this.actual);
    req.subscribe({next:()=>{this.procesando.set(false);this.formulario.set(false);this.mensaje.set('Aula guardada correctamente.');this.recargar();},
      error:e=>{this.procesando.set(false);this.error.set(e.error?.error||e.error?.mensaje||'No se pudo guardar el aula.');}});
  }
  guardarTipo(c:Curso):void {
    const tipo=this.tipoPorCurso[c.id] || (c.necesitaAulaEspecial?'COMPUTACION':'PEDAGOGICA');
    this.aulasApi.establecerTipoCurso(c.id,tipo).subscribe({next:()=>this.mensaje.set(`Tipo requerido para ${c.nombre} guardado.`),
      error:()=>this.error.set('No se pudo guardar el tipo de aula de la asignatura.')});
  }
  cambiarPeriodo():void {
    this.horarios.set([]);this.horario.set(null);this.horarioId=null;
    if(!this.periodoId)return;
    this.horariosApi.listarPorPeriodo(this.periodoId).subscribe({next:d=>{this.horarios.set(d);if(d.length){this.horarioId=d[0].id;this.cambiarHorario();}},error:()=>this.error.set('No se pudieron consultar los horarios.')});
  }
  cambiarHorario():void {
    this.horario.set(this.horarios().find(h=>h.id===this.horarioId)??null);
    this.cargarAsignaciones();
  }
  cargarAsignaciones():void {
    const id=this.horarioId;
    if(id===null)return;
    this.aulasApi.invalidar(id);
    this.aulasApi.asignaciones(id).subscribe({next:datos=>{
      this.asignaciones.set(datos);this.seleccionadoPorSesion={};
      for(const a of datos)this.seleccionadoPorSesion[a.sesionId]=a.aulaId;
    },error:()=>this.error.set('No se pudieron cargar las asignaciones.')});
  }
  aulaPara(sesionId:number):AsignacionAula|null { return this.asignaciones().find(a=>a.sesionId===sesionId)??null; }
  autoasignar():void {
    if(!this.horarioId)return;
    this.procesando.set(true);this.error.set('');
    this.aulasApi.automatico(this.horarioId).subscribe({next:r=>{
      this.procesando.set(false);this.mensaje.set(`Asignación automática: ${r.asignadas} con aula, ${r.sinAula} pendientes.`);this.cargarAsignaciones();
    },error:e=>{this.procesando.set(false);this.error.set(e.error?.error||e.error?.mensaje||'No se pudo asignar automáticamente.');}});
  }
  completarPublicado():void {
    if (!this.horarioId || this.horario()?.estado !== 'PUBLICADO') return;
    this.procesando.set(true);this.error.set('');this.mensaje.set('');
    this.aulasApi.completarPublicado(this.horarioId).subscribe({
      next:r=>{
        this.procesando.set(false);
        this.mensaje.set(`Publicado actualizado: ${r.asignadas} sesiones con aula, ${r.sinAula} pendientes. No se modificaron los horarios.`);
        this.cargarAsignaciones();
      },
      error:e=>{this.procesando.set(false);this.error.set(e.error?.error||e.error?.mensaje||'No se pudieron completar las aulas.');}
    });
  }
  asignar(sesionId:number):void {
    if(!this.horarioId)return;
    const nueva=this.seleccionadoPorSesion[sesionId]??null;
    this.procesando.set(true);this.error.set('');
    this.aulasApi.asignar(this.horarioId,sesionId,nueva).subscribe({next:()=>{
      this.procesando.set(false);this.mensaje.set('Aula asignada correctamente.');this.cargarAsignaciones();
    },error:e=>{this.procesando.set(false);this.error.set(e.error?.error||e.error?.mensaje||'Aula ocupada, incompatible o sin capacidad.');this.cargarAsignaciones();}});
  }
  tipoCurso(c:Curso):TipoAula { return this.tipoPorCurso[c.id] || (c.necesitaAulaEspecial?'COMPUTACION':'PEDAGOGICA'); }
  nombreTipo(tipo:string):string {return ({PEDAGOGICA:'Pedagógica',COMPUTACION:'Computación',LABORATORIO:'Laboratorio',MULTIMEDIA:'Multimedia'} as Record<string,string>)[tipo]??tipo;}
  nombreDia(d:number):string {return ['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d]??String(d);}
}
