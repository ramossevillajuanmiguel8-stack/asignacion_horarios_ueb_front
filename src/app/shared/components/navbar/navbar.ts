import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthApiService } from '../../../services/auth-api';
import { NOMBRE_PERFIL, RolInterno } from '../../../core/perfiles/perfiles';

@Component({
  selector: 'app-navbar', standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.html', styleUrl: './navbar.scss'
})
export class Navbar {
  readonly auth = inject(AuthApiService);
  private readonly router = inject(Router);
  readonly saliendo = signal(false);
  readonly error = signal('');
  readonly nombreRol = computed(() => {
    const rol = this.auth.rol() as RolInterno | null;
    return rol ? NOMBRE_PERFIL[rol] ?? rol : 'Sin sesión';
  });

  salir(): void {
    if (this.saliendo()) return;
    this.saliendo.set(true);
    this.error.set('');
    this.auth.cerrarSesion().subscribe({
      next: () => {
        this.saliendo.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.saliendo.set(false);
        this.error.set('No fue posible cerrar sesión. Inténtalo otra vez.');
      }
    });
  }
}
