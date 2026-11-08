import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Observable,
  of,
  switchMap,
  tap,
  catchError,
  throwError
} from 'rxjs';

import { environment } from '../../environments/environment';

import {
  CredencialesLogin,
  RespuestaCsrf,
  SesionActual
} from '../models/sesion.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/auth`;

  private sesionState = signal<SesionActual | null>(null);

  readonly sesion = this.sesionState.asReadonly();

  readonly autenticado = computed(
    () => this.sesion() !== null
  );

  readonly rol = computed(
    () => this.sesion()?.rol ?? null
  );

  obtenerCsrf(): Observable<RespuestaCsrf> {
    return this.http.get<RespuestaCsrf>(
      `${this.apiUrl}/csrf`
    );
  }

  iniciarSesion(
    credenciales: CredencialesLogin
  ): Observable<SesionActual> {

    return this.obtenerCsrf().pipe(

      switchMap(() =>
        this.http.post<SesionActual>(
          `${this.apiUrl}/login`,
          credenciales
        )
      ),

      tap(usuario => {
        this.sesionState.set(usuario);
      })

    );
  }

  obtenerSesion(): Observable<SesionActual | null> {

    return this.http.get<SesionActual>(
      `${this.apiUrl}/me`
    ).pipe(

      tap(usuario => {
        this.sesionState.set(usuario);
      }),

      catchError((error: HttpErrorResponse) => {

        if (error.status === 401) {
          this.sesionState.set(null);
          return of(null);
        }

        return throwError(() => error);

      })

    );
  }

  cerrarSesion(): Observable<void> {

    return this.obtenerCsrf().pipe(

      switchMap(() =>
        this.http.post<void>(
          `${this.apiUrl}/logout`,
          {}
        )
      ),

      tap(() => {
        this.sesionState.set(null);
      })

    );
  }
}