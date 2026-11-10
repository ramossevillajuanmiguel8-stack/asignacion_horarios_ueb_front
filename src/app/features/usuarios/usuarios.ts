import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DocentesService } from '../../services/docentes';
import { Docente } from '../../models/docente.model';
import { CrearUsuario, RolGestionable, UsuarioGestion, UsuariosService } from '../../services/usuarios';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {
  private readonly api = inject(UsuariosService);
  private readonly docentesApi = inject(DocentesService);

  readonly usuarios = signal<UsuarioGestion[]>([]);
  readonly docentes = signal<Docente[]>([]);
  readonly cargando = signal(false);
  readonly procesando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly filtro = signal('');
  readonly mostrarFormulario = signal(false);
  readonly confirmarId = signal<number | null>(null);
  readonly filtrados = computed(() => this.usuarios().filter(u =>
    `${u.identificador} ${u.rol} ${u.docenteNombre ?? ''}`.toLocaleLowerCase()
      .includes(this.filtro().trim().toLocaleLowerCase())));

  readonly roles: { valor: RolGestionable; etiqueta: string }[] = [
    { valor: 'COMITE_TACTICO', etiqueta: 'Comité Táctico' },
    { valor: 'COORDINACION_ACADEMICA', etiqueta: 'Coordinación Académica' },
    { valor: 'DOCENTE', etiqueta: 'Docente' }
  ];
  formulario: CrearUsuario = this.nuevoFormulario();

  ngOnInit(): void {
    this.recargar();
    this.docentesApi.listar().subscribe({
      next: datos => this.docentes.set(datos),
      error: () => this.error.set('No se pudieron cargar los docentes para asociar cuentas.')
    });
  }

  nuevoFormulario(): CrearUsuario {
    return { identificador: '', password: '', rol: 'COORDINACION_ACADEMICA', docenteId: null };
  }

  nuevo(): void {
    this.formulario = this.nuevoFormulario();
    this.error.set('');
    this.mensaje.set('');
    this.mostrarFormulario.set(true);
  }

  recargar(): void {
    this.cargando.set(true);
    this.api.listar().pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: datos => this.usuarios.set(datos),
      error: e => this.error.set(this.mensajeError(e, 'No se pudieron cargar los usuarios.'))
    });
  }

  crear(): void {
    if (this.procesando()) return;
    const datos: CrearUsuario = {
      ...this.formulario,
      identificador: this.formulario.identificador.trim(),
      docenteId: this.formulario.rol === 'DOCENTE' ? this.formulario.docenteId : null
    };
    if (datos.identificador.length < 3 || datos.password.length < 12 || datos.password.length > 72 ||
        (datos.rol === 'DOCENTE' && !datos.docenteId)) {
      this.error.set('Revisa el identificador, la contraseña (12 a 72 caracteres) y el docente asociado.');
      return;
    }
    this.procesando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api.crear(datos).pipe(finalize(() => this.procesando.set(false))).subscribe({
      next: () => {
        this.formulario = this.nuevoFormulario(); // Descarta la contraseña del formulario.
        this.mostrarFormulario.set(false);
        this.mensaje.set('Cuenta creada correctamente.');
        this.recargar();
      },
      error: e => this.error.set(this.mensajeError(e, 'No se pudo crear la cuenta.'))
    });
  }

  solicitarEstado(id: number): void {
    this.confirmarId.set(this.confirmarId() === id ? null : id);
  }

  cambiarEstado(u: UsuarioGestion): void {
    if (this.procesando()) return;
    this.confirmarId.set(null);
    this.procesando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api.cambiarEstado(u.id, !u.activo)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => { this.mensaje.set('Estado de la cuenta actualizado.'); this.recargar(); },
        error: e => this.error.set(this.mensajeError(e, 'No se pudo modificar el estado.'))
      });
  }

  etiquetaRol(rol: string): string {
    return this.roles.find(r => r.valor === rol)?.etiqueta ?? rol;
  }

  private mensajeError(e: HttpErrorResponse, defecto: string): string {
    if (e.status === 401) return 'Debes iniciar sesión.';
    if (e.status === 403) return 'Solo Comité Táctico puede administrar usuarios.';
    if (e.status === 409) return 'La operación entra en conflicto con una cuenta existente o una restricción de seguridad.';
    if (e.status === 400) return 'Los datos no son válidos. Revisa el rol, el docente y la contraseña.';
    return defecto;
  }
}
