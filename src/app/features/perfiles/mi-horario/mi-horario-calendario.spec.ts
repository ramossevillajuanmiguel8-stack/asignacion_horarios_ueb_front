import { describe, expect, it } from 'vitest';
import type { SesionHorario } from '../../../models/horario.model';
import { ALTO_HORA_DOCENTE, construirSemanaDocente } from './mi-horario-calendario';

const base: SesionHorario = {
  id: 1, horarioId: 10, grupoId: 2, grupo: '01', cursoId: 3,
  curso: 'Bases de datos I', docenteId: 4, docente: 'Docente',
  dia: 2, horaInicio: '09:00:00', horaFin: '11:00:00', necesitaAulaEspecial: false
};

describe('Calendario de solo lectura del docente', () => {
  it('construye seis días y conserva la duración exacta de cada sesión', () => {
    const semana = construirSemanaDocente([base, { ...base, id: 2, dia: 4 }]);
    expect(semana.dias).toHaveLength(6);
    expect(semana.horas).toEqual(['09:00', '10:00']);
    expect(semana.dias[1].eventos[0].alto).toBe(ALTO_HORA_DOCENTE * 2);
    expect(semana.dias[3].eventos[0].sesion.id).toBe(2);
    expect(semana.noGraficadas).toBe(0);
  });

  it('ubica sesiones de media hora sin redondearlas a una franja', () => {
    const semana = construirSemanaDocente([{ ...base, horaInicio: '09:30:00', horaFin: '10:15:00' }]);
    expect(semana.dias[1].eventos[0].top).toBe(ALTO_HORA_DOCENTE / 2);
    expect(semana.dias[1].eventos[0].alto).toBe(ALTO_HORA_DOCENTE * 0.75);
  });

  it('muestra traslapes lado a lado en lugar de ocultar sesiones', () => {
    const otra = { ...base, id: 9, horaInicio: '10:00:00', horaFin: '11:30:00' };
    const eventos = construirSemanaDocente([base, otra]).dias[1].eventos;
    expect(eventos).toHaveLength(2);
    expect(eventos[0].izquierda).not.toBe(eventos[1].izquierda);
  });

  it('cuenta sesiones no representables sin eliminarlas de los datos originales', () => {
    const invalida = { ...base, id: 3, dia: 7, horaInicio: '25:00:00' };
    const originales = [base, invalida];
    const semana = construirSemanaDocente(originales);
    expect(semana.noGraficadas).toBe(1);
    expect(originales).toHaveLength(2);
    expect(semana.dias[1].eventos).toHaveLength(1);
    expect(construirSemanaDocente([]).horas).toEqual([]);
  });
});
