import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HorariosService } from './horarios';
import { environment } from '../../environments/environment';

describe('HorariosService: contratos de endpoints y respuestas de error', () => {
  let servicio: HorariosService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servicio = TestBed.inject(HorariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el horario de sesión sin permitir pasar docenteId', () => {
    servicio.obtenerHorarioDocente(5).subscribe();
    const peticion = http.expectOne(`${api}/docentes/me/horario-publicado?periodoId=5`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('docenteId')).toBe(false);
    peticion.flush({ periodoId: 5, docenteId: 905, sesiones: [] });
  });

  it('consulta únicamente el endpoint de períodos del docente', () => {
    servicio.listarPeriodosPublicadosDocente().subscribe(periodos =>
      expect(periodos).toEqual([{ id: 5, nombre: 'QA-CONFLICTOS-2027' }]));
    const peticion = http.expectOne(`${api}/docentes/me/periodos-publicados`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([{ id: 5, nombre: 'QA-CONFLICTOS-2027' }]);
  });

  it('envía la propuesta de validación completa antes de mover', () => {
    const datos = { grupoId: 54, dia: 1, horaInicio: '07:00:00', sesionExcluida: 57 };
    servicio.validar(63, datos).subscribe();
    const peticion = http.expectOne(`${api}/horarios/63/validar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(datos);
    peticion.flush({ permitido: false, incidencias: [
      { nivel: 'BLOQUEO', codigo: 'DOCENTE_OCUPADO', motivo: 'Ocupado' }
    ] });
  });

  it('conserva un 403 de publicación para que la interfaz lo maneje', () => {
    let estado: number | undefined;
    servicio.publicar(63).subscribe({ error: e => estado = e.status });
    const peticion = http.expectOne(`${api}/horarios/63/publicar`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(estado).toBe(403);
  });

  it('conserva un 409 de movimiento sobre horario publicado', () => {
    let estado: number | undefined;
    servicio.mover(62, 53, { dia: 4, horaInicio: '09:00:00' })
      .subscribe({ error: e => estado = e.status });
    const peticion = http.expectOne(`${api}/horarios/62/sesiones/53`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ dia: 4, horaInicio: '09:00:00' });
    peticion.flush({}, { status: 409, statusText: 'Conflict' });
    expect(estado).toBe(409);
  });
});
