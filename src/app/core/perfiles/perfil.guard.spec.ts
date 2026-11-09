import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiService } from '../../services/auth-api';
import { RolInterno } from './perfiles';
import { perfilGuard, sesionGuard } from './perfil.guard';
import { routes } from '../../app.routes';

function destino(resultado: boolean | UrlTree): string {
  if (resultado === true) return 'permitido';
  if (resultado === false) return 'rechazado';
  return TestBed.inject(Router).serializeUrl(resultado);
}

describe('Guardias de navegación y roles', () => {
  const rol = signal<RolInterno | null>(null);
  const obtenerSesion = vi.fn();
  let router: Router;

  beforeEach(() => {
    rol.set(null);
    obtenerSesion.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { rol: computed(() => rol()), obtenerSesion } }
      ]
    });
    router = TestBed.inject(Router);
  });

  function evaluarPerfil(roles: readonly RolInterno[]): boolean | UrlTree {
    const ruta = { data: { roles } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      perfilGuard(ruta, {} as RouterStateSnapshot)) as boolean | UrlTree;
  }

  async function evaluarSesion(): Promise<boolean | UrlTree> {
    const resultado = TestBed.runInInjectionContext(() =>
      sesionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    return firstValueFrom(resultado as Observable<boolean | UrlTree>);
  }

  it('manda al login si la sesión administrativa no existe', async () => {
    obtenerSesion.mockReturnValue(of(null));
    expect(destino(await evaluarSesion())).toBe('/login');
    expect(obtenerSesion).toHaveBeenCalledTimes(1);
  });

  it('manda al login cuando falla la consulta al servidor', async () => {
    obtenerSesion.mockReturnValue(throwError(() => new Error('sin conexión')));
    expect(destino(await evaluarSesion())).toBe('/login');
  });

  it('permite continuar cuando el backend confirma la sesión', async () => {
    obtenerSesion.mockReturnValue(of({ id: 1, identificador: 'docente', rol: 'DOCENTE', docenteId: 3 }));
    expect(destino(await evaluarSesion())).toBe('permitido');
  });

  it('bloquea la ruta administrativa para docente y permite su horario', () => {
    rol.set('DOCENTE');
    expect(destino(evaluarPerfil(['COMITE_TACTICO', 'COORDINACION_ACADEMICA']))).toBe('/mi-horario');
    expect(destino(evaluarPerfil(['DOCENTE']))).toBe('permitido');
  });

  it('impide que Coordinación entre a Aprobación y permite Comité', () => {
    rol.set('COORDINACION_ACADEMICA');
    expect(destino(evaluarPerfil(['COMITE_TACTICO']))).toBe('/dashboard');
    rol.set('COMITE_TACTICO');
    expect(destino(evaluarPerfil(['COMITE_TACTICO']))).toBe('permitido');
  });

  it('impide entrar a rutas privadas si falta el rol local', () => {
    expect(destino(evaluarPerfil(['DOCENTE']))).toBe('/login');
  });

  it('protege los hijos privados y reserva aprobación para Comité en el árbol de rutas', () => {
    const privada = routes.find(r => r.path === '');
    expect(privada?.canActivateChild).toContain(sesionGuard);
    const aprobacion = privada?.children?.find(r => r.path === 'aprobacion');
    const horarios = privada?.children?.find(r => r.path === 'horarios');
    const propio = privada?.children?.find(r => r.path === 'mi-horario');
    expect(aprobacion?.canActivate).toContain(perfilGuard);
    expect(aprobacion?.data?.['roles']).toEqual(['COMITE_TACTICO']);
    expect(horarios?.data?.['roles']).not.toContain('DOCENTE');
    expect(propio?.data?.['roles']).toEqual(['DOCENTE']);
    expect(router).toBeDefined();
  });
});
