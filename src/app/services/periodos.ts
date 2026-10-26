import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  PeriodoAcademico,
  CrearPeriodoRequest,
  ParametrosPeriodoRequest
} from '../models/periodo.model';

@Injectable({
  providedIn: 'root'
})
export class PeriodosService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/periodos`;

  listar(): Observable<PeriodoAcademico[]> {
    return this.http.get<PeriodoAcademico[]>(this.apiUrl);
  }

  obtener(id: number): Observable<PeriodoAcademico> {
    return this.http.get<PeriodoAcademico>(
      `${this.apiUrl}/${id}`
    );
  }

  crear(
    datos: CrearPeriodoRequest
  ): Observable<PeriodoAcademico> {
    return this.http.post<PeriodoAcademico>(
      this.apiUrl,
      datos
    );
  }

  actualizarParametros(
    id: number,
    datos: ParametrosPeriodoRequest
  ): Observable<PeriodoAcademico> {
    return this.http.put<PeriodoAcademico>(
      `${this.apiUrl}/${id}/parametros`,
      datos
    );
  }
}