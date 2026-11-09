import { describe, expect, it } from 'vitest';
import { puede } from './perfiles';

describe('Matriz de capacidades visuales', () => {
  it('solo Comité puede publicar y decidir el cierre', () => {
    expect(puede('COMITE_TACTICO', 'APROBAR_PUBLICAR')).toBe(true);
    expect(puede('COMITE_TACTICO', 'DECIDIR_CIERRE')).toBe(true);
    expect(puede('COORDINACION_ACADEMICA', 'APROBAR_PUBLICAR')).toBe(false);
    expect(puede('DOCENTE', 'APROBAR_PUBLICAR')).toBe(false);
  });

  it('Coordinación ajusta borradores pero no publica', () => {
    expect(puede('COORDINACION_ACADEMICA', 'AJUSTAR_SESIONES')).toBe(true);
    expect(puede('COORDINACION_ACADEMICA', 'GENERAR_PROPUESTA')).toBe(true);
    expect(puede('COORDINACION_ACADEMICA', 'DECIDIR_CIERRE')).toBe(false);
  });

  it('Docente ve su horario y Estudiante solo consulta lo publicado', () => {
    expect(puede('DOCENTE', 'VER_HORARIO_PROPIO')).toBe(true);
    expect(puede('DOCENTE', 'GESTION_ACADEMICA')).toBe(false);
    expect(puede('ESTUDIANTE', 'VER_HORARIO_PUBLICADO_CURSO')).toBe(true);
    expect(puede('ESTUDIANTE', 'VER_HORARIO_PROPIO')).toBe(false);
  });
});
