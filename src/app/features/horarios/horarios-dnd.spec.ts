import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { Horarios } from './horarios';
import { FranjaHorario } from './horario-grid';
import { AuthApiService } from '../../services/auth-api';
import { HorariosService } from '../../services/horarios';
import { PeriodosService } from '../../services/periodos';
import { SesionHorario, Horario } from '../../models/horario.model';
import { RolUsuario } from '../../models/sesion.model';

const sesion: SesionHorario = {
  id: 57, horarioId: 63, grupoId: 54, grupo: 'QAC02',
  cursoId: 51, curso: 'QA', docenteId: 905, docente: 'Docente QA',
  dia: 1, horaInicio: '09:00:00', horaFin: '11:00:00', necesitaAulaEspecial: false
};
const borrador: Horario = {
  id: 63, periodoId: 5, estado: 'BORRADOR', fechaCreacion: '2026-11-08T00:00:00',
  fechaPublicacion: null, sesiones: [sesion]
};
const destino: FranjaHorario = {
  id: 'franja-1-0700', dia: 1, inicio: '07:00', fin: '09:00', sesiones: []
};

function eventoSoltar(): CdkDragDrop<FranjaHorario, FranjaHorario, SesionHorario> {
  return {
    item: { data: sesion }, container: { data: destino }
  } as CdkDragDrop<FranjaHorario, FranjaHorario, SesionHorario>;
}

describe('Drag & drop de sesiones: autorización y validación remota', () => {
  const rol = signal<RolUsuario>('COORDINACION_ACADEMICA');
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
    componente.horarioSeleccionado.set(borrador);
  });

  it('rechaza un destino ocupado antes de guardar y conserva sesión original', () => {
    validar.mockReturnValue(of({ permitido: false, incidencias: [
      { nivel: 'BLOQUEO', codigo: 'DOCENTE_OCUPADO', motivo: 'Ocupado' }
    ] }));
    componente.soltarSesion(eventoSoltar());
    expect(validar).toHaveBeenCalledWith(63, {
      grupoId: 54, dia: 1, horaInicio: '07:00:00', sesionExcluida: 57
    });
    expect(componente.resultadoValidacion()?.permitido).toBe(false);
    componente.moverSesion();
    expect(mover).not.toHaveBeenCalled();
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('09:00:00');
  });

  it('solo permite guardar después de validar y confirmar explícitamente', () => {
    validar.mockReturnValue(of({ permitido: true, incidencias: [] }));
    const actualizado: Horario = {
      ...borrador, sesiones: [{ ...sesion, horaInicio: '07:00:00', horaFin: '09:00:00' }]
    };
    mover.mockReturnValue(of({ aplicado: true,
      validacion: { permitido: true, incidencias: [] }, sesion: actualizado.sesiones[0]
    }));
    listarPorPeriodo.mockReturnValue(of([actualizado]));
    componente.soltarSesion(eventoSoltar());
    expect(mover).not.toHaveBeenCalled();
    componente.moverSesion();
    expect(mover).toHaveBeenCalledWith(63, 57, { dia: 1, horaInicio: '07:00:00' });
    expect(componente.horarioSeleccionado()?.sesiones[0].horaInicio).toBe('07:00:00');
  });

  it('no solicita movimientos si el horario está publicado o el rol es docente', () => {
    componente.horarioSeleccionado.set({ ...borrador, estado: 'PUBLICADO' });
    componente.soltarSesion(eventoSoltar());
    expect(validar).not.toHaveBeenCalled();
    componente.horarioSeleccionado.set(borrador);
    rol.set('DOCENTE');
    componente.soltarSesion(eventoSoltar());
    expect(validar).not.toHaveBeenCalled();
    expect(mover).not.toHaveBeenCalled();
  });
});
