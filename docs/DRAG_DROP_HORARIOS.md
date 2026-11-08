# Drag and drop de horarios — UEB

## Alcance

Se agregó arrastrar/soltar a **Gestión de Horarios → Calendario semanal** sin cambiar el backend ni la base de datos. La implementación usa `@angular/cdk/drag-drop` ya declarado en `package.json` y sigue utilizando el formulario manual de movimientos como alternativa.

## Autorización y persistencia

- Sólo `COMITE_TACTICO` y `COORDINACION_ACADEMICA` pueden arrastrar sesiones de un horario `BORRADOR`. El permiso visual `AJUSTAR_SESIONES` se deriva del rol de `/auth/me`.
- Los horarios `PUBLICADO` se muestran en modo lectura. Los usuarios `DOCENTE` y los estudiantes no tienen acceso al módulo administrativo de horarios.
- La autoridad definitiva es **Spring Security**. El frontend no concede permisos de servidor.
- Al soltar una sesión, **no se muta el calendario ni la base de datos**. Se llama a `POST /api/v1/horarios/{id}/validar` con `{grupoId,dia,horaInicio,sesionExcluida}`. Las incidencias se presentan tal como las devuelve el servidor.
- Sólo con validación permitida, confirmación explícita y `PUT /api/v1/horarios/{id}/sesiones/{sesionId}` con `{dia,horaInicio}` se solicita guardar. `aplicado: false` conserva el estado actual. Si `aplicado: true`, se vuelve a consultar el historial desde Spring Boot/MySQL.
- Las solicitudes continúan pasando por el interceptor que añade cookies de sesión y por la protección CSRF ya existente.
- `401` expira la sesión en la aplicación; `403` indica falta de permisos; `409` informa que el borrador dejó de ser editable. Cambios concurrentes se validan nuevamente en el backend.

## Franjas

Se calculan con `horaInicioSemana`, `horaFinSemana`, `horaInicioSabado`, `horaFinSabado`, `duracionBloqueMin` y el almuerzo de cada período. Los destinos que cruzan el almuerzo se excluyen visualmente. El backend sigue siendo responsable de comprobar todas las restricciones, inclusive docente ocupado.

El calendario no oculta sesiones históricas fuera de una franja vigente: siguen disponibles en la tabla de detalle inferior.

## Probar localmente

1. `npm ci` (si es necesario) y `npm start` en la carpeta Angular. Node debe ser compatible con Angular 22.
2. Iniciar MySQL y Spring Boot con el perfil `mysql`; entrar con `coordinacion.test`.
3. Ir a **Gestión de Horarios**, seleccionar período **5** y horario **63** (borrador).
4. Arrastrar sesión **57** (lunes 09:00) sobre lunes **07:00–09:00**. Debe aparecer **DOCENTE_OCUPADO**, sin confirmación habilitada y sin mover la tarjeta.
5. Probar un destino libre; debe mostrarse “Movimiento permitido”. **Cancelar** no cambia nada. **Confirmar** envía el PUT y solo después de `aplicado: true` recarga la ubicación desde el backend.
6. Seleccionar período **4**, horario **62** (publicado). No debe permitir arrastrar ni mostrar controles de edición.
7. Verificar que el rol `DOCENTE` no puede abrir `/horarios`, ni siquiera introduciendo la URL manualmente.
8. En el navegador (F12 → Network), confirmar el orden `POST /validar` → confirmación del usuario → `PUT /sesiones/{id}` → `GET /periodos/{periodoId}/horarios`. Nunca enviar un PUT para movimientos rechazados.

## Pruebas automatizadas añadidas

- `horario-grid.spec.ts`: franjas, almuerzo, sábado, sesiones históricas fuera de bloque y entradas inválidas.
- `horarios-dnd.spec.ts`: rechazo por DOCENTE_OCUPADO, confirmación de movimiento permitido y protección por rol/estado.

Ejecutar, en un entorno con Node y dependencias nativas compatibles, `npm test -- --watch=false`. Además: `npm run build`.
