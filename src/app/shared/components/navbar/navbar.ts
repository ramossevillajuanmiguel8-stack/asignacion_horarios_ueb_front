import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SesionVistaPrevia } from '../../../core/perfiles/sesion-vista-previa';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  readonly sesion = inject(SesionVistaPrevia);
  private readonly router = inject(Router);

  salir(): void {
    this.sesion.cerrar();
    void this.router.navigateByUrl('/login');
  }
}
