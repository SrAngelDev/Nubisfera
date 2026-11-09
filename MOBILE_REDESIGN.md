# Nubisfera: rediseño para navegador móvil

Implementado el 9 de noviembre de 2026. Sistema visual compartido en `design.md`.

## Experiencia entregada

- Una columna móvil también en pantallas grandes. Navegación inferior: Tiempo, Lugares y Más.
- Primera consulta con búsqueda explícita o ubicación bajo demanda. No se solicita permiso al abrir.
- Temperatura, sensación, máxima/mínima, resumen de lluvia derivado de la previsión, horas y días compactos.
- Búsqueda a pantalla completa, sin abandonar ni borrar la consulta actual. Selección explícita entre localidades.
- Favoritos y recientes persistidos en este navegador. Se restaura la última localidad consultada correctamente.
- Detalle diario con previsión horaria, probabilidad y cantidad de precipitación diferenciadas.
- Actualización real de datos; las respuestas de consultas anteriores no sustituyen la localidad más reciente.
- Datos guardados visibles al actualizar, al fallar la red y sin conexión, con indicación de antigüedad.
- Tema claro, oscuro o del sistema; instalación discreta en Más, sin banner inferior.
- Las funciones existentes de comparación, panel, cronología, logros y acerca de se conservan en Más.
- SVG locales, controles táctiles, zonas seguras, foco de teclado, Escape y restauración del foco en los paneles.
- Fechas y horas de la localidad consultada. Los resúmenes no se presentan como avisos oficiales.

## Implementación

La entrada usa `MobileWeatherComponent` y `MobileShellComponent`. Los componentes anteriores
se conservan. `MobilePlacesService` gestiona persistencia y recuperación de fechas del caché.
La opción estricta de `WeatherService` propaga errores en lugar de inventar un estado de 0 °C
y mantiene instantes UTC reales con formato local en la nueva interfaz. Las rutas anteriores
mantienen su modo de compatibilidad. La página Acerca de se carga solo cuando se visita.

## Verificación

- Compilación de producción: correcta. Advertencia existente de optimización CommonJS de `openmeteo`.
- 19 pruebas automatizadas en Chrome Headless: correctas.
- Anchos de 320, 375, 414 y 768 px en iframes con viewport propio: vistas principales y paneles, ambos temas.
- Texto al 200%: vistas Tiempo, Lugares y Más, sin desbordar la columna en esos cuatro anchos.
- Persistencia, búsqueda cancelada, selección rápida, error inicial con reintento, actualización fallida,
  permiso de ubicación denegado, restauración sin conexión y zona horaria de Tokio.
- Consulta real a Open-Meteo: respuestas correctas para Madrid y Tokio con sus respectivas zonas horarias.

Pendiente de comprobación manual en dispositivos físicos: Safari de iPhone, teclado virtual,
instalación real y gestos. Las comprobaciones automatizadas de geometría no sustituyen esa revisión.

No se ha publicado ni desplegado el proyecto.
