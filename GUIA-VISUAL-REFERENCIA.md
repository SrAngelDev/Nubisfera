# 🎨 Guía Visual de Referencia - Nubisfera

## Inspiración y Referencias Visuales

---

## 🌟 Aplicaciones de Referencia

### Top 10 Aplicaciones Meteorológicas para Inspiración

1. **Apple Weather** (iOS 16+)
   - Diseño: Minimalista, limpio, elegante
   - Destacado: Animaciones fluidas, gráficos inline
   - Aprender de: Transiciones entre vistas, iconos animados

2. **AccuWeather Premium**
   - Diseño: Rico en datos, dashboards complejos
   - Destacado: Radar en tiempo real, múltiples widgets
   - Aprender de: Organización de información densa

3. **Weather Underground**
   - Diseño: Técnico, detallado, mapas avanzados
   - Destacado: Estaciones personales, datos hiperlocales
   - Aprender de: Sistema de mapas por capas

4. **Carrot Weather**
   - Diseño: Personalidad única, humor, easter eggs
   - Destacado: Gamification, logros, customización extrema
   - Aprender de: Engagement a través de personalidad

5. **YR.no** (Norwegian Meteorological Institute)
   - Diseño: Escandinavo, minimalista, funcional
   - Destacado: Gráficos limpios, sin distracciones
   - Aprender de: Claridad en visualización de datos

6. **Windyty (Windy.com)**
   - Diseño: Mapa-céntrico, animaciones de viento
   - Destacado: Capas interactivas, visualización espectacular
   - Aprender de: Animaciones de datos meteorológicos

7. **Dark Sky** (RIP - ahora Apple Weather)
   - Diseño: Iconografía única, predicción minuto a minuto
   - Destacado: Notificaciones predictivas
   - Aprender de: UX conversacional, simplicidad

8. **Weather Line**
   - Diseño: Timeline horizontal innovador
   - Destacado: Gráfico como UI principal
   - Aprender de: Navegación por línea temporal

9. **Hello Weather**
   - Diseño: Tipografía grande, bold, legible
   - Destacado: Personalización de datos mostrados
   - Aprender de: Jerarquía visual clara

10. **WeatherPro**
    - Diseño: Profesional, precisión científica
    - Destacado: Múltiples modelos meteorológicos
    - Aprender de: Credibilidad y confianza

---

## 🎨 Paletas de Color Avanzadas

### Paletas Predefinidas

#### 1. Blue Sky (Actual - Mejorada)
```css
/* Diurno */
--sky-dawn: #1e3a8a;      /* Amanecer */
--sky-morning: #3b5bdb;   /* Mañana */
--sky-noon: #60a5fa;      /* Mediodía */
--sky-afternoon: #7dd3fc; /* Tarde */
--sky-dusk: #93c5fd;      /* Atardecer */

/* Complementos */
--cloud-white: #ffffff;
--cloud-gray: #e5e7eb;
--sun-yellow: #fbbf24;
```

#### 2. Sunset Warmth
```css
--sunset-deep: #7c2d12;
--sunset-orange: #ea580c;
--sunset-coral: #fb923c;
--sunset-peach: #fdba74;
--sunset-cream: #fed7aa;
```

#### 3. Midnight Storm
```css
--storm-deep: #0c0a09;
--storm-dark: #1c1917;
--storm-gray: #292524;
--storm-light: #44403c;
--storm-accent: #78716c;
```

#### 4. Aurora Borealis
```css
--aurora-purple: #7c3aed;
--aurora-blue: #3b82f6;
--aurora-cyan: #06b6d4;
--aurora-teal: #14b8a6;
--aurora-green: #10b981;
```

#### 5. Minimal Monochrome
```css
--mono-black: #09090b;
--mono-dark: #18181b;
--mono-medium: #27272a;
--mono-light: #3f3f46;
--mono-lighter: #52525b;
--mono-accent: #a1a1aa;
```

---

## 🖼️ Wireframes Detallados

### Home Page - Versión Desktop

