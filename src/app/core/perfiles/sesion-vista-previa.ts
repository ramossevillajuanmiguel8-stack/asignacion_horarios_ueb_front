import { Injectable, signal } from '@angular/core';
import { NOMBRE_PERFIL, RolInterno } from './perfiles';

/**
 * Simulación EXCLUSIVA para revisar la interfaz antes de integrar Spring Security.
 * El valor proviene del navegador y NUNCA debe autorizar una petición en backend.
 * Se sustituirá por la identidad confirmada por /auth/me.
 */
@Injectable({ providedIn: 'root' })
export class SesionVistaPrevia {
  private readonly clave = 'ueb_perfil_vista_previa';
  private readonly _rol = signal<RolInterno | null>(this.cargar());
  readonly rol = this._rol.asReadonly();

  private cargar(): RolInterno | null {
    if (typeof sessionStorage === 'undefined') return null;
    const valor = sessionStorage.getItem(this.clave);
    return valor === 'COMITE_TACTICO' ||
      valor === 'COORDINACION_ACADEMICA' || valor === 'DOCENTE'
      ? valor : null;
  }

  seleccionar(rol: RolInterno): void {
    // Selector de VISTA; no hay autenticación ni credenciales.
    sessionStorage.setItem(this.clave, rol);
    this._rol.set(rol);
  }

  cerrar(): void {
    sessionStorage.removeItem(this.clave);
    this._rol.set(null);
  }

  nombre(): string {
    const rol = this._rol();
    return rol ? NOMBRE_PERFIL[rol] : 'Sin perfil';
  }

  rutaInicial(): string {
    return this._rol() === 'DOCENTE' ? '/mi-horario' : '/dashboard';
  }
}
