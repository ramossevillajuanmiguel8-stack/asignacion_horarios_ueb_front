import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  Grupo,
  CrearGrupoRequest
} from '../models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class GruposService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}`;

  listarPorPeriodo(periodoId: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(
      `${this.apiUrl}/periodos/${periodoId}/grupos`
    );
  }

  crear(datos: CrearGrupoRequest): Observable<Grupo> {
    return this.http.post<Grupo>(
      `${this.apiUrl}/grupos`,
      datos
    );
  }
}