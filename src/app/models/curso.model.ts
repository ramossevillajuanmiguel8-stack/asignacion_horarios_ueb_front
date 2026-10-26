export interface Curso {
  id: number;
  codigo: string | null;
  nombre: string;
  sesionesSemanales: number;
  duracionSesionMin: number;
  necesitaAulaEspecial: boolean;
}

export interface CrearCursoRequest {
  codigo: string | null;
  nombre: string;
  sesionesSemanales: number;
  duracionSesionMin: number;
  necesitaAulaEspecial: boolean;
}

export interface CrearCursoResponse {
  id: number;
  nombre: string;
}