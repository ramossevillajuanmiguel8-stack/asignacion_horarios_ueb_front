import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../services/auth-api';
import { SesionActual } from '../../../models/sesion.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthApiService);

  ocultarPassword = true;
  enviando = signal(false);
  comprobando = signal(true);
  mensaje = signal('');

  loginForm = this.fb.nonNullable.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Retirar cualquier perfil de demostración almacenado por la versión anterior.
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('ueb_perfil_vista_previa');
    this.auth.obtenerSesion().subscribe({
      next: usuario => {
        this.comprobando.set(false);
        if (usuario) this.irAlInicio(usuario);
      },
      error: () => {
        this.comprobando.set(false);
        this.mensaje.set('No se pudo comprobar la conexión con el servidor.');
      }
    });
  }

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    if (this.enviando() || this.comprobando()) return;
    this.enviando.set(true);
    this.mensaje.set('');

    this.auth.iniciarSesion(this.loginForm.getRawValue()).subscribe({
      next: usuario => {
        this.enviando.set(false);
        this.loginForm.controls.password.reset();
        this.irAlInicio(usuario);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        if (error instanceof HttpErrorResponse) {
          this.mensaje.set(error.status === 401
            ? 'Identificador o contraseña incorrectos.'
            : error.status === 403
              ? 'Acceso denegado. Comprueba la sesión y vuelve a intentarlo.'
              : error.status === 0
                ? 'No hay conexión con el backend. Comprueba que Spring Boot está ejecutándose.'
                : 'No fue posible iniciar sesión. Inténtalo nuevamente.');
        } else {
          this.mensaje.set('No fue posible verificar la sesión.');
        }
      }
    });
  }

  private irAlInicio(usuario: SesionActual): void {
    const destino = usuario.rol === 'DOCENTE' ? '/mi-horario'
      : usuario.rol === 'COMITE_TACTICO' || usuario.rol === 'COORDINACION_ACADEMICA'
        ? '/dashboard' : '/consulta-publica';
    void this.router.navigateByUrl(destino);
  }
}
