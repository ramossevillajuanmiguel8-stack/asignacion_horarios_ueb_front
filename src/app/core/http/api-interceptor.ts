import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthApiService } from '../../services/auth-api';

/** Mantener las cookies en todas las peticiones a la API local (servidas por el proxy). */
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/v1/')) return next(request);

  const auth = inject(AuthApiService);
  const router = inject(Router);
  const peticion = request.clone({ withCredentials: true });

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.limpiarSesion();
        // /auth/me puede responder 401 normalmente (usuario sin sesión).
        // La API pública no requiere autenticación ni debe redirigir por un 401.
        if (!request.url.startsWith('/api/v1/auth/') &&
            !request.url.startsWith('/api/v1/publico/')) {
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => error);
    })
  );
};
