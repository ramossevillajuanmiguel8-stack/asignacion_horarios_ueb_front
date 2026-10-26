export interface Grupo {
  id: number;
  periodoId: number;
  cursoId: number;
  docenteId: number;
  codigo: string;
  inscritos: number;
  limiteOperativo: number;
  candidatoCierre: boolean;
  necesitaAulaEspecial: boolean;
}

export interface CrearGrupoRequest {
  periodoId: number;
  cursoId: number;
  docenteId: number;
  codigo: string;
  cupoMaximo: number | null;
  cupoMinimo: number | null;
  inscritos: number;
}