import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importar componentes
import { WeatherDisplayComponent } from '../weather-display/weather-display.component';

// Importar modelos
import { Municipio } from '../../models/municipio.model';

// Importar servicios
import { WeatherService } from '../../services/weather.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Interfaces para la aplicación
interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WeatherDisplayComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
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

  constructor(private weatherService: WeatherService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
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
    this.showNotification('info', '📥 Descargando dataset completo de municipios...');
    
    this.weatherService.getMunicipios().subscribe({
      next: (municipios) => {
        this.todosLosMunicipios = municipios;
        this.isLoadingMunicipios = false;
        console.log(`✅ ${municipios.length} municipios cargados`);
        
        const mensaje = municipios.length > 1000 
          ? `✅ ${municipios.length} municipios disponibles (cargado desde caché)`
          : `✅ ${municipios.length} municipios cargados. Búsqueda en tiempo real disponible`;
        
        this.showNotification('success', mensaje);
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
    if (this.searchQuery.length >= 1) {
      this.showSearchResults = true;
      this.filtrarMunicipios(this.searchQuery);
    }
  }
  
  onSearchBlur() {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }
  
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private filtrarMunicipios(query: string) {
    if (!query || query.trim().length < 2) {
      this.municipiosFiltrados = [];
      return;
    }
    
    const normalizedQuery = this.normalizeText(query);
    
    const municipiosLocales = this.todosLosMunicipios
      .filter(m => {
        if (!m || !m.nombre) return false;
        const normalizedNombre = this.normalizeText(m.nombre);
        return normalizedNombre.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const normalizedA = this.normalizeText(a.nombre);
        const normalizedB = this.normalizeText(b.nombre);
        const aStartsWith = normalizedA.startsWith(normalizedQuery);
        const bStartsWith = normalizedB.startsWith(normalizedQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 10);
    
    if (municipiosLocales.length > 0) {
      this.municipiosFiltrados = municipiosLocales;
    } else {
      this.weatherService.searchMunicipios(query).subscribe({
        next: (municipios) => {
          this.municipiosFiltrados = municipios.slice(0, 10);
          if (municipios.length === 0) {
            this.showNotification('info', '🔍 No se encontraron municipios con ese nombre');
          }
        },
        error: (error) => {
          console.error('Error buscando municipios:', error);
          this.showNotification('warning', '⚠️ Error en la búsqueda. Intenta de nuevo.');
        }
      });
    }
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
  
  onAccionEspecial(accion: string) {
    switch (accion) {
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
      
      setTimeout(() => {
        this.isLoadingGlobal = false;
        this.showNotification('success', '✅ Datos actualizados correctamente');
      }, 2000);
    } else {
      this.showNotification('warning', 'Selecciona un municipio primero para actualizar');
    }
  }
  
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
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
          maximumAge: 300000
        }
      );
    } else {
      this.showNotification('error', 'Tu navegador no soporta geolocalización');
    }
  }
  
  showNotification(type: Notification['type'], message: string) {
    this.notification = { type, message };
    
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
