import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HorariosService } from './horarios';
import { environment } from '../../environments/environment';

describe('HorariosService: catálogo de períodos de consulta pública', () => {
  let horarios: HorariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    horarios = TestBed.inject(HorariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('usa GET público sin requerir las rutas administrativas o del docente', () => {
    let respuesta: { id: number; nombre: string }[] | undefined;
    horarios.listarPeriodosPublicadosPublicos().subscribe(p => respuesta = p);
    const peticion = http.expectOne(`${environment.apiUrl}/publico/periodos-publicados`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.body).toBeNull();
    peticion.flush([{ id: 4, nombre: '2026-2' }]);
    expect(respuesta).toEqual([{ id: 4, nombre: '2026-2' }]);
  });
});
