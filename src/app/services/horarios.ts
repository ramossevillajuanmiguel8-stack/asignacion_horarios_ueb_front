import { Injectable, inject } from '@angular/core';

import {
    HttpClient,
    HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
    Horario,
    SesionHorario,
    ResultadoGeneracion
} from '../models/horario.model';

@Injectable({
    providedIn: 'root'
})
export class HorariosService {

    private http = inject(HttpClient);

    private readonly apiUrl = environment.apiUrl;

    generar(
        periodoId: number
    ): Observable<ResultadoGeneracion> {

        return this.http.post<ResultadoGeneracion>(
            `${this.apiUrl}/periodos/${periodoId}/generar`,
            {}
        );
    }

    listarPorPeriodo(
        periodoId: number
    ): Observable<Horario[]> {

        return this.http.get<Horario[]>(
            `${this.apiUrl}/periodos/${periodoId}/horarios`
        );
    }

    obtener(
        horarioId: number
    ): Observable<Horario> {

        return this.http.get<Horario>(
            `${this.apiUrl}/horarios/${horarioId}`
        );
    }

    consultarSesiones(
        horarioId: number,
        docenteId?: number,
        cursoId?: number,
        soloPublicados = false
    ): Observable<SesionHorario[]> {

        let params = new HttpParams()
            .set('soloPublicados', String(soloPublicados));

        if (docenteId !== undefined) {
            params = params.set(
                'docenteId',
                String(docenteId)
            );
        }

        if (cursoId !== undefined) {
            params = params.set(
                'cursoId',
                String(cursoId)
            );
        }

        return this.http.get<SesionHorario[]>(
            `${this.apiUrl}/horarios/${horarioId}/sesiones`,
            { params }
        );
    }

    obtenerVigente(
        periodoId: number
    ): Observable<Horario> {

        return this.http.get<Horario>(
            `${this.apiUrl}/periodos/${periodoId}/horario-vigente`
        );
    }

    publicar(
        horarioId: number
    ): Observable<Horario> {

        return this.http.post<Horario>(
            `${this.apiUrl}/horarios/${horarioId}/publicar`,
            {}
        );
    }
    validar(horarioId: number): Observable<unknown> {
        return this.http.post<unknown>(
            `${this.apiUrl}/horarios/${horarioId}/validar`,
            {}
        );
    }
}