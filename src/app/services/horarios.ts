import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Horario, SesionHorario, ResultadoGeneracion,
  PrevisualizarMovimiento, ValidacionMovimiento, ResultadoMovimiento } from '../models/horario.model';

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  generar(periodoId: number): Observable<ResultadoGeneracion> {
    return this.http.post<ResultadoGeneracion>(`${this.apiUrl}/periodos/${periodoId}/generar`, {});
  }

  listarPorPeriodo(periodoId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/periodos/${periodoId}/horarios`);
  }

  obtener(horarioId: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/horarios/${horarioId}`);
  }

  consultarSesiones(horarioId: number, docenteId?: number,
    cursoId?: number, soloPublicados = false): Observable<SesionHorario[]> {
    let params = new HttpParams().set('soloPublicados', String(soloPublicados));
    if (docenteId !== undefined) params = params.set('docenteId', String(docenteId));
    if (cursoId !== undefined) params = params.set('cursoId', String(cursoId));
    return this.http.get<SesionHorario[]>(`${this.apiUrl}/horarios/${horarioId}/sesiones`, { params });
  }

  obtenerVigente(periodoId: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/periodos/${periodoId}/horario-vigente`);
  }

  publicar(horarioId: number): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiUrl}/horarios/${horarioId}/publicar`, {});
  }

  /** Requiere grupoId, dia, horaInicio y sesionExcluida para movimientos. */
  validar(horarioId: number, datos: PrevisualizarMovimiento): Observable<ValidacionMovimiento> {
    return this.http.post<ValidacionMovimiento>(`${this.apiUrl}/horarios/${horarioId}/validar`, datos);
  }

  mover(horarioId: number, sesionId: number, datos: { dia: number; horaInicio: string })
    : Observable<ResultadoMovimiento> {
    return this.http.put<ResultadoMovimiento>(
      `${this.apiUrl}/horarios/${horarioId}/sesiones/${sesionId}`, datos);
  }

  /** Estos tres endpoints son PÚBLICOS y no requieren /periodos ni /cursos administrativos. */
  obtenerVigentePublico(periodoId: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/publico/periodos/${periodoId}/horario-vigente`);
  }

  sesionesPublicas(periodoId: number, cursoId: number): Observable<SesionHorario[]> {
    return this.http.get<SesionHorario[]>(
      `${this.apiUrl}/publico/periodos/${periodoId}/cursos/${cursoId}/sesiones`);
  }

  urlCsvPublico(periodoId: number, cursoId: number): string {
    return `${this.apiUrl}/publico/periodos/${periodoId}/cursos/${cursoId}/exportar.csv`;
  }

  /** El docente autenticado se deduce de Spring Security, no de un ID enviado por el navegador. */
  obtenerHorarioDocente(periodoId: number): Observable<Horario | SesionHorario[]> {
    const params = new HttpParams().set('periodoId', String(periodoId));
    return this.http.get<Horario | SesionHorario[]>(
      `${this.apiUrl}/docentes/me/horario-publicado`, { params });
  }
}