```
┌────────────────────────────────────────────────────────────────┐
│                        [NUBISFERA]                             │ ← Header
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    [◉ ESFERA 3D ANIMADA]                       │ ← Hero
│                   Rotando con partículas                       │
│                                                                │
│                     🌦️  Nubisfera                              │
│                 El tiempo en tu bolsillo                       │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 🔍  Buscar municipio español...              [🎤] [📍]│   │ ← Búsqueda
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│     [Madrid]  [Barcelona]  [Valencia]  [Sevilla]  [Bilbao]   │ ← Quick Access
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐│
│  │    POPULARES     │  │   TU UBICACIÓN   │  │   RECIENTES ││ ← Secciones
│  │                  │  │                  │  │             ││
│  │  • Valencia      │  │  [MAP PREVIEW]   │  │ • Zaragoza  ││
│  │  • Málaga        │  │  Madrid          │  │ • Toledo    ││
│  │  • Alicante      │  │  ☀️ 28°          │  │ • Granada   ││
│  │                  │  │                  │  │             ││
│  └──────────────────┘  └──────────────────┘  └─────────────┘│
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                          FOOTER                                │
│  Acerca de  |  GitHub  |  Versión  |  © 2026 Nubisfera        │
└────────────────────────────────────────────────────────────────┘
```

### Weather Display - Versión Mobile

```
┌──────────────────────┐
│   [←] MADRID    [⚙️]  │ ← Nav
├──────────────────────┤
│                      │
│       ☀️  SOLEADO     │
│                      │
│        ╔═══════╗     │
│        ║  28°  ║     │ ← Temp Hero
│        ╚═══════╝     │
│   Sensación: 30°     │
│                      │
├──────────────────────┤
│  [HOY] [MAÑANA] [7D] │ ← Tabs
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │    AHORA       │  │
│  │  💧 80%  💨 12  │  │ ← Quick Stats
│  │  ☀️ UV:7  👁 10 │  │
│  └────────────────┘  │
│                      │
│  📊 TEMPERATURA      │
│  ┌────────────────┐  │
│  │   ╱╲    ╱╲     │  │ ← Sparkline
│  │  ╱  ╲  ╱  ╲    │  │
│  └────────────────┘  │
│  06  12  18  23     │
│                      │
│  🌡️ DETALLES         │
│  ┌────────────────┐  │
│  │ UV Index    7  │  │
│  │ Presión  1013  │  │
│  │ Humedad   80%  │  │ ← Details List
│  │ Viento    12km │  │
│  │ Visibilidad 10 │  │
│  └────────────────┘  │
│                      │
│  [🗺️ VER MAPA]       │
│                      │
├──────────────────────┤
│       FOOTER         │
└──────────────────────┘
```

### Dashboard View - Tablet/Desktop

```
┌──────────────────────────────────────────────────────────┐
│  [☰] NUBISFERA               Madrid         [⚙️] [👤]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    HOY      │  │   MAÑANA    │  │   SEMANA    │    │ ← Quick Cards
│  │    ☀️       │  │    ⛅       │  │   22°-28°   │    │
│  │    28°      │  │    25°      │  │   ━━━━━━    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  📊 TEMPERATURA SEMANAL                        │     │ ← Main Chart
│  │                                                │     │
│  │        ╱╲         ╱╲                          │     │
│  │       ╱  ╲       ╱  ╲      ╱╲                │     │
│  │      ╱    ╲     ╱    ╲    ╱  ╲               │     │
│  │     ●───────●───────●────●─────●              │     │
│  │    L  M  X  J  V  S  D                        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  💧 PRECIPITACIÓN│  │  🗺️ MAPA RADAR           │    │
│  │                  │  │                          │    │
│  │  [BAR CHART]     │  │  [MAPA INTERACTIVO]      │    │ ← Widgets
│  │                  │  │                          │    │
│  │  80% hoy         │  │  [Botones zoom]          │    │
│  │  20% mañana      │  │                          │    │
│  └──────────────────┘  └──────────────────────────┘    │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  🌡️ UV INDEX     │  │  🌅 SOL                   │    │
│  │                  │  │                          │    │
│  │  [GAUGE: 7/11]   │  │  ↑ 08:12  ↓ 19:45        │    │
│  │                  │  │                          │    │
│  │  Alto - Usar FPS │  │  11h 33m de luz          │    │
│  └──────────────────┘  └──────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 🎭 Componentes UI Modernos

### 1. Weather Card Premium

```
┌─────────────────────────────────────────────┐
│  LUNES 6 FEB                    [☀️ Soleado]│
│                                             │
│           ┌───────────┐                     │
│           │           │                     │
│           │    28°    │ ← Temperatura       │
│           │           │   grande y bold     │
│           └───────────┘                     │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│  Sensación térmica: 30°                     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 💧       💨       ☀️       👁       │   │
│  │ 80%     12km/h    UV:7    10km      │   │
│  │ Humedad  Viento    Index  Visibilid │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📊 EVOLUCIÓN                               │
│  ╭─●───○───○───○───○───○───○───○───○─╮   │
│  │ 8  10  12  14  16  18  20  22  24  │   │
│  ╰─────────────────────────────────────╯   │
│                                             │
│  [Ver detalles →]                           │
└─────────────────────────────────────────────┘

