import { Horario, SesionHorario } from '../../models/horario.model';
import { PeriodoAcademico } from '../../models/periodo.model';

export interface FranjaHorario {
  id: string;
  dia: number;
  inicio: string;
  fin: string;
  sesiones: SesionHorario[];
}

export interface DiaHorario {
  numero: number;
  nombre: string;
  franjas: FranjaHorario[];
}

export const DIAS_HORARIO = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' }
] as const;

/** Normaliza las horas que envía Spring (HH:mm:ss), sin depender de la zona horaria. */
export function minutos(hora: string): number | null {
  const coincidencia = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(hora || '');
  if (!coincidencia) return null;
  const hh = Number(coincidencia[1]);
  const mm = Number(coincidencia[2]);
  return hh < 24 && mm < 60 ? hh * 60 + mm : null;
}

function hhmm(valor: number): string {
  return `${String(Math.floor(valor / 60)).padStart(2, '0')}:${String(valor % 60).padStart(2, '0')}`;
}

/** Los bloques y el almuerzo se derivan de los parámetros reales de cada período. */
export function construirDiasHorario(
  periodo: PeriodoAcademico | undefined,
  sesiones: readonly SesionHorario[]
): DiaHorario[] {
  if (!periodo || !Number.isInteger(periodo.duracionBloqueMin) ||
      periodo.duracionBloqueMin <= 0) return [];

  const almuerzoInicio = minutos(periodo.almuerzoInicio);
  const almuerzoFin = minutos(periodo.almuerzoFin);

  return DIAS_HORARIO.map(dia => {
    const sabado = dia.numero === 6;
    const inicio = minutos(sabado ? periodo.horaInicioSabado : periodo.horaInicioSemana);
    const fin = minutos(sabado ? periodo.horaFinSabado : periodo.horaFinSemana);
    const franjas: FranjaHorario[] = [];
    if (inicio === null || fin === null || fin <= inicio) {
      return { ...dia, franjas };
    }

    for (let momento = inicio; momento + periodo.duracionBloqueMin <= fin; momento += periodo.duracionBloqueMin) {
      const finBloque = momento + periodo.duracionBloqueMin;
      // El servidor sigue validando la regla; omitimos destinos que cruzan el almuerzo.
      if (almuerzoInicio !== null && almuerzoFin !== null &&
          momento < almuerzoFin && finBloque > almuerzoInicio) continue;

      const hora = hhmm(momento);
      franjas.push({
        id: `franja-${dia.numero}-${hora.replace(':', '')}`,
        dia: dia.numero,
        inicio: hora,
        fin: hhmm(finBloque),
        sesiones: sesiones.filter(s => s.dia === dia.numero && s.horaInicio.slice(0, 5) === hora)
      });
    }

    return { ...dia, franjas };
  });
}

/** Las sesiones históricas que no coincidan con una franja configurada nunca deben ocultarse. */
export function sesionesFueraDeFranja(horario: Horario | null, dias: DiaHorario[]): SesionHorario[] {
  if (!horario) return [];
  const visibles = new Set(dias.flatMap(dia => dia.franjas.flatMap(franja => franja.sesiones.map(s => s.id))));
  return horario.sesiones.filter(s => !visibles.has(s.id));
}
