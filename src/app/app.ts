import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importar componentes
import { HeaderComponent } from './components/header/header.component';
import { WeatherDisplayComponent } from './components/weather-display/weather-display.component';

// Importar modelos
import { Municipio } from './models/municipio.model';

// Importar servicios
import { AemetService } from './services/aemet.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Interfaces para la aplicación
interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    WeatherDisplayComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Nubisfera');
  
  // Estado de la aplicación
  municipioActual: Municipio | null = null;
  tipoPrecisionActual: 'diaria' | 'horaria' = 'diaria';
  isLoadingGlobal = false;
  notification: Notification | null = null;
  testMessage = false;
  currentYear = new Date().getFullYear();
  
  // Estado de búsqueda
  searchQuery = '';
  showSearchResults = false;
  municipiosFiltrados: Municipio[] = [];
  todosLosMunicipios: Municipio[] = [];
  isLoadingMunicipios = true;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private aemetService: AemetService) {
    this.searchSubject.pipe(
      debounceTime(300), // Espera 300ms después de la última pulsación
      distinctUntilChanged(), // Solo emite si el valor ha cambiado
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filtrarMunicipios(query);
    });
  }
  
  ngOnInit() {
    this.showWelcomeMessage();
    this.cargarMunicipios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Cargar lista de municipios
  private cargarMunicipios() {
    this.isLoadingMunicipios = true;
    this.aemetService.getMunicipios().subscribe({
      next: (municipios) => {
        this.todosLosMunicipios = municipios;
        this.isLoadingMunicipios = false;
        console.log(`✅ ${municipios.length} municipios cargados y listos para buscar`);
        console.log('📋 Primeros 5 municipios:', municipios.slice(0, 5));
        console.log('📋 Ejemplo de municipio Madrid:', municipios.find(m => m?.nombre?.toLowerCase().includes('madrid')));
        this.showNotification('success', `✅ ${municipios.length} municipios disponibles para buscar`);
      },
      error: (error) => {
        console.error('Error cargando municipios:', error);
        this.isLoadingMunicipios = false;
        this.showNotification('error', '❌ Error al cargar la lista de municipios. Intenta recargar la página.');
      }
    });
  }
  
  // Métodos de búsqueda
  onSearchInput() {
    const query = this.searchQuery.trim();
    if (query.length >= 1) {
      this.showSearchResults = true;
      this.searchSubject.next(query);
    } else {
      this.municipiosFiltrados = [];
      this.showSearchResults = false;
    }
  }
  
  onSearchFocus() {
    // Mostrar resultados si ya hay algo escrito
    if (this.searchQuery.length >= 1) {
      this.showSearchResults = true;
      this.filtrarMunicipios(this.searchQuery);
    }
  }
  
  onSearchBlur() {
    // Retrasar el cierre para permitir el click en los resultados
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }
  
  // Función auxiliar para normalizar texto (eliminar tildes y caracteres especiales)
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Elimina los diacríticos (tildes)
  }

  private filtrarMunicipios(query: string) {
    if (!this.todosLosMunicipios.length) {
      console.log('⏳ Municipios aún no cargados');
      return;
    }
    
    const normalizedQuery = this.normalizeText(query);
    
    // Filtrar municipios que coincidan con el nombre
    this.municipiosFiltrados = this.todosLosMunicipios
      .filter(m => {
        // Verificamos que tenga nombre
        if (!m || !m.nombre) {
          return false;
        }
        const normalizedNombre = this.normalizeText(m.nombre);
        return normalizedNombre.includes(normalizedQuery);
      })
      // Ordenar: primero los que empiezan con la búsqueda
      .sort((a, b) => {
        const normalizedA = this.normalizeText(a.nombre);
        const normalizedB = this.normalizeText(b.nombre);
        
        const aStartsWith = normalizedA.startsWith(normalizedQuery);
        const bStartsWith = normalizedB.startsWith(normalizedQuery);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Si ambos empiezan igual, ordenar alfabéticamente
        return a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 10); // Mostrar hasta 10 resultados
    
    console.log(`🔍 Búsqueda "${query}": ${this.municipiosFiltrados.length} resultados`);
  }
  
  seleccionarMunicipio(municipio: Municipio) {
    this.municipioActual = municipio;
    this.searchQuery = municipio.nombre;
    this.showSearchResults = false;
    this.showNotification('success', `📍 Mostrando el tiempo para ${municipio.nombre}`);
  }
  
  clearSearch() {
    this.searchQuery = '';
    this.municipiosFiltrados = [];
    this.showSearchResults = false;
  }
  
  buscarMunicipioPorNombre(nombre: string) {
    this.searchQuery = nombre;
    this.filtrarMunicipios(nombre);
    
    if (this.municipiosFiltrados.length > 0) {
      this.seleccionarMunicipio(this.municipiosFiltrados[0]);
    }
  }
  
  cambiarTipoPrecision(tipo: 'diaria' | 'horaria') {
    this.tipoPrecisionActual = tipo;
    const mensaje = tipo === 'diaria' 
      ? '📅 Mostrando predicción diaria' 
      : '🕐 Mostrando predicción horaria';
    this.showNotification('info', mensaje);
  }
  
  showTestMessage() {
    this.testMessage = !this.testMessage;
    console.log('Botón de prueba clickeado! Angular funcionando correctamente');
  }
  
  // Manejo de eventos del componente de búsqueda
  onMunicipioSeleccionado(municipio: Municipio) {
    console.log('Municipio seleccionado:', municipio);
    this.municipioActual = municipio;
    this.showNotification('success', `📍 Mostrando el tiempo para ${municipio.nombre}`);
  }
  
  // Manejo de eventos del componente de controles
  onTipoCambiado(tipo: 'diaria' | 'horaria') {
    console.log('Tipo de predicción cambiado:', tipo);
    this.tipoPrecisionActual = tipo;
    const mensaje = tipo === 'diaria' 
      ? '📅 Mostrando predicción diaria' 
      : '🕐 Mostrando predicción horaria';
    this.showNotification('info', mensaje);
  }
  
  onAccionEspecial(accion: string) {
    console.log('Acción especial:', accion);
    
    switch (accion) {
      case 'favoritos':
        this.showNotification('info', '⭐ Función de favoritos próximamente disponible');
        break;
      case 'compartir':
        this.shareWeather();
        break;
      case 'actualizar':
        this.refreshWeather();
        break;
      case 'ubicacion':
        this.detectLocation();
        break;
      default:
        this.showNotification('info', `Acción ${accion} ejecutada`);
    }
  }
  
  // Métodos auxiliares
  private showWelcomeMessage() {
    setTimeout(() => {
      this.showNotification('success', '🌤️ ¡Bienvenido a Nubisfera! Busca tu municipio para comenzar');
    }, 1000);
  }
  
  private shareWeather() {
    if (this.municipioActual) {
      const shareText = `🌤️ Consulta el tiempo en ${this.municipioActual.nombre} con Nubisfera`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Nubisfera - El Tiempo',
          text: shareText,
          url: window.location.href
        }).then(() => {
          this.showNotification('success', '📤 Compartido correctamente');
        }).catch(() => {
          this.fallbackShare(shareText);
        });
      } else {
        this.fallbackShare(shareText);
      }
    } else {
      this.showNotification('warning', 'Selecciona un municipio primero para compartir');
    }
  }
  
  private fallbackShare(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('success', '📋 Enlace copiado al portapapeles');
    }).catch(() => {
      this.showNotification('error', 'No se pudo copiar el enlace');
    });
  }
  
  private refreshWeather() {
    if (this.municipioActual) {
      this.isLoadingGlobal = true;
      this.showNotification('info', '🔄 Actualizando datos meteorológicos...');
      
      // Simular actualización
      setTimeout(() => {
        this.isLoadingGlobal = false;
        this.showNotification('success', '✅ Datos actualizados correctamente');
      }, 2000);
    } else {
      this.showNotification('warning', 'Selecciona un municipio primero para actualizar');
    }
  }
  
  // Calcular distancia entre dos puntos geográficos (fórmula de Haversine)
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private detectLocation() {
    this.showNotification('info', '📍 Detectando tu ubicación...');
    
    if ('geolocation' in navigator) {
      this.isLoadingGlobal = true;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Ubicación detectada:', { latitude, longitude });
          
          // Buscar el municipio más cercano
          let municipioCercano: Municipio | null = null;
          let distanciaMinima = Infinity;
          
          for (const municipio of this.todosLosMunicipios) {
            if (municipio.latitud_dec && municipio.longitud_dec) {
              const lat = parseFloat(municipio.latitud_dec);
              const lon = parseFloat(municipio.longitud_dec);
              
              if (!isNaN(lat) && !isNaN(lon)) {
                const distancia = this.calcularDistancia(latitude, longitude, lat, lon);
                
                if (distancia < distanciaMinima) {
                  distanciaMinima = distancia;
                  municipioCercano = municipio;
                }
              }
            }
          }
          
          this.isLoadingGlobal = false;
          
          if (municipioCercano) {
            this.municipioActual = municipioCercano;
            this.searchQuery = municipioCercano.nombre;
            this.showNotification('success', 
              `📍 Municipio más cercano: ${municipioCercano.nombre} (a ${distanciaMinima.toFixed(1)} km)`
            );
          } else {
            this.showNotification('warning', 
              '📍 No se pudo encontrar un municipio cercano con coordenadas válidas'
            );
          }
        },
        (error) => {
          this.isLoadingGlobal = false;
          console.error('Error detectando ubicación:', error);
          
          let mensaje = 'No se pudo detectar tu ubicación';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensaje = 'Permiso de ubicación denegado. Búsca tu municipio manualmente.';
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje = 'Información de ubicación no disponible';
              break;
            case error.TIMEOUT:
              mensaje = 'Tiempo de espera agotado para detectar ubicación';
              break;
          }
          
          this.showNotification('warning', `📍 ${mensaje}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    } else {
      this.showNotification('error', 'Tu navegador no soporta geolocalización');
    }
  }
  
  // Sistema de notificaciones
  showNotification(type: Notification['type'], message: string) {
    this.notification = { type, message };
    
    // Auto-cerrar notificación después de 5 segundos
    setTimeout(() => {
      this.closeNotification();
    }, 5000);
  }
  
  closeNotification() {
    this.notification = null;
  }
  
  getNotificationIcon(type: Notification['type']): string {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  }
}
