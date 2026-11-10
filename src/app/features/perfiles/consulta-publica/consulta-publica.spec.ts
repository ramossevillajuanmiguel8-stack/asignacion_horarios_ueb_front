import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsultaPublica } from './consulta-publica';
import { HorariosService } from '../../../services/horarios';
import { Horario } from '../../../models/horario.model';

const horarioPublicado: Horario = {
  id: 10, periodoId: 4, estado: 'PUBLICADO',
  fechaCreacion: '2026-11-09T10:00:00', fechaPublicacion: '2026-11-09T11:00:00',
  sesiones: [
    { id: 17, horarioId: 10, grupoId: 8, grupo: 'A', cursoId: 5, curso: 'Programación',
      docenteId: 7, docente: 'Docente prueba', dia: 1,
      horaInicio: '07:00:00', horaFin: '09:00:00', necesitaAulaEspecial: false }
  ]
};

describe('ConsultaPublica: selector de períodos publicados', () => {
  const listar = vi.fn();
  const vigente = vi.fn();
  const sesiones = vi.fn();
  let pagina: ConsultaPublica;

  beforeEach(() => {
    listar.mockReset();
    vigente.mockReset();
    sesiones.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: HorariosService, useValue: {
        listarPeriodosPublicadosPublicos: listar,
        obtenerVigentePublico: vigente,
        sesionesPublicas: sesiones,
        urlCsvPublico: (periodo: number, curso: number) => `/publico/${periodo}/${curso}`
      } }]
    });
    pagina = TestBed.runInInjectionContext(() => new ConsultaPublica());
  });

  it('carga únicamente el catálogo público y selecciona automáticamente el único período', () => {
    listar.mockReturnValue(of([{ id: 4, nombre: '2026-2' }]));
    pagina.ngOnInit();
    expect(listar).toHaveBeenCalledTimes(1);
    expect(pagina.periodos()).toEqual([{ id: 4, nombre: '2026-2' }]);
    expect(pagina.periodoEntrada).toBe(4);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('muestra el estado vacío cuando no hay períodos publicados', () => {
    listar.mockReturnValue(of([]));
    pagina.ngOnInit();
    expect(pagina.periodos()).toEqual([]);
    expect(pagina.periodoEntrada).toBeNull();
    expect(pagina.cargandoPeriodos()).toBe(false);
  });

  it('no consulta un período no devuelto por el catálogo público', () => {
    listar.mockReturnValue(of([{ id: 4, nombre: '2026-2' }]));
    pagina.ngOnInit();
    pagina.periodoEntrada = 99;
    pagina.cargarPeriodo();
    expect(vigente).not.toHaveBeenCalled();
    expect(pagina.error()).toContain('Selecciona un período');
  });

  it('consulta el horario publicado y habilita las asignaturas', () => {
    listar.mockReturnValue(of([{ id: 4, nombre: '2026-2' }]));
    vigente.mockReturnValue(of(horarioPublicado));
    pagina.ngOnInit();
    pagina.cargarPeriodo();
    expect(vigente).toHaveBeenCalledWith(4);
    expect(pagina.periodoId()).toBe(4);
    expect(pagina.cursos()).toEqual([{ id: 5, nombre: 'Programación' }]);
  });

  it('limpia el resultado anterior al cambiar de período', () => {
    listar.mockReturnValue(of([{ id: 4, nombre: '2026-2' }, { id: 6, nombre: '2027-1' }]));
    vigente.mockReturnValue(of(horarioPublicado));
    pagina.ngOnInit();
    pagina.periodoEntrada = 4;
    pagina.cargarPeriodo();
    pagina.cambiarCurso(5);
    sesiones.mockReturnValue(of(horarioPublicado.sesiones));
    pagina.consultar();
    expect(pagina.consultaRealizada()).toBe(true);
    pagina.periodoEntrada = 6;
    pagina.limpiarPeriodo();
    expect(pagina.periodoId()).toBeNull();
    expect(pagina.cursoId()).toBeNull();
    expect(pagina.consultaRealizada()).toBe(false);
    expect(pagina.sesiones()).toEqual([]);
  });

  it('permite reintentar si falla el catálogo público', () => {
    listar.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of([{ id: 4, nombre: '2026-2' }]));
    pagina.ngOnInit();
    expect(pagina.errorPeriodos()).toContain('No se pudieron cargar');
    pagina.cargarPeriodos();
    expect(pagina.errorPeriodos()).toBe('');
    expect(pagina.periodos()).toHaveLength(1);
  });
});
