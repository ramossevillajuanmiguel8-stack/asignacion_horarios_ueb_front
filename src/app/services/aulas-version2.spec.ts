import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { AulasService } from './aulas';
import { HorariosService } from './horarios';
import { environment } from '../../environments/environment';

describe('Aulas V2: publicados y exportación', () => {
  let aulas: AulasService;
  let horarios: HorariosService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(),provideHttpClientTesting()]});
    aulas = TestBed.inject(AulasService);
    horarios = TestBed.inject(HorariosService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('completa un horario publicado por la ruta administrativa', () => {
    let resultado: {asignadas:number;sinAula:number} | undefined;
    aulas.completarPublicado(12).subscribe(r=>resultado=r);
    const req=http.expectOne(`${environment.apiUrl}/aulas/horarios/12/completar-publicado`);
    expect(req.request.method).toBe('POST');
    req.flush({asignadas:4,sinAula:1});
    expect(resultado).toEqual({asignadas:4,sinAula:1});
  });

  it('exporta CSV público con las aulas asignadas', () => {
    expect(horarios.urlCsvPublico(5,7)).toBe(
      `${environment.apiUrl}/publico/aulas/periodos/5/cursos/7/exportar.csv`
    );
  });
});
