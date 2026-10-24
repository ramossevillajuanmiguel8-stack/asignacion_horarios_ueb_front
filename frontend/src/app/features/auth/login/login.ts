import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private fb = inject(FormBuilder);

  ocultarPassword = true;
  mensaje = '';

  loginForm = this.fb.nonNullable.group({
    correo: ['', [
      Validators.required,
      Validators.email
    ]],
    password: ['', [
      Validators.required
    ]]
  });

  iniciarSesion() {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Pendiente: conectar con el endpoint
    // de autenticación de Spring Boot.
    this.mensaje =
      'Formulario válido. Falta conectar la autenticación con el backend.';
  }
}