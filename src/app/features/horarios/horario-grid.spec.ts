import { describe, expect, it } from 'vitest';
import { PeriodoAcademico } from '../../models/periodo.model';
import { SesionHorario } from '../../models/horario.model';
import { construirDiasHorario, minutos, sesionesFueraDeFranja } from './horario-grid';

const periodo: PeriodoAcademico = {
  id: 5, nombre: 'QA-CONFLICTOS-2027', fechaInicio: '2027-02-15', fechaFin: '2027-03-20',
  horaInicioSemana: '07:00:00', horaFinSemana: '22:00:00',
  horaInicioSabado: '07:00:00', horaFinSabado: '13:00:00',
  almuerzoInicio: '13:00:00', almuerzoFin: '14:00:00',
  duracionBloqueMin: 120, maxSesionesSemana: 4, cupoMaximoBase: 40,
  cupoMinimo: 10, toleranciaCupoPct: 10
};
const sesion: SesionHorario = {
  id: 57, horarioId: 63, grupoId: 54, grupo: 'QAC02',
  cursoId: 51, curso: 'QA', docenteId: 905, docente: 'Docente QA',
  dia: 1, horaInicio: '09:00:00', horaFin: '11:00:00', necesitaAulaEspecial: false
};

describe('Calendario de arrastre por parámetros académicos', () => {
  it('calcula bloques, ignora los cruces de almuerzo y respeta sábado', () => {
    const dias = construirDiasHorario(periodo, [sesion]);
    expect(dias).toHaveLength(6);
    expect(dias[0].franjas.map(f => f.inicio)).toEqual([
      '07:00', '09:00', '11:00', '15:00', '17:00', '19:00'
    ]);
    expect(dias[5].franjas.map(f => f.inicio)).toEqual(['07:00', '09:00', '11:00']);
    expect(dias[0].franjas.find(f => f.inicio === '09:00')?.sesiones).toEqual([sesion]);
    expect(dias[0].franjas.find(f => f.inicio === '07:00')?.sesiones).toEqual([]);
  });

  it('no oculta sesiones antiguas que caigan fuera de las franjas', () => {
    const irregular = { ...sesion, id: 59, horaInicio: '08:00:00', horaFin: '10:00:00' };
    const horario = {
      id: 63, periodoId: 5, estado: 'BORRADOR' as const,
      fechaCreacion: '2026-11-08T00:00:00', fechaPublicacion: null,
      sesiones: [sesion, irregular]
    };
    const dias = construirDiasHorario(periodo, horario.sesiones);
    expect(sesionesFueraDeFranja(horario, dias)).toEqual([irregular]);
  });

  it('rechaza horas corruptas y períodos con duración inválida', () => {
    expect(minutos('07:00:00')).toBe(420);
    expect(minutos('27:00:00')).toBeNull();
    expect(construirDiasHorario({ ...periodo, duracionBloqueMin: 0 }, [sesion])).toEqual([]);
  });
});
