import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { UsuariosService } from './usuarios';

describe('UsuariosService (administración de Comité Táctico)', () => {
  let api: UsuariosService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista usando la ruta administrativa y no la pública', () => {
    api.listar().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/admin/usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('crea una cuenta sin adjuntar atributos adicionales', () => {
    api.crear({ identificador:'docente.prueba', password:'ContraseñaSegura123', rol:'DOCENTE', docenteId:4 }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/admin/usuarios`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ identificador:'docente.prueba', password:'ContraseñaSegura123', rol:'DOCENTE', docenteId:4 });
    req.flush({ id:1, identificador:'docente.prueba', rol:'DOCENTE', docenteId:4, docenteNombre:'Prueba', activo:true });
  });

  it('actualiza estado sin enviar contraseñas', () => {
    api.cambiarEstado(6, false).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/admin/usuarios/6/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ activo:false });
    req.flush({ id:6, identificador:'u6', rol:'DOCENTE', docenteId:4, docenteNombre:'Prueba', activo:false });
  });
});
