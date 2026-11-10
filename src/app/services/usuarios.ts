import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type RolGestionable = 'COMITE_TACTICO' | 'COORDINACION_ACADEMICA' | 'DOCENTE';

export interface UsuarioGestion {
  id: number;
  identificador: string;
  rol: RolGestionable;
  docenteId: number | null;
  docenteNombre: string | null;
  activo: boolean;
}

export interface CrearUsuario {
  identificador: string;
  password: string;
  rol: RolGestionable;
  docenteId: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/usuarios`;

  listar(): Observable<UsuarioGestion[]> {
    return this.http.get<UsuarioGestion[]>(this.url);
  }

  crear(datos: CrearUsuario): Observable<UsuarioGestion> {
    return this.http.post<UsuarioGestion>(this.url, datos);
  }

  cambiarEstado(id: number, activo: boolean): Observable<UsuarioGestion> {
    return this.http.patch<UsuarioGestion>(`${this.url}/${id}/estado`, { activo });
  }
}
