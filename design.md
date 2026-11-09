# Design — Nubisfera

Sistema de diseño bloqueado para la app. Cada redisen̄o/página de Nubisfera
lee este archivo antes de emitir código. No se regenera por página — se
amplía o modifica aquí cuando el sistema necesita crecer.

## Genre

Atmospheric (con desviación deliberada de acento: frío azul/cian en vez del
acento cálido por defecto del genre, para preservar la identidad de marca
"cielo nocturno / cielo diurno").

## Ruta de tema

Custom (tuned) — no catálogo. Ancla de marca preservada: azul `#2E4DEE` /
cian `#5DDFFF`, reconstruidos en OKLCH con tintado consistente.

## Macrostructure family

- **Home (marketing/landing)**: Marquee Hero — el buscador de municipios ES
  la acción única del fold; sin subtítulo largo, sin CTA secundaria. Tras
  seleccionar un municipio, la página se transforma en la vista de
  predicción (fuera del fold original).
- **Páginas app** (Dashboard, Comparar, Timeline, Logros): familia
  "instrument panel" — grid de widgets con datos reales en vivo (variación
  de Bento adaptada a widgets funcionales, no capturas de pantalla). Sin
  enrichment decorativo: la función manda. Timeline usa cabecera
  sticky-pinned para orientación durante el playback.
- **Acerca de (contenido)**: Stat-Led — estadísticas reales del proyecto
  como hero, seguidas de una secuencia de pasos ("cómo funciona").

## Tema

### Modo Noche (dark, por defecto)
- `--color-paper` (`--background-dark`) — oklch(16% 0.03 260)
- `--color-paper-2` (`--surface-dark`) — oklch(20% 0.035 260)
- `--color-paper-3` (`--surface-elevated`) — oklch(28% 0.045 256)
- `--color-ink` (`--text-primary`) — oklch(94% 0.015 240)
- `--color-ink-2` (`--text-secondary`) — oklch(78% 0.02 240)
- `--color-rule` (`--border-medium`) — oklch(94% 0.015 240 / 12%)
- `--color-accent` (`--accent-cyan`) — oklch(78% 0.14 215)
- `--color-accent-2` (`--primary-blue`) — oklch(52% 0.19 265)
- `--color-focus` — oklch(80% 0.19 215)

### Modo Día (light, excepción tipo "Day Foundry")
- `--color-paper` — oklch(97% 0.012 230)
- `--color-paper-2` — oklch(94% 0.016 230)
- `--color-ink` — oklch(22% 0.03 255)
- `--color-ink-2` — oklch(40% 0.025 255)
- `--color-rule` — oklch(22% 0.03 255 / 12%)
- `--color-accent-2` (azul, acento primario en claro) — oklch(52% 0.19 265)
- `--color-accent` (cian, acento secundario) — oklch(58% 0.14 217)
- `--color-focus` — oklch(55% 0.20 265)

Activación: clases `light-mode` / `light-theme` en `<html>`, gestionadas por
`ThemeService` (`mode`: `light` | `dark` | `auto`, persistido en
`localStorage`).

**Ejes de diversificación**: dual (paper-band dark + light) / display-style
geometric-condensed / accent-hue cool (~215–265°).

## Typography

- Display: **Tomorrow**, peso 600/700, `font-style: normal` (nunca itálica).
- Body: **Geist**, peso 400/500.
- Outlier/mono: **JetBrains Mono** — SOLO en ≤2 roles: la cifra hero de
  temperatura y las lecturas de datos/timestamps en dashboard/timeline.
- Display tracking: `-0.01em` a `-0.03em` en titulares grandes.
- Escala: `--text-xs` … `--text-5xl` fluida (clamp) + `--text-display` para
  hero.

## Spacing

Escala de 8pt nombrada en `src/tokens.css` (`--space-0` … `--space-32`).
Los componentes deben usar los tokens, nunca valores sueltos.

## Motion

- Easings: `--ease-out`, `--ease-in`, `--ease-in-out` (nunca el `ease` por
  defecto del navegador). `--ease-elastic` queda solo por compatibilidad;
  no debe usarse en estados de interacción de UI (hover/focus/active).
