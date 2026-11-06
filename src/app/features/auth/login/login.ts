import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RolInterno } from '../../../core/perfiles/perfiles';
import { SesionVistaPrevia } from '../../../core/perfiles/sesion-vista-previa';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private sesion = inject(SesionVistaPrevia);

  ocultarPassword = true;
  mensaje = '';
  rolDemo: RolInterno = 'COORDINACION_ACADEMICA';

  loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    // NO autenticar en cliente. Integración posterior con Spring Security.
    this.mensaje = 'Autenticación real pendiente: se implementará con Spring Boot.';
  }

  probarPerfil(): void {
    this.sesion.seleccionar(this.rolDemo);
    void this.router.navigateByUrl(this.sesion.rutaInicial());
  }
}
