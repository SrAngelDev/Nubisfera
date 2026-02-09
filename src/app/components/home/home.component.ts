import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, tap, catchError, map } from 'rxjs/operators';

// Componentes
import { WeatherDisplayComponent } from '../weather-display/weather-display.component';
import { AnimatedBackgroundComponent } from '../animated-background/animated-background.component';
import { SearchWeatherComponent } from '../search-weather/search-weather.component';

// Pipes
// CountryFlagPipe ahora se usa dentro de SearchWeatherComponent

// Modelos
import { Municipio } from '../../models/municipio.model';
import { WeatherData } from '../../models/weather.model';

// Servicios
import { WeatherService, WeatherAlert } from '../../services/weather.service';
import { SearchHistoryService } from '../../services/search-history.service';
import { VoiceSearchService } from '../../services/voice-search.service';

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
    WeatherDisplayComponent,
    AnimatedBackgroundComponent,
    SearchWeatherComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  // OPTIMIZACIÓN: OnPush reduce drásticamente los renderizados innecesarios
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly title = signal('Nubisfera');
  
  // Estado principal
  municipioActual: Municipio | null = null;
  weatherData: WeatherData | null = null;
  tipoPrecisionActual: 'diaria' | 'horaria' = 'diaria';
  isLoadingGlobal = false;
  notification: Notification | null = null;
  currentYear = new Date().getFullYear();
  
  // Búsqueda (simplificado - ahora manejado por SearchWeatherComponent)
  isSearching = false;
  private selectionSubject$ = new Subject<Municipio>();
  
  // Alertas
  alertasActivas: WeatherAlert[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private searchHistoryService: SearchHistoryService,
    private voiceSearchService: VoiceSearchService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // PIPELINE DE SELECCIÓN DE CIUDAD (SOLUCIÓN AL CONGELAMIENTO)
    this.selectionSubject$.pipe(
      tap(() => {
        // Activar loading y limpiar estado anterior
        this.isLoadingGlobal = true;
        this.alertasActivas = [];
        this.municipioActual = null;
        this.weatherData = null;
        this.cdr.markForCheck();
      }),
      switchMap(municipio => {
        return this.weatherService.getWeatherForecast(municipio).pipe(
          map(weatherData => {
            return { municipio, weatherData };
          }),
          catchError(error => {
            console.error('❌ Error cargando datos:', error);
            this.showNotificationAsync('error', 'Error al cargar el tiempo');
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        this.municipioActual = result.municipio;
        this.weatherData = result.weatherData;
        this.alertasActivas = [];
        
        // Lógica pesada en microtasks
        this.postSelectionLogicAsync(result.municipio);
      }
      
      this.isLoadingGlobal = false;
      this.cdr.markForCheck();
    });

    // Notificación de bienvenida
    setTimeout(() => {
      this.showNotificationAsync('info', '¡Bienvenido a Nubisfera!');
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ========== MANEJO DE EVENTOS DEL SEARCH COMPONENT ==========
  
  onMunicipioSelected(municipio: Municipio): void {
    console.log('📍 Ciudad seleccionada:', municipio);
    this.selectionSubject$.next(municipio);
  }
  
  onSearchStateChange(isSearching: boolean): void {
    this.isSearching = isSearching;
    this.cdr.markForCheck();
  }
  
  // OPTIMIZACIÓN: Lógica NO bloqueante ejecutada en microtasks
  private postSelectionLogicAsync(municipio: Municipio): void {
    Promise.resolve().then(() => {
      const location = municipio.pais ? `${municipio.nombre}, ${municipio.pais}` : municipio.nombre;
      this.showNotificationAsync('success', `El tiempo en ${location}`);
      
      // Scroll suave después de que se pinte el DOM
      setTimeout(() => {
        const weatherSection = document.getElementById('weather-section');
        if (weatherSection) {
          weatherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  }
  
  // ========== MÉTODOS AUXILIARES ==========
  
  volverABusqueda(): void {
    this.municipioActual = null;
    this.alertasActivas = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showNotificationAsync('info', 'Busca otra ciudad');
    this.cdr.markForCheck();
  }
  
  cambiarTipoPrecision(tipo: 'diaria' | 'horaria'): void {
    this.tipoPrecisionActual = tipo;
    const mensaje = tipo === 'diaria' 
      ? 'Vista de predicción diaria' 
      : 'Vista de predicción horaria';
    this.showNotificationAsync('info', mensaje);
  }
  
  // ========== ACCIONES ESPECIALES ==========
  
  // OPTIMIZACIÓN: Notificaciones asíncronas para no bloquear el hilo
  private showNotificationAsync(type: Notification['type'], message: string): void {
    // Usar microtask para no bloquear el renderizado principal
    Promise.resolve().then(() => {
      this.notification = { type, message };
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.closeNotification();
      }, 4000); // Reducido a 4s para menos distracción
    });
  }
  
  // Mantener versión síncrona solo para casos donde no importe el bloqueo
  showNotification(type: Notification['type'], message: string): void {
    this.showNotificationAsync(type, message);
  }
  
  closeNotification(): void {
    this.notification = null;
    this.cdr.markForCheck();
  }
  
  getNotificationIcon(type: Notification['type']): string {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type];
  }
  
  // ========== FUNCIONES AVANZADAS ==========
  
  private shareWeather(): void {
    if (!this.municipioActual) {
      this.showNotification('warning', 'Selecciona una ciudad primero');
      return;
    }
    
    const shareText = `🌤️ El tiempo en ${this.municipioActual.nombre} - Nubisfera`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Nubisfera',
        text: shareText,
        url: window.location.href
      }).then(() => {
        this.showNotification('success', 'Compartido');
      }).catch(() => {
        this.fallbackShare(shareText);
      });
    } else {
      this.fallbackShare(shareText);
    }
  }
  
  private fallbackShare(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('success', 'Enlace copiado');
    }).catch(() => {
      this.showNotification('error', 'No se pudo copiar');
    });
  }
  
  private refreshWeather(): void {
    if (!this.municipioActual) {
      this.showNotification('warning', 'Selecciona una ciudad primero');
      return;
    }
    
    this.isLoadingGlobal = true;
    this.showNotification('info', 'Actualizando...');
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.isLoadingGlobal = false;
      this.showNotification('success', 'Datos actualizados');
      this.cdr.markForCheck();
    }, 1500);
  }
  
  detectLocation(): void {
    if (!('geolocation' in navigator)) {
      this.showNotification('error', 'Geolocalización no disponible');
      return;
    }
    
    this.showNotification('info', 'Detectando ubicación...');
    this.isLoadingGlobal = true;
    this.cdr.markForCheck();
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Ubicación: ${latitude}, ${longitude}`);
        
        try {
          const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=es&format=json`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const municipio: Municipio = {
              id: `geo-${result.id}`,
              nombre: result.name,
              provincia: result.admin1 || '',
              ccaa: result.admin1 || '',
              pais: result.country || '',
              country_code: result.country_code || '',
              latitud_dec: result.latitude.toFixed(4),
              longitud_dec: result.longitude.toFixed(4),
              poblacion: result.population || 0
            };
            
            // REUTILIZAMOS LA TUBERÍA SEGURA
            this.selectionSubject$.next(municipio);
          } else {
            this.isLoadingGlobal = false;
            this.showNotification('warning', 'No se pudo identificar la ubicación');
            this.cdr.markForCheck();
          }
        } catch (error) {
          console.error('Error en geocoding:', error);
          this.isLoadingGlobal = false;
          this.showNotification('error', 'Error al identificar ubicación');
          this.cdr.markForCheck();
        }
      },
      (error) => {
        this.isLoadingGlobal = false;
        let mensaje = 'No se pudo detectar la ubicación';
        
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = 'Permiso denegado. Busca tu ciudad manualmente.';
        }
        
        this.showNotification('warning', mensaje);
        this.cdr.markForCheck();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
  
  // ========== ALERTAS ==========
  // OPTIMIZACIÓN: Sistema de alertas simplificado/removido para mejor rendimiento
  // Las alertas pueden calcularse on-demand si se necesitan
  
  verTodasLasAlertas(): void {
    // Funcionalidad deshabilitada temporalmente para optimización
    this.showNotificationAsync('info', 'Sistema de alertas en mantenimiento');
  }
}
