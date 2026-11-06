import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolInterno } from './perfiles';
import { SesionVistaPrevia } from './sesion-vista-previa';

/** Guarda visual, NO una medida de seguridad. */
export const vistaPreviaGuard: CanActivateFn = () => {
  const sesion = inject(SesionVistaPrevia);
  const router = inject(Router);
  return sesion.rol() !== null ? true : router.createUrlTree(['/login']);
};

/** Restringe navegación y módulos mostrados en la demo de perfiles. */
export const perfilGuard: CanActivateFn = route => {
  const sesion = inject(SesionVistaPrevia);
  const router = inject(Router);
  const rol = sesion.rol();
  if (!rol) return router.createUrlTree(['/login']);
  const roles = route.data['roles'] as readonly RolInterno[] | undefined;
  return roles?.includes(rol)
    ? true
    : router.createUrlTree([sesion.rutaInicial()]);
};
