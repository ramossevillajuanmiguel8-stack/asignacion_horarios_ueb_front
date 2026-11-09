import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiService } from '../../services/auth-api';
import { apiInterceptor } from './api-interceptor';

describe('apiInterceptor: cookies y errores de autorización', () => {
  let cliente: HttpClient;
  let http: HttpTestingController;
  const limpiarSesion = vi.fn();
  const navegar = vi.fn();

  beforeEach(() => {
    limpiarSesion.mockReset();
    navegar.mockReset().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: { limpiarSesion } },
        { provide: Router, useValue: { navigateByUrl: navegar } }
      ]
    });
    cliente = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía cookies en consultas administrativas de /api/v1', () => {
    cliente.get('/api/v1/horarios/63').subscribe();
    const peticion = http.expectOne('/api/v1/horarios/63');
    expect(peticion.request.withCredentials).toBe(true);
    peticion.flush({});
  });

  it('no modifica solicitudes que no son de /api/v1', () => {
    cliente.get('/assets/info.json').subscribe();
    const peticion = http.expectOne('/assets/info.json');
    expect(peticion.request.withCredentials).toBe(false);
    peticion.flush({});
  });

  it('ante un 401 administrativo limpia sesión y navega al login', () => {
    let errorRecibido: HttpErrorResponse | undefined;
    cliente.get('/api/v1/horarios/63').subscribe({
      error: (e: HttpErrorResponse) => errorRecibido = e
    });
    http.expectOne('/api/v1/horarios/63').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(errorRecibido?.status).toBe(401);
    expect(limpiarSesion).toHaveBeenCalledOnce();
    expect(navegar).toHaveBeenCalledWith('/login');
  });

  it('no redirige al login por el 401 normal de /auth/me', () => {
    cliente.get('/api/v1/auth/me').subscribe({ error: () => undefined });
    http.expectOne('/api/v1/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(limpiarSesion).toHaveBeenCalledOnce();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('no redirige por un 401 de la consulta pública', () => {
    cliente.get('/api/v1/publico/periodos/5/horario-vigente')
      .subscribe({ error: () => undefined });
    http.expectOne('/api/v1/publico/periodos/5/horario-vigente')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navegar).not.toHaveBeenCalled();
  });

  it.each([403, 409])('no borra la sesión ni redirige por un error %i', status => {
    cliente.put('/api/v1/horarios/63/sesiones/57', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/v1/horarios/63/sesiones/57')
      .flush({}, { status, statusText: 'Rejected' });
    expect(limpiarSesion).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });
});
