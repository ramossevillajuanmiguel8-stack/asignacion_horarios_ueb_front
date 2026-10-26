import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  Curso,
  CrearCursoRequest,
  CrearCursoResponse
} from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class CursosService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/cursos`;

  listar(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  crear(
    datos: CrearCursoRequest
  ): Observable<CrearCursoResponse> {
    return this.http.post<CrearCursoResponse>(
      this.apiUrl,
      datos
    );
  }
}