- Reveals decorativos: fade + lift sutil únicamente. Nada de bounce/overshoot
  en estados de UI.
- Motion funcional de datos (D3 en timeline/mapa, GSAP en timeline, Chart.js,
  gauges, confetti de logros) se conserva — no está sujeto a la regla de
  "reveal" porque es visualización de datos reales, no decoración.
- `prefers-reduced-motion: reduce` colapsa animaciones a fade ≤150ms.

## Microinteractions stance

- Éxito silencioso por defecto; confetti reservado a hitos reales de
  gamificación (level-up, logro desbloqueado), no a acciones menores.
- Foco visible instantáneo (`--color-focus`), nunca animado en su aparición.

## CTA voice

- Primaria: fill sólido con `--color-accent-2` (azul), texto `--color-accent-ink`.
- Secundaria: outline/chip transparente con `--color-rule`.
- Radios: `--radius-lg` (12px) por defecto en botones; `--radius-full` en
  pills de navegación/filtros.

## Nav y footer

- **Nav**: N5 Floating pill — pill flotante con blur sobre el canvas oscuro,
  cluster de acciones a la derecha (badge de logros/nivel, toggle de tema,
  instalar PWA).
- **Footer**: Ft1 Mast-headed — wordmark + tagline ancla una sola banda
  horizontal, 2-3 enlaces al lado, línea de créditos debajo. Sustituye al
  patrón anterior (columnas tipo índice), que es un anti-patrón conocido en
  temas atmosféricos.

## Per-page allowances

- Home PUEDE usar el buscador como enrichment funcional único (Marquee).
- Páginas app NO usan enrichment decorativo — los widgets con datos reales
  (D3, Three.js, Chart.js) SON el contenido, no decoración.
- Acerca de: solo estadísticas reales del proyecto (nº de municipios,
  fuente Open-Meteo, PWA, open-source) — nunca métricas inventadas.

## What pages MUST share

- El wordmark "Nubisfera" y su icono.
- El acento azul/cian y su rol (≤ ~5% de superficie por vista salvo en
  botones primarios y estados activos).
- Tipografía Tomorrow + Geist + JetBrains Mono (outlier).
- Voz de CTA (forma, radio, padding).
- Nav N5 + Footer Ft1 en todas las rutas.

## What pages MAY differ on

- Macrostructure dentro de la familia de su tipo de página.
- Composición interna de widgets en páginas app.

## Exports

### tokens.css
Ver [`src/tokens.css`](src/tokens.css) — fuente de verdad, ya integrado en
`src/styles.css` vía `@import`.

## Registro de ejecuciones

Ver [`.hallmark/log.json`](.hallmark/log.json).

## Mobile consultation — 2026-11-09 (supersedes desktop-first layout rules)

The application is designed for mobile browsers, including when viewed on a wider screen.
Primary family: single-column weather instrument, maximum reading width 32rem.
The homepage is a consultation, not a marketing hero. First visit: explicit city search
or geolocation action. Returning visit: last successful city, cached weather visible
while updating. Search and daily detail use full-screen accessible panels with focus
restoration, Escape and keyboard containment. No destructive return-to-search action.

Navigation: bottom bar with Tiempo / Lugares / Más, safe-area aware. Secondary routes
remain available under Más, constrained to the same mobile column. This replaces the
floating navigation and global marketing footer requirement for primary views.
Temperature, sky condition, feels-like and high/low lead; hourly strip, compact daily
rows, and optional detail follow. Favorites and recent cities persist in the browser.
No installation banner or gamification toast in the primary consultation.

Keep existing blue/cyan dual palette and Tomorrow / Geist pairing. SVG weather icons
are local and do not depend on icon-font downloads. Use shared mobile tokens in
src/tokens.css. No particles, decorative motion, gradient headlines or faux phone frame.
Forecast summaries are derived from hourly probabilities and are not official alerts.
All displayed forecast times are local to the selected location. Offline and failed
updates retain the last successful consultation with an explicit saved-data label.

Validation targets: 320 / 375 / 414 / 768 px, both themes, enlarged text, reduced motion,
keyboard navigation, location denial, network failure and rapid city changes.
