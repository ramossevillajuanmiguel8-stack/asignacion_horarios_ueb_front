export interface PeriodoAcademico {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;

  horaInicioSemana: string;
  horaFinSemana: string;

  horaInicioSabado: string;
  horaFinSabado: string;

  almuerzoInicio: string;
  almuerzoFin: string;

  duracionBloqueMin: number;
  maxSesionesSemana: number;

  cupoMaximoBase: number;
  toleranciaCupoPct: number;
  cupoMinimo: number;
}

export interface CrearPeriodoRequest {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ParametrosPeriodoRequest {
  horaInicioSemana: string;
  horaFinSemana: string;
  horaInicioSabado: string;
  horaFinSabado: string;
  almuerzoInicio: string;
  almuerzoFin: string;
  duracionBloqueMin: number;
  maxSesionesSemana: number;
  cupoMaximoBase: number;
  toleranciaCupoPct: number;
  cupoMinimo: number;
}