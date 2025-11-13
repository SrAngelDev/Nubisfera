# Generador de Dataset de Municipios Españoles

## 📋 Descripción

Este script genera un archivo JSON completo con todos los municipios de España disponibles en la API de Open-Meteo Geocoding.

## 🚀 Uso

### 1. Generar el JSON de municipios

Ejecuta el script desde la raíz del proyecto:

```bash
node scripts/generar-municipios.js
```

### 2. Resultado

El script:
- Realiza búsquedas exhaustivas en la API de Open-Meteo
- Genera: `src/assets/municipios-espana.json`
- Tiempo estimado: **1-3 minutos**
- Cobertura esperada: **60-80%** de los ~8,131 municipios de España

### 3. Estructura del JSON generado

```json
{
  "version": "1.0",
  "fecha_generacion": "2025-11-13T...",
  "total_municipios": 6500,
  "fuente": "Open-Meteo Geocoding API",
  "municipios": [
    {
      "id": "1234",
      "nombre": "Madrid",
      "provincia": "Madrid",
      "ccaa": "Madrid",
      "latitud_dec": "40.4168",
      "longitud_dec": "-3.7038",
      "poblacion": 3223334,
      "elevacion": 667
    },
    ...
  ]
}
```

## 📊 Estrategia de Búsqueda

El script utiliza múltiples estrategias:

1. **Alfabeto completo** (28 búsquedas: a-z + ñ)
2. **Combinaciones de 2 letras con vocales** (~270 búsquedas)
3. **Prefijos comunes españoles** (~30 búsquedas):
   - san, santa, santo, villa, castro, monte, etc.
4. **Sufijos típicos** (~15 búsquedas):
   - illo/illa, uelo/uela, ejo/eja, etc.
5. **Ciudades principales** (~50 búsquedas)
6. **Provincias** (~50 búsquedas)

**Total: ~450 búsquedas** optimizadas para maximizar cobertura sin saturar la API.

## ⚙️ Configuración

Puedes ajustar estos parámetros en el script:

```javascript
const DELAY_MS = 200;      // Delay entre lotes
const BATCH_SIZE = 50;     // Peticiones simultáneas por lote
```

## 🔄 Actualización

Ejecuta el script nuevamente cuando:
- Necesites actualizar los datos de población
- Quieras incluir nuevos municipios
- La API de Open-Meteo haya añadido más datos

## ⚠️ Notas

- El script elimina duplicados automáticamente
- Solo incluye resultados de España (country_code='ES')
- Requiere conexión a internet
- La API de Open-Meteo es gratuita y no requiere API key

## 🐛 Solución de Problemas

### Error: ENOENT (No such file or directory)
```bash
# Crear manualmente el directorio
mkdir -p src/assets
node scripts/generar-municipios.js
```

### Error: fetch is not defined (Node < 18)
```bash
# Actualizar Node.js a v18 o superior
# O instalar node-fetch:
npm install node-fetch
```

Luego añadir al script:
```javascript
const fetch = require('node-fetch');
```

### Muy pocos municipios cargados
- Aumenta `BATCH_SIZE` a 100
- Reduce `DELAY_MS` a 100
- Ejecuta el script varias veces (acumula resultados)

## 📝 Licencia

Datos: Open-Meteo API (CC BY 4.0)
Script: MIT
