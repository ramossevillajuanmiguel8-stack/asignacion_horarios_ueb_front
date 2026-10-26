export type TipoVinculacion =
  | 'TC'
  | 'TRES_CUARTOS'
  | 'MEDIO_TIEMPO'
  | 'CUARTO_TIEMPO';

export type TipoRestriccion =
  | 'FIRME'
  | 'PREFERENCIA';

export type SentidoRestriccion =
  | 'DISPONIBLE'
  | 'NO_DISPONIBLE';

export interface Docente {
  id: number;
  nombre: string;
  tipoVinculacion: TipoVinculacion;
  especialidades: string[];
}

export interface RestriccionHoraria {
  id?: number;
  dia: number;
  horaInicio: string;
  horaFin: string;
  tipo: TipoRestriccion;
  sentido: SentidoRestriccion;
}

export interface CrearDocenteRequest {
  nombre: string;
  tipoVinculacion: TipoVinculacion;
  especialidades: string[];
  sinRestricciones: boolean;
  restricciones: RestriccionHoraria[];
}

export interface CrearDocenteResponse {
  id: number;
  nombre: string;
}