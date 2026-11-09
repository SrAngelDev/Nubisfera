# Actualizaciones automáticas de la PWA

La aplicación inicia `PwaUpdateService` desde el componente raíz. El servicio solo actúa
cuando el service worker está habilitado (compilación de producción con navegador compatible).

- Espera a que Angular esté estable para no retrasar el registro del worker.
- Comprueba versiones al iniciar, al volver a primer plano, al recuperar conexión y en `pageshow`.
- Repite la comprobación cada 15 minutos mientras la aplicación esté visible y conectada.
- Evita comprobaciones simultáneas.
- Recarga una sola vez por ejecución cuando Angular confirma que una versión está completamente descargada.
- Si la actualización termina en segundo plano o sin conexión, espera a que la aplicación esté visible y conectada.
- Si la comprobación o instalación falla, mantiene la versión actual y permite reintentar en el siguiente evento.
- No utiliza `activateUpdate()` ni borra cachés o almacenamiento de usuario; la recarga evita mezclar versiones de los módulos.

`netlify.toml` exige revalidación para HTML, manifiesto y scripts de control. `ngsw.json`
y `ngsw-worker.js` también llevan `Netlify-CDN-Cache-Control: no-store`. Los JS y CSS con
nombre versionado conservan su política normal de caché. Las cabeceras HTTP complementan
la caché gestionada por Angular, no la invalidan por sí solas.

## Primera distribución del mecanismo

Una instalación que todavía está ejecutando código antiguo no puede ejecutar este servicio
hasta descargar esta versión. Con el despliegue nuevo publicado y conexión disponible,
cerrar todas las ventanas de la web/PWA y volver a abrir permite al worker existente buscar
la nueva versión. Puede hacer falta un segundo cierre y apertura después de su descarga.
No se garantiza una actualización inmediata en aplicaciones cerradas o suspendidas por el sistema.

## Verificación

- Compilación de producción correcta; genera `ngsw.json` y `ngsw-worker.js`.
- 29 pruebas Chrome Headless correctas: las 19 anteriores y 10 de actualización de PWA.
- Casos nuevos: worker deshabilitado, estabilidad inicial, versión detectada frente a lista,
  descarga fallida, conexión, visibilidad, comprobación periódica, concurrencia y limpieza.

La validación local utiliza el worker simulado. Para comprobar el ciclo real tras publicar,
mantener una versión de producción abierta, desplegar otra y volver a la app con conexión:
debe descargar la nueva versión y recargarse conservando favoritos. El servidor local
`ng serve` tiene el worker deshabilitado y no reproduce ese ciclo.

Referencias: https://angular.dev/ecosystem/service-workers/communications y
https://docs.netlify.com/manage/routing/headers/.
