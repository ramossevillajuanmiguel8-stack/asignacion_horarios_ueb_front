import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthApiService } from '../../services/auth-api';
import { RolInterno } from './perfiles';

/** Se consulta el servidor en cada entrada a una ruta privada, también al recargar la página. */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(AuthApiService);
  const router = inject(Router);
  return auth.obtenerSesion().pipe(
    map(usuario => usuario ? true : router.createUrlTree(['/login'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

/** Control de navegación. El backend sigue siendo la única autoridad sobre permisos. */
export const perfilGuard: CanActivateFn = route => {
  const auth = inject(AuthApiService);
  const router = inject(Router);
  const rol = auth.rol();
  if (!rol) return router.createUrlTree(['/login']);
  const roles = route.data['roles'] as readonly RolInterno[] | undefined;
  if (roles?.includes(rol as RolInterno)) return true;
  const destino = rol === 'DOCENTE' ? '/mi-horario'
    : rol === 'COMITE_TACTICO' || rol === 'COORDINACION_ACADEMICA' ? '/dashboard'
    : '/consulta-publica';
  return router.createUrlTree([destino]);
};
