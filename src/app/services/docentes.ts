import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
    Docente,
    CrearDocenteRequest,
    CrearDocenteResponse,
    RestriccionHoraria
} from '../models/docente.model';

@Injectable({
    providedIn: 'root'
})
export class DocentesService {

    private http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiUrl}/docentes`;

    listar(): Observable<Docente[]> {
        return this.http.get<Docente[]>(this.apiUrl);
    }

    crear(
        datos: CrearDocenteRequest
    ): Observable<CrearDocenteResponse> {

        return this.http.post<CrearDocenteResponse>(
            this.apiUrl,
            datos
        );
    }

    obtenerRestricciones(
        id: number
    ): Observable<RestriccionHoraria[]> {

        return this.http.get<RestriccionHoraria[]>(
            `${this.apiUrl}/${id}/restricciones`
        );
    }

    listarHabilitadosPorCurso(
        cursoId: number
    ): Observable<Docente[]> {
        return this.http.get<Docente[]>(
            `/api/v1/cursos/${cursoId}/docentes-habilitados`
        );
    }

    obtenerCursosHabilitados(
        docenteId: number
    ): Observable<number[]> {
        return this.http.get<number[]>(
            `${this.apiUrl}/${docenteId}/cursos-habilitados`
        );
    }

    actualizarCursosHabilitados(
        docenteId: number,
        cursoIds: number[]
    ): Observable<number[]> {
        return this.http.put<number[]>(
            `${this.apiUrl}/${docenteId}/cursos-habilitados`,
            { cursoIds }
        );
    }

}