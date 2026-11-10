import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoAula = 'PEDAGOGICA' | 'COMPUTACION' | 'LABORATORIO' | 'MULTIMEDIA';
export const TIPOS_AULA: TipoAula[] = ['PEDAGOGICA','COMPUTACION','LABORATORIO','MULTIMEDIA'];

export interface Aula {
  id: number | null;
  codigo: string;
  nombre: string;
  tipo: TipoAula;
  edificio: string;
  piso: string;
  capacidad: number;
  activa: boolean;
  observaciones: string;
}
export interface AsignacionAula {
  sesionId: number;
  aulaId: number;
  codigo: string;
  nombre: string;
  tipo: TipoAula;
  edificio: string;
  capacidad: number;
}
export interface TipoCurso { cursoId: number; tipo: TipoAula; }
export interface ResultadoAuto { asignadas: number; sinAula: number; }

@Injectable({ providedIn: 'root' })
export class AulasService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}`;
  private cache = new Map<string, Observable<AsignacionAula[]>>();

  listar(): Observable<Aula[]> { return this.http.get<Aula[]>(`${this.url}/aulas`); }
  crear(a: Aula): Observable<Aula> { return this.http.post<Aula>(`${this.url}/aulas`, a); }
  actualizar(id: number, a: Aula): Observable<Aula> { return this.http.put<Aula>(`${this.url}/aulas/${id}`, a); }
  requisitos(): Observable<TipoCurso[]> { return this.http.get<TipoCurso[]>(`${this.url}/aulas/requisitos`); }
  establecerTipoCurso(cursoId: number, tipo: TipoAula): Observable<TipoCurso> {
    return this.http.put<TipoCurso>(`${this.url}/aulas/cursos/${cursoId}/tipo`, { cursoId, tipo });
  }
  asignaciones(horarioId: number, publico = false): Observable<AsignacionAula[]> {
    const key = `${publico}-${horarioId}`;
    if (!this.cache.has(key)) {
      const endpoint = publico
        ? `${this.url}/publico/aulas/horarios/${horarioId}`
        : `${this.url}/aulas/horarios/${horarioId}/asignaciones`;
      this.cache.set(key, this.http.get<AsignacionAula[]>(endpoint).pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }
  invalidar(horarioId: number): void {
    this.cache.delete(`false-${horarioId}`);
    this.cache.delete(`true-${horarioId}`);
  }
  asignar(horarioId: number, sesionId: number, aulaId: number | null): Observable<void> {
    this.invalidar(horarioId);
    return this.http.put<void>(`${this.url}/aulas/horarios/${horarioId}/sesiones/${sesionId}`, { aulaId });
  }
  completarPublicado(horarioId: number): Observable<ResultadoAuto> {
    this.invalidar(horarioId);
    return this.http.post<ResultadoAuto>(`${this.url}/aulas/horarios/${horarioId}/completar-publicado`, {});
  }
  automatico(horarioId: number): Observable<ResultadoAuto> {
    this.invalidar(horarioId);
    return this.http.post<ResultadoAuto>(`${this.url}/aulas/horarios/${horarioId}/autoasignar`, {});
  }
}
