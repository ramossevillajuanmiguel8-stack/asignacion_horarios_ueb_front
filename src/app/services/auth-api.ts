import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CredencialesLogin, RespuestaCsrf, SesionActual } from '../models/sesion.model';

/** La identidad proviene exclusivamente de Spring Security. No se persisten roles en el navegador. */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly sesionState = signal<SesionActual | null>(null);

  readonly sesion = this.sesionState.asReadonly();
  readonly autenticado = computed(() => this.sesionState() !== null);
  readonly rol = computed(() => this.sesionState()?.rol ?? null);

  obtenerCsrf(): Observable<RespuestaCsrf> {
    return this.http.get<RespuestaCsrf>(`${this.apiUrl}/csrf`);
  }

  iniciarSesion(credenciales: CredencialesLogin): Observable<SesionActual> {
    // CSRF previo al login; /auth/me es la fuente canónica del rol.
    // Spring puede rotar el token CSRF al autenticar: obtener otro para las mutaciones siguientes.
    return this.obtenerCsrf().pipe(
      switchMap(() => this.http.post<unknown>(`${this.apiUrl}/login`, credenciales)),
      switchMap(() => this.obtenerSesion()),
      switchMap(usuario => usuario
        ? this.obtenerCsrf().pipe(map(() => usuario))
        : throwError(() => new Error('El servidor no confirmó la sesión.')))
    );
  }

  obtenerSesion(): Observable<SesionActual | null> {
    return this.http.get<SesionActual>(`${this.apiUrl}/me`).pipe(
      tap(usuario => this.sesionState.set(usuario)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.limpiarSesion();
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  /** Limpieza de vista cuando el servidor confirma que una sesión expiró. */
  limpiarSesion(): void {
    this.sesionState.set(null);
  }

  cerrarSesion(): Observable<void> {
    return this.obtenerCsrf().pipe(
      switchMap(() => this.http.post<void>(`${this.apiUrl}/logout`, {})),
      tap(() => this.limpiarSesion())
    );
  }
}
