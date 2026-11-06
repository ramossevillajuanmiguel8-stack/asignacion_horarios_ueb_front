/** Tabla 6: roles institucionales definidos en la documentación. */
export type RolInterno =
  | 'COMITE_TACTICO'
  | 'COORDINACION_ACADEMICA'
  | 'DOCENTE';

/** El estudiante es usuario indirecto: consulta pública, no sesión interna. */
export type PerfilSistema = RolInterno | 'ESTUDIANTE';

export const NOMBRE_PERFIL: Record<PerfilSistema, string> = {
  COMITE_TACTICO: 'Comité Táctico',
  COORDINACION_ACADEMICA: 'Coordinación académica',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante'
};

/** Capacidades de interfaz; NO sustituyen la autorización del backend. */
export type Permiso =
  | 'GESTION_ACADEMICA'
  | 'GENERAR_PROPUESTA'
  | 'AJUSTAR_SESIONES'
  | 'REGISTRAR_RESTRICCIONES'
  | 'APROBAR_PUBLICAR'
  | 'DECIDIR_CIERRE'
  | 'VER_HORARIO_PROPIO'
  | 'VER_HORARIO_PUBLICADO_CURSO';

export const PERMISOS: Record<PerfilSistema, readonly Permiso[]> = {
  COMITE_TACTICO: [
    'GESTION_ACADEMICA', 'GENERAR_PROPUESTA', 'AJUSTAR_SESIONES',
    'REGISTRAR_RESTRICCIONES', 'APROBAR_PUBLICAR',
    'DECIDIR_CIERRE', 'VER_HORARIO_PUBLICADO_CURSO'
  ],
  COORDINACION_ACADEMICA: [
    'GESTION_ACADEMICA', 'GENERAR_PROPUESTA', 'AJUSTAR_SESIONES',
    'REGISTRAR_RESTRICCIONES', 'VER_HORARIO_PUBLICADO_CURSO'
  ],
  DOCENTE: ['VER_HORARIO_PROPIO'],
  ESTUDIANTE: ['VER_HORARIO_PUBLICADO_CURSO']
};

export function puede(rol: PerfilSistema, permiso: Permiso): boolean {
  return PERMISOS[rol].includes(permiso);
}
