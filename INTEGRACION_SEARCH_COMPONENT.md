# Integración del Componente SearchWeather

## 📦 Componente Creado

Se ha extraído el buscador del `home` como un componente reutilizable llamado `SearchWeatherComponent` ubicado en:

```
src/app/components/search-weather/
  ├── search-weather.component.ts
  ├── search-weather.component.html
  └── search-weather.component.css
```

## ✨ Características

- ✅ Búsqueda de municipios con debounce
- ✅ Búsqueda por voz (si está soportado)
- ✅ Historial de búsquedas
- ✅ Sugerencias populares
- ✅ Botón de geolocalización (opcional)
- ✅ Componente totalmente configurable

## 🎯 Cómo Usar

### 1. Importar el Componente

```typescript
import { SearchWeatherComponent } from '../search-weather/search-weather.component';

@Component({
  // ...
  imports: [
    CommonModule,
    FormsModule,
    SearchWeatherComponent, // ← Añadir aquí
    // ...otros componentes
  ]
})
```

### 2. Usar en el Template

```html
<app-search-weather
  [showHistory]="true"
  [showPopularSuggestions]="true"
  [showLocationButton]="true"
  [placeholder]="'Madrid, New York, Tokyo...'"
  [maxResults]="10"
  (municipioSelected)="onMunicipioSelected($event)"
  (locationRequest)="handleLocationRequest()"
  (searchStateChange)="onSearchStateChange($event)"
></app-search-weather>
```

### 3. Manejar los Eventos en el Componente

```typescript
export class MiComponente {
  // Manejar selección de municipio
  onMunicipioSelected(municipio: Municipio): void {
    console.log('Ciudad seleccionada:', municipio);
    // Aquí cada página hace lo que necesite con el municipio
    this.cargarDatosMunicipio(municipio);
  }

  // Manejar solicitud de ubicación
  handleLocationRequest(): void {
    // Implementar lógica de geolocalización
    this.detectarUbicacion();
  }

  // Manejar cambio de estado de búsqueda
  onSearchStateChange(isSearching: boolean): void {
    this.isSearching = isSearching;
  }
}
```

## 🔧 Propiedades de Entrada (@Input)

| Propiedad | Tipo | Por Defecto | Descripción |
|-----------|------|-------------|-------------|
| `showHistory` | boolean | true | Mostrar historial de búsquedas |
| `showPopularSuggestions` | boolean | true | Mostrar sugerencias populares |
| `showLocationButton` | boolean | true | Mostrar botón de geolocalización |
| `placeholder` | string | 'Madrid, New York...' | Texto del placeholder |
| `maxResults` | number | 10 | Número máximo de resultados |

## 📤 Eventos de Salida (@Output)

| Evento | Parámetro | Descripción |
|--------|-----------|-------------|
| `municipioSelected` | Municipio | Se emite cuando se selecciona un municipio |
| `locationRequest` | void | Se emite cuando se solicita geolocalización |
| `searchStateChange` | boolean | Se emite cuando cambia el estado de búsqueda |

## 💡 Ejemplos de Integración

### Ejemplo para Home (Ya integrado ✅)

```html
<!-- home.component.html -->
<app-search-weather
  [showHistory]="true"
  [showPopularSuggestions]="true"
  [showLocationButton]="true"
  (municipioSelected)="onMunicipioSelected($event)"
  (locationRequest)="detectLocation()"
  (searchStateChange)="onSearchStateChange($event)"
></app-search-weather>
```

### Ejemplo para Dashboard

Reemplazar la búsqueda actual en `weather-dashboard.component.ts`:

```typescript
// Importar
import { SearchWeatherComponent } from '../search-weather/search-weather.component';

// Añadir a imports
imports: [
  // ...
  SearchWeatherComponent
]

// Método para manejar selección
onMunicipioSelected(municipio: Municipio): void {
  this.municipioSeleccionado.set(municipio);
  // Cargar datos del municipio...
}
```

En el template:

```html
@if (!municipioSeleccionado()) {
  <div class="search-state">
    <div class="search-panel">
      <app-search-weather
        [showHistory]="true"
        [showPopularSuggestions]="false"
        [showLocationButton]="false"
        (municipioSelected)="onMunicipioSelected($event)"
      ></app-search-weather>
    </div>
  </div>
}
```

### Ejemplo para Timeline

Reemplazar la búsqueda actual en `weather-timeline.component.ts`:

```typescript
// Importar
import { SearchWeatherComponent } from '../search-weather/search-weather.component';

// Añadir a imports
imports: [
  // ...
  SearchWeatherComponent
]

// Método para manejar selección
onMunicipioSelected(municipio: Municipio): void {
  this.selectMunicipio(municipio);
  // O directamente:
  // this.selectedMunicipio.set(municipio);
  // this.loadTimelineData();
}
```

En el template:

```html
@if (!selectedMunicipio()) {
  <div class="timeline-search-screen">
    <div class="search-hero">
      <div class="search-icon-wrapper">
        <i class="fas fa-clock"></i>
      </div>
      <h1 class="search-title">Timeline Meteorológico</h1>
      <p class="search-subtitle">Busca un municipio para ver su evolución meteorológica</p>
      
      <app-search-weather
        [showHistory]="true"
        [showPopularSuggestions]="true"
        [showLocationButton]="false"
        (municipioSelected)="onMunicipioSelected($event)"
      ></app-search-weather>
    </div>
  </div>
}
```

## 🎨 Personalización de Estilos

El componente incluye sus propios estilos, pero puedes sobreescribirlos desde el componente padre:

```css
/* En tu componente.css */
::ng-deep app-search-weather {
  .search-card {
    /* Personalizar la tarjeta de búsqueda */
  }
  
  .search-input {
    /* Personalizar el input */
  }
}
```

## 🔄 Métodos Públicos

Puedes acceder a métodos públicos usando `@ViewChild`:

```typescript
@ViewChild(SearchWeatherComponent) searchComponent!: SearchWeatherComponent;

// Buscar por nombre programáticamente
buscarCiudad(nombre: string): void {
  this.searchComponent.searchByName(nombre);
}

// Resetear búsqueda
resetearBusqueda(): void {
  this.searchComponent.resetSearch();
}
```

## 📋 Ventajas de esta Arquitectura

1. **Reutilización**: El mismo componente funciona en Home, Dashboard y Timeline
2. **Mantenibilidad**: Cambios en el buscador se aplican automáticamente a todas las páginas
3. **Separación de Responsabilidades**: El buscador solo busca, cada página decide qué hacer con el resultado
4. **Flexibilidad**: Cada página puede configurar el buscador según sus necesidades
5. **Consistencia**: La UX del buscador es idéntica en toda la aplicación

## 🚀 Estado Actual

- ✅ Componente creado y funcional
- ✅ Integrado en Home
- ✅ Integrado en Dashboard
- ✅ Integrado en Timeline

**¡Toda la aplicación usa ahora el componente unificado de búsqueda!**

## 📝 Notas Importantes

- El historial de búsquedas se gestiona automáticamente mediante `SearchHistoryService`
- La búsqueda se optimiza con debounce (400ms) para evitar llamadas excesivas
- El componente usa `OnPush` para mejor rendimiento
- Todos los estilos están encapsulados en el componente
