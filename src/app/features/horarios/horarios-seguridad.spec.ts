import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Horarios } from './horarios';
import { AuthApiService } from '../../services/auth-api';
import { PeriodosService } from '../../services/periodos';
import { HorariosService } from '../../services/horarios';
import { Horario, SesionHorario, ValidacionMovimiento, ResultadoMovimiento } from '../../models/horario.model';
import { RolInterno } from '../../core/perfiles/perfiles';

const sesion: SesionHorario = {
  id: 57, horarioId: 63, grupoId: 54, grupo: 'QAC02', cursoId: 51, curso: 'QA',
  docenteId: 905, docente: 'Docente QA', dia: 1,
  horaInicio: '09:00:00', horaFin: '11:00:00', necesitaAulaEspecial: false
};
const borrador: Horario = {
  id: 63, periodoId: 5, estado: 'BORRADOR', fechaCreacion: '2026-11-08T00:00:00',
  fechaPublicacion: null, sesiones: [sesion]
};
const permitida: ValidacionMovimiento = { permitido: true, incidencias: [] };

describe('Horarios: autorización y persistencia segura de movimientos', () => {
  const rol = signal<RolInterno | null>('COORDINACION_ACADEMICA');
  const validar = vi.fn();
  const mover = vi.fn();
  const listarPorPeriodo = vi.fn();
  let componente: Horarios;

  beforeEach(() => {
    rol.set('COORDINACION_ACADEMICA');
    validar.mockReset();
    mover.mockReset();
    listarPorPeriodo.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: { rol } },
        { provide: HorariosService, useValue: { validar, mover, listarPorPeriodo } },
        { provide: PeriodosService, useValue: {} },
        { provide: MatDialog, useValue: {} }
      ]
    });
    componente = TestBed.runInInjectionContext(() => new Horarios());
    componente.periodoSeleccionado.set(5);
    componente.horarioSeleccionado.set({ ...borrador, sesiones: [{ ...sesion }] });
    componente.seleccionarSesionMover(57);
    componente.cambiarHoraMover('07:00');
  });

  it('no valida ni mueve un horario publicado, ni un borrador consultado por Docente', () => {
    componente.horarioSeleccionado.set({ ...borrador, estado: 'PUBLICADO' });
    componente.validarHorario();
    componente.moverSesion();
    expect(validar).not.toHaveBeenCalled();
    expect(mover).not.toHaveBeenCalled();

    componente.horarioSeleccionado.set(borrador);
    rol.set('DOCENTE');
    componente.validarHorario();
    componente.moverSesion();
    expect(validar).not.toHaveBeenCalled();
    expect(mover).not.toHaveBeenCalled();
  });

  it('no envía PUT si la validación encuentra un bloqueo académico', () => {
    validar.mockReturnValue(of({ permitido: false, incidencias: [
      { nivel: 'BLOQUEO', codigo: 'DOCENTE_OCUPADO', motivo: 'Docente ocupado' }
    ] }));
    componente.validarHorario();
    expect(componente.resultadoValidacion()?.permitido).toBe(false);
    componente.moverSesion();
    expect(mover).not.toHaveBeenCalled();
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('09:00:00');
  });

  it('descarta una validación que llegó después de cambiar el destino', () => {
    const respuesta = new Subject<ValidacionMovimiento>();
    validar.mockReturnValue(respuesta.asObservable());
    componente.validarHorario();
    componente.cambiarDiaMover(3);
    respuesta.next(permitida);
    respuesta.complete();
    expect(componente.resultadoValidacion()).toBeNull();
    componente.moverSesion();
    expect(mover).not.toHaveBeenCalled();
  });

  it('no altera el horario local hasta que el servidor aplica el movimiento', () => {
    validar.mockReturnValue(of(permitida));
    const respuesta = new Subject<ResultadoMovimiento>();
    mover.mockReturnValue(respuesta.asObservable());
    const nuevaSesion = { ...sesion, horaInicio: '07:00:00', horaFin: '09:00:00' };
    listarPorPeriodo.mockReturnValue(of([{ ...borrador, sesiones: [nuevaSesion] }]));
    componente.validarHorario();
    componente.moverSesion();
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('09:00:00');
    expect(mover).toHaveBeenCalledWith(63, 57, { dia: 1, horaInicio: '07:00:00' });
    respuesta.next({ aplicado: true, validacion: permitida, sesion: nuevaSesion });
    respuesta.complete();
    expect(listarPorPeriodo).toHaveBeenCalledWith(5);
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('07:00:00');
  });

  it.each([403, 409])('no altera sesiones ni permite reintentar sin validar ante HTTP %i', status => {
    validar.mockReturnValue(of(permitida));
    mover.mockReturnValue(throwError(() => new HttpErrorResponse({ status, statusText: 'Rechazado' })));
    componente.validarHorario();
    componente.moverSesion();
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('09:00:00');
    expect(componente.errorValidacion()).not.toBe('');
    expect(componente.ultimaPropuesta()).toBeNull();
    componente.moverSesion();
    expect(mover).toHaveBeenCalledTimes(1);
    expect(listarPorPeriodo).not.toHaveBeenCalled();
  });
});
