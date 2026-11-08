import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api';
import { SesionActual } from '../models/sesion.model';

describe('AuthApiService: autenticación con servidor', () => {
  let auth: AuthApiService;
  let http: HttpTestingController;
  const usuario: SesionActual = {
    id: 4, identificador: 'coordinacion.test',
    rol: 'COORDINACION_ACADEMICA', docenteId: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
        provideHttpClientTesting()
      ]
    });
    auth = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene la identidad real de /auth/me después del login', () => {
    let resultado: SesionActual | undefined;
    auth.iniciarSesion({ identificador: usuario.identificador, password: 'clave-simulada' })
      .subscribe(respuesta => resultado = respuesta);

    http.expectOne('/api/v1/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN', token: 'csrf-1' });

    const login = http.expectOne('/api/v1/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body.identificador).toBe('coordinacion.test');
    login.flush({});

    const me = http.expectOne('/api/v1/auth/me');
    expect(me.request.method).toBe('GET');
    me.flush(usuario);

    http.expectOne('/api/v1/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN', token: 'csrf-2' });
    expect(resultado?.rol).toBe('COORDINACION_ACADEMICA');
    expect(auth.rol()).toBe('COORDINACION_ACADEMICA');
  });

  it('limpia la sesión si /auth/me responde 401', () => {
    let resultado: SesionActual | null | undefined = undefined;
    auth.obtenerSesion().subscribe(sesion => resultado = sesion);
    http.expectOne('/api/v1/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(resultado).toBeNull();
    expect(auth.autenticado()).toBe(false);
  });

  it('hace logout en Spring Security en vez de borrar solo un rol local', () => {
    auth.cerrarSesion().subscribe();
    http.expectOne('/api/v1/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN', token: 'csrf' });
    const logout = http.expectOne('/api/v1/auth/logout');
    expect(logout.request.method).toBe('POST');
    logout.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.autenticado()).toBe(false);
  });
});
