# 🌦️ Nubisfera

> **Aplicación web de previsión meteorológica global**

![Angular](https://img.shields.io/badge/Angular-20.3-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Open-Meteo](https://img.shields.io/badge/Open--Meteo-API-00A1E0?style=for-the-badge)

**Nubisfera** es una aplicación web moderna que proporciona información meteorológica detallada de cualquier ciudad del mundo, utilizando los datos de **Open-Meteo**, una API meteorológica gratuita y de código abierto con cobertura internacional.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Tecnologías](#️-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Open-Meteo](#-api-open-meteo)
- [Características Técnicas](#-características-técnicas)
- [Propósito Educativo](#-propósito-educativo)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🔍 Búsqueda Global
- Búsqueda de ciudades en todo el mundo con autocompletado
- Base de datos global con millones de ubicaciones
- Resultados instantáneos mientras escribes
- Información detallada: ciudad, región y país

### 🌡️ Información Meteorológica Completa
- **Predicción extendida**: Hasta 16 días vista
- **Predicción horaria**: Detalle hora por hora
- **Temperaturas**: Máximas, mínimas y por hora
- **Estado del cielo**: 35+ condiciones meteorológicas con iconos animados
- **Probabilidad de precipitación**: Porcentaje de lluvia prevista
- **Datos en tiempo real**: Actualización constante
- **Zona horaria automática**: Datos adaptados a la zona horaria local

### 📊 Visualización Avanzada
- **Gráficos interactivos**: Temperatura, precipitación, humedad y velocidad del viento (48h)
- **Mapa de España**: Visualización de temperaturas por comunidad autónoma
- **Selección por mapa**: Click en el mapa para ver el tiempo de cualquier región
- **Animaciones fluidas**: Transiciones suaves entre vistas

### 📊 Visualización Avanzada
- **Gráficos interactivos**: Temperatura, precipitación, humedad y velocidad del viento (48h)
- **Mapa de España**: Visualización de temperaturas por comunidad autónoma
- **Selección por mapa**: Click en el mapa para ver el tiempo de cualquier región
- **Animaciones fluidas**: Transiciones suaves entre vistas

### 🎨 Interfaz Moderna
- Diseño **dark mode** profesional
- Tarjetas animadas y responsivas
- Iconos meteorológicos intuitivos con emojis
- Experiencia de usuario fluida

### ⚡ Rendimiento Optimizado
- **Sistema de caché inteligente** con 3 niveles de expiración:
  - Municipios: 24 horas
  - Predicción diaria: 3 horas
  - Predicción horaria: 1 hora
- Invalidación automática de caché al cambiar versiones
- Carga instantánea de datos previamente consultados

### 🔄 Doble Modo de Visualización
- **Vista Semanal**: Resumen de 7 días con temperaturas máx/mín
- **Vista Detallada**: Rangos horarios específicos (madrugada, mañana, tarde, noche)

---

## 📸 Capturas de Pantalla

> _Próximamente: Capturas de la aplicación en funcionamiento_

---

## 🛠️ Tecnologías

### Frontend
- **Angular 21.0** - Framework principal
- **TypeScript 5.9** - Lenguaje de programación
- **RxJS 7.8** - Programación reactiva
- **Standalone Components** - Arquitectura moderna de Angular

### Visualización de Datos
- **Google Charts** - Gráficos interactivos de temperatura, precipitación, humedad y viento
- **Google GeoChart** - Mapa interactivo de España con temperaturas por comunidad autónoma

### Estilos
- **CSS3** - Variables CSS, Flexbox, Grid
- **Dark Theme** - Diseño oscuro profesional
- **Responsive Design** - Adaptado a todos los dispositivos

### API y Datos
- **Open-Meteo API** - Datos meteorológicos gratuitos y de código abierto
- **LocalStorage** - Sistema de caché persistente
- **HttpClient** - Comunicación con la API

---

## 🚀 Instalación

### Requisitos Previos
- **Node.js** (v18 o superior)
- **npm** (v9 o superior)  
- **Angular CLI** (v21 o superior)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/SrAngelDev/Nubisfera.git
cd Nubisfera
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Generar dataset de municipios**

   Ejecuta el script para crear el archivo JSON con todos los municipios:
   ```bash
   node scripts/generar-municipios.js
   ```
   
   Esto creará `src/assets/municipios-espana.json` con ~6,000 municipios.
   
   Ver más detalles en `scripts/README.md`

4. **No requiere API Key**

   Open-Meteo es una API gratuita que no requiere autenticación.

5. **Iniciar servidor de desarrollo**
```bash
npm start
```

6. **Abrir en el navegador**
   
   Navega a `http://localhost:4200/`

---

## 💻 Uso

### Buscar un Municipio
1. Escribe el nombre del municipio en la barra de búsqueda
2. Selecciona el municipio deseado de los resultados
3. Visualiza la predicción meteorológica

### Cambiar Tipo de Predicción
- **Botón "Diaria"**: Muestra predicción de 7 días
- **Botón "Por Horas"**: Muestra rangos horarios detallados

### Limpiar Búsqueda
- Click en el botón **✕** para limpiar y buscar otro municipio

---

## 📁 Estructura del Proyecto

```
Nubisfera/
├── src/
│   ├── app/
│   │   ├── components/           # Componentes de la aplicación
│   │   │   ├── header/           # Cabecera de la app
│   │   │   ├── search-bar/       # Barra de búsqueda
│   │   │   ├── weather-display/  # Visualización del clima
│   │   │   └── weather-card/     # Tarjeta individual de clima
│   │   ├── services/             # Servicios
│   │   │   ├── weather.service.ts  # Comunicación con API Open-Meteo
│   │   │   └── weather-icon.service.ts  # Mapeo de códigos a iconos
│   │   ├── models/               # Modelos de datos
│   │   │   ├── municipio.model.ts
│   │   │   └── prediccion.model.ts
│   │   ├── app.ts                # Componente principal
│   │   ├── app.config.ts         # Configuración de la app
│   │   └── app.routes.ts         # Rutas
│   ├── styles.css                # Estilos globales
│   └── index.html                # HTML principal
├── angular.json                  # Configuración de Angular
├── package.json                  # Dependencias del proyecto
├── tsconfig.json                 # Configuración de TypeScript
└── README.md                     # Este archivo
```

---

## 🌐 API Open-Meteo

Esta aplicación utiliza la **API de Open-Meteo**, que proporciona:

- ✅ Datos meteorológicos gratuitos y de código abierto
- ✅ Predicción hasta 7 días con datos horarios
- ✅ Actualización continua cada hora
- ✅ **Sin necesidad de API Key** ni registro
- ✅ Soporta coordenadas geográficas globales

### Endpoint Principal

```typescript
// Predicción meteorológica por coordenadas
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,relative_humidity_2m,weather_code,...
  &hourly=temperature_2m,precipitation_probability,...
  &daily=temperature_2m_max,temperature_2m_min,...
  &timezone=Europe/Madrid
```

### Códigos WMO del Tiempo

La aplicación soporta los **códigos WMO estándar** de Open-Meteo:

| Código | Descripción | Emoji |
|--------|-------------|-------|
| 0 | Despejado | ☀️ |
| 1-3 | Parcialmente nublado | 🌤️⛅☁️ |
| 45-48 | Niebla | 🌫️ |
| 51-67 | Lluvia | 🌧️ |
| 71-77 | Nieve | 🌨️❄️ |
| 80-82 | Chubascos | 🌦️⛈️ |
| 95-99 | Tormenta | ⛈️ |

---

## 🔧 Características Técnicas

### Sistema de Caché Local

```typescript
- Municipios: Almacenados localmente (53 ciudades principales)
- Versión de caché: v1-openmeteo
```

### Datos Meteorológicos en Tiempo Real

La aplicación obtiene:

La aplicación procesa inteligentemente los rangos horarios de AEMET:

```typescript
Rangos soportados:
- "00-06" → 00:00 - 06:00 (Madrugada)
- "06-12" → 06:00 - 12:00 (Mañana)
- "12-18" → 12:00 - 18:00 (Tarde)
- "18-24" → 18:00 - 24:00 (Noche)
- "00-24" → Todo el día
```

**Algoritmo de ordenación**:
1. Rangos más específicos primero (menor duración)
2. Por hora de inicio si tienen misma duración

### Filtrado de Datos

- ❌ Filtra automáticamente fechas pasadas
- ❌ Omite rangos sin datos meteorológicos
- ✅ Deduplica rangos mediante Map
- ✅ Valida códigos de estado del cielo

---

## 📚 Propósito Educativo

> ⚠️ **Proyecto con Fines Educativos**

Este proyecto ha sido desarrollado con **propósitos exclusivamente educativos** para:

### Objetivos de Aprendizaje

- 📖 **Aprender Angular 20** y sus características más recientes
- 🧩 **Practicar Standalone Components** y la arquitectura moderna
- 🔄 **Dominar RxJS** y programación reactiva
- 🎨 **Implementar diseño responsive** y dark mode
- 🌐 **Integrar APIs REST** externas (Open-Meteo)
- 💾 **Gestionar caché** y optimización de rendimiento
- 📦 **Modelar datos complejos** con TypeScript

### Conceptos Implementados

✅ Componentes standalone de Angular  
✅ Servicios con inyección de dependencias  
✅ Observables y operadores RxJS  
✅ HttpClient y manejo de APIs  
✅ LocalStorage y persistencia  
✅ Pipes de Angular  
✅ Directivas estructurales  
✅ CSS variables y theming  
✅ TypeScript avanzado (interfaces, tipos, genéricos)  

### No Apto para Producción

Este proyecto **NO** está diseñado para uso en producción debido a:

- Falta de testing completo
- No incluye autenticación robusta
- Sin manejo exhaustivo de errores de red
- No optimizado para SEO
- Sin analytics ni monitorización

### Uso Permitido

✅ Uso personal y aprendizaje  
✅ Modificación y experimentación  
✅ Compartir con fines educativos  
✅ Base para proyectos académicos  

---

## 🤝 Contribuir

Las contribuciones son bienvenidas, especialmente si estás aprendiendo Angular:

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Ideas para Contribuir

- 🐛 Reportar bugs o problemas
- 💡 Sugerir nuevas características
- 📝 Mejorar la documentación
- 🎨 Mejorar el diseño UI/UX
- ⚡ Optimizar el rendimiento
- 🧪 Añadir tests unitarios

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**SrAngelDev**

- GitHub: [@SrAngelDev](https://github.com/SrAngelDev)
- Proyecto: [Nubisfera](https://github.com/SrAngelDev/Nubisfera)

---

## 🙏 Agradecimientos

- **Open-Meteo** por proporcionar la API meteorológica gratuita y de código abierto
- **Angular Team** por el increíble framework
- **Comunidad de desarrolladores** por la inspiración y recursos

---

## 📝 Notas de Versión

<<<<<<< HEAD
### v2.0.0 (Actual) - Expansión Global
- 🌍 **Búsqueda global**: Cualquier ciudad del mundo
- 🌐 **Cobertura internacional**: Millones de ubicaciones disponibles
- 🕐 **Timezone automático**: Datos adaptados a la zona horaria local
- 📅 **Predicción extendida**: Hasta 16 días
- ⏰ **Predicción horaria mejorada**: Pronóstico hora por hora
- 📊 Gráficos interactivos con Google Charts (4 tipos)
- 💾 Sistema de caché inteligente optimizado
=======
### v1.0.0 (Actual)
- ✨ Búsqueda de 8,122 municipios españoles
- 🌡️ Predicción diaria (7 días)
- ⏰ Predicción por rangos horarios
- 📊 Gráficos interactivos con Google Charts (4 tipos)
- 🗺️ Mapa interactivo de España con temperaturas en tiempo real
- 💾 Sistema de caché inteligente (v3)
>>>>>>> a203724dac49c667f6c185c8ce89ab99a22f1c70
- 🎨 Interfaz dark mode completa
- 📱 Diseño responsive
- ⚡ 35+ códigos meteorológicos soportados

### v1.0.0 - Versión España
- ✨ Búsqueda de 8,122 municipios españoles
- 🌡️ Predicción diaria (7 días)
- ⏰ Predicción por rangos horarios
- 📊 Gráficos interactivos básicos
- 🗺️ Mapa interactivo de España
- 💾 Sistema de caché v3

---

<div align="center">

**Hecho con ❤️ usando Angular y TypeScript**

⭐ Si este proyecto te ayudó a aprender, considera darle una estrella

</div>
