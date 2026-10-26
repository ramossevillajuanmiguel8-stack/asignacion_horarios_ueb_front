export type EstadoHorario = 'BORRADOR' | 'PUBLICADO';

export interface SesionHorario {
  id: number;
  horarioId: number;
  grupoId: number;
  grupo: string;
  cursoId: number;
  curso: string;
  docenteId: number;
  docente: string;
  dia: number;
  horaInicio: string;
  horaFin: string;
  necesitaAulaEspecial: boolean;
}

export interface Horario {
  id: number;
  periodoId: number;
  estado: EstadoHorario;
  fechaCreacion: string;
  fechaPublicacion: string | null;
  sesiones: SesionHorario[];
}

export interface SesionNoUbicada {
  grupoId: number;
  curso: string;
  faltantes: number;
  motivo: string;
}

export interface IncidenciaHorario {
  codigo: string;
  nivel: string;
  motivo: string;
}

export interface ResultadoGeneracion {
  horarioId: number;
  sesionesGeneradas: number;
  noUbicadas: SesionNoUbicada[];
  advertencias: IncidenciaHorario[];
}