export type RolUsuario =
  | 'COMITE_TACTICO'
  | 'COORDINACION_ACADEMICA'
  | 'DOCENTE'
  | 'ESTUDIANTE';

export interface SesionActual {
  id: number;
  identificador: string;
  rol: RolUsuario;
  docenteId: number | null;
}

export interface CredencialesLogin {
  identificador: string;
  password: string;
}

export interface RespuestaCsrf {
  headerName: string;
  token: string;
}