Efectos CSS:
- backdrop-filter: blur(20px)
- background: rgba(255,255,255,0.1)
- border: 1px solid rgba(255,255,255,0.2)
- box-shadow: 0 8px 32px rgba(0,0,0,0.1)
- transform: translateY(-5px) on hover
```

### 2. Search Bar Avanzado

```
┌──────────────────────────────────────────────┐
│  🔍  Buscar municipio...    [🎤] [📍] [×]   │
└──────────────────────────────────────────────┘
         ↓ (al escribir)
┌──────────────────────────────────────────────┐
│  🔍  madr                   [🎤] [📍] [×]   │
├──────────────────────────────────────────────┤
│  📍 MADRID (MADRID)                    ☀️ 28°│
│  Madrid, Comunidad de Madrid          ⭐    │
├──────────────────────────────────────────────┤
│  📌 RECIENTES                                │
│  › Alcalá de Henares · Madrid            24°│
│  › Getafe · Madrid                       26°│
├──────────────────────────────────────────────┤
│  🔥 POPULARES                                │
│  › Barcelona · Barcelona                 22°│
│  › Valencia · Valencia                   27°│
└──────────────────────────────────────────────┘

Features:
- Autocompletado instantáneo (< 100ms)
- Iconos de favoritos (estrella)
- Temperatura en preview
- Agrupación por provincia
- Historial de búsquedas
- Búsqueda por voz
- Geolocalización rápida
```

### 3. Mini Stat Card

```
┌─────────────────┐
│  💧 HUMEDAD     │
│                 │
│      80%        │ ← Número grande
│                 │
│  ▓▓▓▓▓▓▓▓░░    │ ← Barra visual
│                 │
│  Muy alto       │ ← Estado
└─────────────────┘

Variantes:
- Gauge circular (UV Index)
- Barra de progreso (Humedad)
- Rosa de vientos (Dirección viento)
- Arco semicircular (Presión)
```

### 4. Timeline Hora por Hora

```
┌────────────────────────────────────────────┐
│  PREDICCIÓN POR HORAS                      │
├────────────────────────────────────────────┤
│                                            │
│  08:00   12:00   16:00   20:00   00:00   │
│   ☀️     ☀️      ⛅      🌙      🌙      │
│   18°    26°     28°     22°     18°      │
│   💧5%   💧0%    💧10%   💧15%   💧20%    │
│   ━━━●━━━━●━━━━●━━━━●━━━━●━━━━          │
│      ▲                                     │
│     Ahora                                  │
│                                            │
│  [◀] □□□□□■□□□□ [▶]  ← Navegación         │
└────────────────────────────────────────────┘
```

---

## 🎨 Iconografía Meteorológica

### Sistema de Iconos Animados

```svg
<!-- Ejemplo conceptual en SVG -->

SOL (Soleado):
  ● Círculo central con gradiente
  ● 8 rayos rotando suavemente
  ● Pulsación sutil del brillo
  
NUBE (Nublado):
  ● 2-3 formas de nube superpuestas
  ● Movimiento horizontal lento
  ● Opacidad variable
  
LLUVIA (Lluvioso):
  ● Nube base
  ● Gotas cayendo animadas
  ● Efecto de splash al "tocar suelo"
  
