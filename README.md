# Asignación de Horarios UEB — Frontend integrado con Spring Security

Frontend Angular 22 para el sistema de Asignación de Horarios de la Universidad El Bosque.

## Qué se corrigió

- Se eliminó el selector de **vista previa de perfiles** y el `sessionStorage` usado para simular roles.
- El inicio de sesión envía `identificador` y `password` a `POST /api/v1/auth/login`.
- La identidad y el rol provienen de `GET /api/v1/auth/me`; nunca del navegador.
- Antes del login se consulta `GET /api/v1/auth/csrf`; se actualiza el token al terminar.
- Angular envía `X-XSRF-TOKEN` en las mutaciones, con `XSRF-TOKEN` como cookie, usando rutas relativas.
- Todas las solicitudes `/api/v1/...` incluyen las cookies de sesión y pasan por el proxy de desarrollo.
- Los guards comprueban la sesión en el servidor antes de entrar a las rutas privadas y filtran la navegación por rol.
- Cierre de sesión mediante `POST /api/v1/auth/logout`.
- La consulta estudiantil usa únicamente rutas `/api/v1/publico/...`, sin endpoints administrativos.
- «Mi horario» usa `GET /api/v1/docentes/me/horario-publicado?periodoId=...`, sin pedir el ID del docente.
- Comité Táctico puede publicar borradores mediante el endpoint autorizado del backend.
- Se corrigió la previsualización de movimientos: ahora envía los campos obligatorios en lugar de `{}`.
- Dashboard muestra conteos consultados en el backend, no datos de ejemplo.

## 1. Iniciar MySQL

En Windows, verifica el servicio: `Get-Service *mysql*`. Si no está ejecutándose,
arráncalo desde Servicios de Windows. No recrees la base de datos ni los usuarios.

## 2. Iniciar backend (otra ventana PowerShell)

En la carpeta `backend` de tu repositorio, configura las variables que ya utiliza tu
`application-mysql.properties` y ejecuta:

```powershell
function Leer-Clave {
  param([string]$mensaje)
  $segura = Read-Host $mensaje -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
$env:FLYWAY_DB_PASSWORD = Leer-Clave 'Clave de horarios_migra'
$env:DB_PASSWORD = Leer-Clave 'Clave de horarios_app'
mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Deja esta terminal abierta. El backend se expone en `http://localhost:8080`.
Prueba sin autenticación:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/publico/periodos/4/horario-vigente
```

Debería mostrar el horario QA `62` PUBLICADO si estás usando la misma base de datos validada.

## 3. Iniciar frontend (otra ventana PowerShell)

Se requiere **Node.js 22.22.3 o superior compatible con Angular 22** (o Node 24.15.0+).
En la carpeta de este frontend:

```powershell
node -v
npm ci
npm start
```

Abre **http://localhost:4200**. No abras la interfaz desde `localhost:8080`,
ni hagas llamadas a la API con una URL absoluta: usa siempre `/api/v1` para
conservar el origen y las cookies con el proxy de Angular (`proxy.conf.json`).

## 4. Probar la seguridad y los datos en el navegador

1. Abre `/consulta-publica` **sin iniciar sesión**. Carga el período `4`, selecciona
   `Curso Prueba Backend QA 01` y comprueba las dos sesiones del horario publicado 62.
   Prueba también la descarga del CSV.
2. Intenta entrar a `/dashboard` sin iniciar sesión: debe redirigir a `/login`.
3. Inicia sesión como `coordinacion.test` con su contraseña real. Deben aparecer
   docentes, cursos, períodos, grupos, horarios y estadísticas reales. No debe aparecer Aprobación.
4. Actualiza la página: la sesión debe mantenerse y `/api/v1/auth/me` devolver HTTP 200.
5. Cierra sesión: debe ejecutarse `POST /api/v1/auth/logout`. Después el panel debe requerir login.
6. Inicia sesión como `comite.inicial`: debe aparecer la opción de publicación.
   **No publiques horarios de producción para probar la interfaz**.
7. Inicia sesión como `docente.test` y visita «Mi horario». Usa el período `1` (QA
   previa, con un horario publicado para ese docente). No debe haber menús administrativos.
8. En F12 → Network revisa que `/api/v1/auth/csrf`, `/login`, `/me` y `/logout`
   se envíen a `localhost:4200/api/v1/...` y que los `POST` y `PUT` lleven
   `X-XSRF-TOKEN`.

## Alcance y limitaciones actuales

- **No modificamos el backend ni MySQL**: este paquete contiene únicamente el frontend.
- El backend actual no expone un **catálogo público de períodos o cursos**, por lo que
  la página estudiantil pide el número del período y deriva los cursos del horario publicado.
- El endpoint docente tampoco ofrece un catálogo de períodos accesible desde ese rol;
  «Mi horario» pide el número del período.
- No existe un endpoint implementado para cerrar grupos desde Comité Táctico; la vista
  solo implementa publicación, no finge un cierre.
- La protección real de los datos la proporciona **Spring Security**. Los guards de Angular
  son solo para navegación. No almacenes credenciales ni roles en `localStorage`.
- El paquete ZIP omite `node_modules`, `dist` y los cachés. Instala dependencias con `npm ci`.
- Esta entrega se ha validado mediante TypeScript y el compilador de plantillas de Angular.
  Las pruebas de extremo a extremo con un servidor MySQL real deben completarse en tu equipo.
