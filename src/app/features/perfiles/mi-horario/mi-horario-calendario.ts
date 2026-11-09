import type { SesionHorario } from '../../../models/horario.model';
import { DIAS_HORARIO, minutos } from '../../horarios/horario-grid';

export const ALTO_HORA_DOCENTE = 80;

type SesionConMinutos = { sesion: SesionHorario; inicio: number; fin: number };

export interface EventoCalendarioDocente {
  sesion: SesionHorario;
  top: number;
  alto: number;
  izquierda: number;
  ancho: number;
  compacto: boolean;
}

export interface SemanaDocente {
  dias: { numero: number; nombre: string; eventos: EventoCalendarioDocente[] }[];
  horas: string[];
  altura: number;
  noGraficadas: number;
}

function etiquetaHora(minuto: number): string {
  return `${String(Math.floor(minuto / 60)).padStart(2, '0')}:00`;
}

/** Representación de solo lectura. No infiere ni modifica parámetros académicos. */
export function construirSemanaDocente(sesiones: readonly SesionHorario[]): SemanaDocente {
  const validas: SesionConMinutos[] = [];
  for (const sesion of sesiones) {
    const inicio = minutos(sesion.horaInicio);
    const fin = minutos(sesion.horaFin);
    if (!DIAS_HORARIO.some(d => d.numero === sesion.dia) || inicio === null || fin === null || fin <= inicio) {
      continue;
    }
    validas.push({ sesion, inicio, fin });
  }

  const noGraficadas = sesiones.length - validas.length;
  const desde = validas.length ? Math.floor(Math.min(...validas.map(s => s.inicio)) / 60) * 60 : 0;
  const hasta = validas.length ? Math.ceil(Math.max(...validas.map(s => s.fin)) / 60) * 60 : 0;
  const horas = Array.from({ length: (hasta - desde) / 60 }, (_, indice) => etiquetaHora(desde + indice * 60));
  const altura = horas.length * ALTO_HORA_DOCENTE;

  const dias = DIAS_HORARIO.map(dia => {
    const ordenadas = validas.filter(s => s.sesion.dia === dia.numero)
      .sort((a, b) => a.inicio - b.inicio || a.fin - b.fin);
    const eventos: EventoCalendarioDocente[] = [];

    // Si existen traslapes en datos históricos, mostrar los bloques lado a lado.
    let grupo: SesionConMinutos[] = [];
    let finGrupo = -1;
    const colocarGrupo = () => {
      if (!grupo.length) return;
      const ocupadasHasta: number[] = [];
      const posiciones = grupo.map(item => {
        let columna = ocupadasHasta.findIndex(fin => fin <= item.inicio);
        if (columna === -1) columna = ocupadasHasta.length;
        ocupadasHasta[columna] = item.fin;
        return columna;
      });
      const columnas = ocupadasHasta.length;
      grupo.forEach((item, indice) => {
        const duracion = (item.fin - item.inicio) * ALTO_HORA_DOCENTE / 60;
        eventos.push({
          sesion: item.sesion,
          top: (item.inicio - desde) * ALTO_HORA_DOCENTE / 60,
          alto: duracion,
          izquierda: posiciones[indice] * 100 / columnas + 0.5,
          ancho: 100 / columnas - 1,
          compacto: duracion < 65
        });
      });
    };

    for (const item of ordenadas) {
      if (grupo.length && item.inicio >= finGrupo) {
        colocarGrupo();
        grupo = [];
      }
      grupo.push(item);
      finGrupo = Math.max(finGrupo, item.fin);
    }
    colocarGrupo();
    return { ...dia, eventos };
  });

  return { dias, horas, altura, noGraficadas };
}