TORMENTA (Tormentoso):
  ● Nube oscura
  ● Rayos intermitentes
  ● Gotas de lluvia intensas
  
NIEVE (Nevado):
  ● Nube suave
  ● Copos de nieve girando al caer
  ● Acumulación sutil abajo
  
VIENTO (Ventoso):
  ● Líneas de viento curvas
  ● Movimiento de izquierda a derecha
  ● Variación de opacidad
  
NIEBLA (Neblina):
  ● Capas horizontales difuminadas
  ● Movimiento lento ondulante
  ● Efecto de profundidad
```

### Mood Icons (Estados del Clima)

```
😎 Perfecto para salir
🥵 Demasiado calor
🥶 Mucho frío
💧 Lluvia probable
⚠️ Condiciones adversas
🌤️ Clima ideal
```

---

## 📐 Sistema de Grid

### Layout Responsivo

```css
/* Grid System Propuesto */

/* Mobile First */
.container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(8, 1fr);
    gap: var(--space-6);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-8);
  }
}

/* Ejemplo de uso */
.hero { grid-column: 1 / -1; }               /* Full width */
.main-card { grid-column: span 12; }          /* Desktop: full */
.sidebar { grid-column: span 4; }             /* Desktop: 4 cols */
.widget { grid-column: span 6; }              /* Desktop: 6 cols */
```

---

## 🎬 Animaciones Clave

### Transiciones y Efectos

```css
/* 1. Fade In Up (Entrada de elementos) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 2. Scale In (Zoom suave) */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 3. Slide In (Desde el lado) */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 4. Shimmer (Skeleton loading) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* 5. Float (Elementos flotantes) */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 6. Pulse (Latido) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 🎨 Modo de Comparación

Este es un ejemplo de cómo se vería:

### Before (Actual)
```
Diseño: Funcional pero básico
Colores: Limitados
Animaciones: Pocas
Interactividad: Estándar
Wow factor: 6/10
```

### After (Plan Completo)
```
Diseño: Premium y moderno
Colores: Sistema completo de temas
Animaciones: Fluidas y deleitosas
Interactividad: Avanzada (3D, mapas, etc)
Wow factor: 10/10 🚀
```

---

## 📚 Recursos y Herramientas

### Diseño
- **Figma**: Diseño de interfaces
- **Coolors.co**: Generador de paletas
- **Fontpair**: Combinaciones de fuentes
- **Dribbble**: Inspiración de diseño
- **Behance**: Portafolios de diseñadores

### Animaciones
- **LottieFiles**: Animaciones After Effects
- **Animista**: CSS animations generator
- **Cubic-bezier.com**: Easing functions
- **Green Sock (GSAP)**: Librería de animación

### Iconos
- **Heroicons**: Iconos SVG minimalistas
- **Lucide**: Fork moderno de Feather
- **Phosphor Icons**: Set completo
- **Meteocons**: Iconos meteorológicos

### Tipografía
- **Google Fonts**: Fuentes gratuitas
- **Font Joy**: Generador de pares
- **Modular Scale**: Escalas tipográficas

---

## ✅ Checklist de Implementación

Imprime esto y marca conforme avances:

### Fundamentos
- [ ] Sistema de tokens CSS definido
- [ ] Paleta de colores extendida
- [ ] Tipografía responsive implementada
- [ ] Grid system documentado
- [ ] Animaciones base creadas

### Componentes
- [ ] Weather cards rediseñadas
- [ ] Search bar avanzado
- [ ] Dashboard layout creado
- [ ] Widgets especializados
- [ ] Timeline implementado

### Features Premium
- [ ] Mapa interactivo
- [ ] Modo comparación
- [ ] Sistema de temas
- [ ] Dark/Light mode
- [ ] PWA optimizada

### Pulido
- [ ] Micro-interacciones
- [ ] Easter eggs
- [ ] Onboarding
- [ ] Loading states
- [ ] Error states

---

## 🎯 ¡A Trabajar!

Con esta guía visual y el plan de fases, tienes todo lo necesario para transformar Nubisfera en una obra maestra del diseño web.

**Recuerda**: El diseño no es solo cómo se ve, es cómo funciona. - Steve Jobs

¡Vamos a crear algo increíble! 🚀🌦️
