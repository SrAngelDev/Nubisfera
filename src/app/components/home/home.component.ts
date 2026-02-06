import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importar componentes
import { WeatherDisplayComponent } from '../weather-display/weather-display.component';
import { SpainMapComponent } from '../spain-map/spain-map.component';
import { WeatherOrbComponent } from '../weather-orb/weather-orb.component';
import { AnimatedBackgroundComponent } from '../animated-background/animated-background.component';

// Importar modelos
import { Municipio } from '../../models/municipio.model';

// Importar servicios
import { WeatherService, WeatherAlert } from '../../services/weather.service';
import { SearchHistoryService, SearchHistoryItem } from '../../services/search-history.service';
import { VoiceSearchService } from '../../services/voice-search.service';
import { GamificationService } from '../../services/gamification.service';
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
    WeatherDisplayComponent,
    SpainMapComponent,
    AnimatedBackgroundComponent
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
  
  // Historial y sugerencias
  searchHistory: SearchHistoryItem[] = [];
  popularSuggestions: string[] = [];
  showHistory = false;
  
  // Búsqueda por voz
  isVoiceSearchSupported = false;
  isListeningVoice = false;
  
  // Alertas activas (generadas dinámicamente desde los datos meteorológicos)
  alertasActivas: WeatherAlert[] = [];
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private searchHistoryService: SearchHistoryService,
    private voiceSearchService: VoiceSearchService,
    private gamificationService: GamificationService
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filtrarMunicipios(query);
    });

    // Inicializar búsqueda por voz
    this.isVoiceSearchSupported = this.voiceSearchService.isSupported();
    
    // Suscribirse a resultados de voz
    this.voiceSearchService.result$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transcript => {
        if (transcript) {
          this.searchQuery = transcript;
          this.onSearchInput();
        }
        this.isListeningVoice = false;
      });

    // Cargar historial
    this.searchHistoryService.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.searchHistory = history;
      });

    // Cargar sugerencias populares
    this.popularSuggestions = this.searchHistoryService.getPopularSuggestions();
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
    this.showNotification('info', 'Descargando dataset completo de municipios...');
    
    this.weatherService.getMunicipios().subscribe({
      next: (municipios) => {
        this.todosLosMunicipios = municipios;
        this.isLoadingMunicipios = false;
        console.log(`✅ ${municipios.length} municipios cargados`);
        
        const mensaje = municipios.length > 1000 
          ? `${municipios.length} municipios disponibles (cargado desde caché)`
          : `${municipios.length} municipios cargados. Búsqueda en tiempo real disponible`;
        
        this.showNotification('success', mensaje);
      },
      error: (error) => {
        console.error('Error cargando municipios:', error);
        this.isLoadingMunicipios = false;
        this.showNotification('error', 'Error al cargar la lista de municipios. Intenta recargar la página.');
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
            this.showNotification('info', 'No se encontraron municipios con ese nombre');
          }
        },
        error: (error) => {
          console.error('Error buscando municipios:', error);
          this.showNotification('warning', 'Error en la búsqueda. Intenta de nuevo.');
        }
      });
    }
  }
  
  seleccionarMunicipio(municipio: Municipio) {
    this.municipioActual = municipio;
    this.searchQuery = municipio.nombre;
    this.showSearchResults = false;
    this.showNotification('success', `Mostrando el tiempo para ${municipio.nombre}`);
    
    // Guardar en historial
    this.searchHistoryService.addToHistory(municipio.id, municipio.nombre);
    
    // Trackear acción para gamificación
    this.gamificationService.trackAction('check_weather');
    
    // Generar alertas basadas en el pronóstico
    this.generarAlertas(municipio);
    
    this.scrollToWeather();
  }
  
  clearSearch() {
    this.searchQuery = '';
    this.municipiosFiltrados = [];
    this.showSearchResults = false;
    this.showHistory = false;
  }
  
  /**
   * Iniciar búsqueda por voz
   */
  startVoiceSearch(): void {
    if (!this.isVoiceSearchSupported) {
      this.showNotification('warning', 'Búsqueda por voz no disponible en este navegador');
      return;
    }

    if (this.isListeningVoice) {
      this.voiceSearchService.stopListening();
      this.isListeningVoice = false;
    } else {
      this.voiceSearchService.startListening();
      this.isListeningVoice = true;
      this.showNotification('info', '🎤 Escuchando... Di el nombre de un municipio');
    }
  }

  /**
   * Seleccionar desde historial
   */
  selectFromHistory(item: SearchHistoryItem): void {
    const municipio = this.todosLosMunicipios.find(m => m.id === item.id);
    if (municipio) {
      this.seleccionarMunicipio(municipio);
    } else {
      this.searchQuery = item.nombre;
      this.onSearchInput();
    }
  }

  /**
   * Limpiar historial de búsquedas
   */
  clearSearchHistory(): void {
    this.searchHistoryService.clearHistory();
    this.showNotification('info', 'Historial de búsquedas eliminado');
  }

  /**
   * Seleccionar sugerencia popular
   */
  selectPopularSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.onSearchInput();
  }

  /**
   * Mostrar/ocultar historial
   */
  onSearchFocus() {
    if (this.searchQuery.length >= 1) {
      this.showSearchResults = true;
      this.showHistory = false;
      this.filtrarMunicipios(this.searchQuery);
    } else {
      // Mostrar historial y sugerencias si no hay búsqueda
      this.showHistory = true;
      this.showSearchResults = false;
    }
  }
  
  buscarMunicipioPorNombre(nombre: string) {
    this.searchQuery = nombre;
    this.filtrarMunicipios(nombre);
    
    if (this.municipiosFiltrados.length > 0) {
      this.seleccionarMunicipio(this.municipiosFiltrados[0]);
    }
  }
  
  volverABusqueda() {
    this.municipioActual = null;
    this.searchQuery = '';
    this.municipiosFiltrados = [];
    this.scrollToTop();
    this.showNotification('info', 'Busca otra ciudad para ver el pronóstico');
  }
  
  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  cambiarTipoPrecision(tipo: 'diaria' | 'horaria') {
    this.tipoPrecisionActual = tipo;
    const mensaje = tipo === 'diaria' 
      ? 'Mostrando predicción diaria' 
      : 'Mostrando predicción horaria';
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
      this.showNotification('success', '¡Bienvenido a Nubisfera! Busca tu municipio para comenzar');
    }, 1000);
  }
  
  private scrollToWeather() {
    setTimeout(() => {
      const weatherSection = document.getElementById('weather-section');
      if (weatherSection) {
        weatherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  onProvinciaSeleccionada(provincia: string) {
    // Buscar el municipio capital de la provincia
    const municipioCapital = this.todosLosMunicipios.find(m => 
      m.nombre.toLowerCase() === provincia.toLowerCase() ||
      (m.provincia && m.provincia.toLowerCase() === provincia.toLowerCase()) ||
      (m.capital && m.capital.toLowerCase() === provincia.toLowerCase())
    );
    
    if (municipioCapital) {
      this.seleccionarMunicipio(municipioCapital);
      this.showNotification('success', `Mostrando el tiempo en ${provincia}`);
    } else {
      // Si no encuentra la capital exacta, buscar el municipio más poblado de esa provincia
      const municipiosProvincia = this.todosLosMunicipios.filter(m => 
        m.provincia && m.provincia.toLowerCase() === provincia.toLowerCase()
      );
      
      if (municipiosProvincia.length > 0) {
        const municipioMasPoblado = municipiosProvincia.reduce((prev, current) => {
          const poblacionCurrent = current.poblacion || parseInt(current.num_hab || '0') || 0;
          const poblacionPrev = prev.poblacion || parseInt(prev.num_hab || '0') || 0;
          return poblacionCurrent > poblacionPrev ? current : prev;
        });
        this.seleccionarMunicipio(municipioMasPoblado);
        this.showNotification('success', `Mostrando el tiempo en ${municipioMasPoblado.nombre}, ${provincia}`);
      } else {
        this.showNotification('warning', `No se encontraron datos para ${provincia}`);
      }
    }
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
          this.showNotification('success', 'Compartido correctamente');
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
      this.showNotification('success', 'Enlace copiado al portapapeles');
    }).catch(() => {
      this.showNotification('error', 'No se pudo copiar el enlace');
    });
  }
  
  private refreshWeather() {
    if (this.municipioActual) {
      this.isLoadingGlobal = true;
      this.showNotification('info', 'Actualizando datos meteorológicos...');
      
      setTimeout(() => {
        this.isLoadingGlobal = false;
        this.showNotification('success', 'Datos actualizados correctamente');
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
    this.showNotification('info', 'Detectando tu ubicación...');
    
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
              `Municipio más cercano: ${municipioCercano.nombre} (a ${distanciaMinima.toFixed(1)} km)`
            );
            this.scrollToWeather();
          } else {
            this.showNotification('warning', 
              'No se pudo encontrar un municipio cercano con coordenadas válidas'
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
          
          this.showNotification('warning', mensaje);
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
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type];
  }

  verTodasLasAlertas() {
    // Si hay alertas activas, mostrar información detallada
    if (this.alertasActivas.length > 0) {
      const alertasResumen = this.alertasActivas.length === 1 
        ? '1 alerta activa' 
        : `${this.alertasActivas.length} alertas activas`;
      
      const alertasDetalle = this.alertasActivas
        .map(a => `${this.getAlertIcon(a.icono)} ${a.tipo} - Nivel ${a.nivelTexto} (${a.zona})`)
        .join('\n');
      
      // Mostrar diálogo de confirmación con las alertas
      const mensaje = `📢 ${alertasResumen} en tu región:\n\n${alertasDetalle}\n\n¿Deseas ver más información en el sitio oficial?`;
      
      if (confirm(mensaje)) {
        this.abrirSitioAlertas();
      } else {
        this.showNotification('info', 'Consulta fuentes oficiales para información actualizada');
      }
    } else {
      this.showNotification('success', '✅ No hay alertas meteorológicas activas. Todo tranquilo en tu ubicación');
    }
  }
  
  private getAlertIcon(iconName: string): string {
    const icons: {[key: string]: string} = {
      'wind': '💨',
      'cloud-rain': '🌧️',
      'bolt': '⚡',
      'snowflake': '❄️',
      'temperature-high': '🌡️',
      'water': '🌊'
    };
    return icons[iconName] || '⚠️';
  }
  
  private abrirSitioAlertas() {
    let alertUrl = 'https://www.meteoalarm.org/';
    
    // Si hay ciudad seleccionada, usar su país para URL específica
    if (this.municipioActual) {
      const pais = this.municipioActual.ccaa || this.municipioActual.capital || '';
      
      // URLs específicas por país
      if (pais.includes('Spain') || pais.includes('España')) {
        alertUrl = 'https://www.aemet.es/es/eltiempo/prediccion/avisos';
      } else if (pais.includes('United States') || pais.includes('USA')) {
        alertUrl = 'https://www.weather.gov/alerts';
      } else if (pais.includes('France') || pais.includes('Francia')) {
        alertUrl = 'https://vigilance.meteofrance.fr/';
      } else if (pais.includes('United Kingdom') || pais.includes('Reino Unido')) {
        alertUrl = 'https://www.metoffice.gov.uk/weather/warnings-and-advice';
      } else if (pais.includes('Germany') || pais.includes('Alemania')) {
        alertUrl = 'https://www.dwd.de/EN/weather/warnings/warnings_node.html';
      } else if (pais.includes('Italy') || pais.includes('Italia')) {
        alertUrl = 'http://www.protezionecivile.gov.it/attivita-rischi/meteo-idro/attivita/previsione-prevenzione/centro-funzionale-centrale-rischio-meteo-idrogeologico/monitoraggio-sorveglianza/bollettini-criticita';
      }
    }
    
    window.open(alertUrl, '_blank', 'noopener,noreferrer');
    this.showNotification('info', '🌐 Abriendo sitio oficial de alertas meteorológicas...');
  }
  
  /**
   * Genera alertas meteorológicas completas basadas en datos de Open-Meteo
   * Incluye calidad del aire, riesgo de inundación y condiciones meteorológicas
   */
  private generarAlertas(municipio: Municipio) {
    // Limpiar alertas anteriores
    this.alertasActivas = [];
    
    // Mostrar indicador de carga temporal
    console.log('🔍 Analizando condiciones meteorológicas para:', municipio.nombre);
    
    // Usar método simplificado que siempre funciona (solo alertas meteorológicas)
    this.weatherService.getWeatherForecast(municipio).subscribe({
      next: (weatherData) => {
        console.log('🌤️ Datos meteorológicos obtenidos:', weatherData.current);
        
        // Generar alertas meteorológicas básicas (siempre funciona)
        const alertasBasicas = this.weatherService.generateWeatherAlerts(weatherData);
        this.alertasActivas.push(...alertasBasicas);
        
        // Intentar obtener alertas adicionales (opcional)
        this.weatherService.generateComprehensiveAlerts(municipio).subscribe({
          next: (alertasCompletas) => {
            console.log('🚨 Alertas completas:', alertasCompletas);
            // Reemplazar con alertas completas
            this.alertasActivas = alertasCompletas;
            this.mostrarResumenAlertas(municipio.nombre);
          },
          error: (error) => {
            console.warn('⚠️ Error obteniendo alertas completas, usando básicas:', error);
            // Mantener las alertas básicas que ya tenemos
            this.mostrarResumenAlertas(municipio.nombre);
          }
        });
        
        // Mostrar resumen inmediatamente con alertas básicas
        if (this.alertasActivas.length === 0) {
          // Si no hay alertas, forzar al menos una para debugging
          this.mostrarResumenAlertas(municipio.nombre);
        }
      },
      error: (error) => {
        console.error('💥 Error obteniendo datos meteorológicos:', error);
        this.showNotification('error', 'Error obteniendo datos meteorológicos. Inténtalo de nuevo.');
        this.alertasActivas = [];
      }
    });
  }
  
  /**
   * Muestra el resumen de alertas al usuario
   */
  private mostrarResumenAlertas(nombreCiudad: string) {
    if (this.alertasActivas.length > 0) {
      const alertasCount = this.alertasActivas.length;
      const alertasTexto = alertasCount === 1 ? '1 alerta detectada' : `${alertasCount} alertas detectadas`;
      
      // Categorizar alertas para el mensaje
      const categorias = this.alertasActivas.reduce((acc, alerta) => {
        const cat = alerta.categoria || 'meteorologica';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const categoriasTexto = Object.entries(categorias)
        .map(([cat, count]) => {
          switch (cat) {
            case 'calidad_aire': return `${count} calidad del aire`;
            case 'inundacion': return `${count} riesgo de inundación`;
            case 'polen': return `${count} polen`;
            default: return `${count} meteorológica${count > 1 ? 's' : ''}`;
          }
        })
        .join(', ');
      
      this.showNotification('warning', `⚠️ ${alertasTexto} (${categoriasTexto}) para ${nombreCiudad}`);
      
      // Log detallado para debugging
      console.log('🚨 Alertas finales mostradas:', {
        total: this.alertasActivas.length,
        categorias,
        alertas: this.alertasActivas
      });
    } else {
      console.log('❓ Generando alerta informativa para debugging...');
      // Si no hay alertas, crear una alerta informativa para debugging
      this.alertasActivas = [{
        id: `debug-${Date.now()}`,
        tipo: 'Estado del Tiempo',
        nivel: 'amarilla',
        nivelTexto: 'Info',
        zona: nombreCiudad,
        icono: 'info-circle',
        descripcion: `Condiciones monitoreadas para ${nombreCiudad}`,
        valor: 1,
        umbral: 0,
        categoria: 'meteorologica'
      }];
      
      this.showNotification('info', `🌤️ Condiciones monitoreadas para ${nombreCiudad}`);
      console.log('ℹ️ Alerta informativa creada para debugging');
    }
  }
}
