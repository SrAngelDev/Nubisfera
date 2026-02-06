import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import {
  TimelineDataPoint,
  TimeRange,
  TimelineConfig,
  PlaybackState,
  TimelineEvent,
  TimelineMetric,
  AggregatedData
} from '../models/timeline.model';

/**
 * Servicio para gestionar el Timeline Meteorológico
 * Maneja datos temporales, reproducción y eventos
 */
@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  // Estado de configuración
  private configSubject = new BehaviorSubject<TimelineConfig>({
    mode: 'hourly',
    autoPlay: false,
    playbackSpeed: 1,
    showGrid: true,
    showTooltips: true,
    selectedMetrics: ['temperature', 'precipitation', 'wind']
  });
  public config$ = this.configSubject.asObservable();

  // Estado de reproducción
  private playbackSubject = new BehaviorSubject<PlaybackState>({
    isPlaying: false,
    currentTime: new Date(),
    speed: 1,
    loop: false
  });
  public playback$ = this.playbackSubject.asObservable();

  // Datos del timeline
  private dataSubject = new BehaviorSubject<TimelineDataPoint[]>([]);
  public data$ = this.dataSubject.asObservable();

  // Eventos del timeline
  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  // Rango de tiempo actual
  private timeRangeSubject = new BehaviorSubject<TimeRange>({
    start: new Date(),
    end: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000) // 16 días
  });
  public timeRange$ = this.timeRangeSubject.asObservable();

  constructor() {
    this.initializeTestData();
  }

  /**
   * Inicializa datos de prueba
   */
  private initializeTestData(): void {
    const now = new Date();
    const hourlyData: TimelineDataPoint[] = [];
    const events: TimelineEvent[] = [];

    // Generar 16 días de datos horarios
    for (let day = 0; day < 16; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now.getTime() + (day * 24 + hour) * 60 * 60 * 1000);
        
        // Patrón de temperatura: más calor a mediodía, más frío de madrugada
        const baseTemp = 18;
        const dailyVariation = 8 * Math.sin((hour - 6) * Math.PI / 12);
        const randomVariation = Math.random() * 2 - 1;
        const temperature = Math.round((baseTemp + dailyVariation + randomVariation) * 10) / 10;

        // Precipitación más probable por la tarde
        const precipChance = hour >= 15 && hour <= 20 ? 0.3 : 0.1;
        const precipitation = Math.random() < precipChance ? Math.random() * 80 : Math.random() * 20;

        // Viento más fuerte por la tarde
        const windSpeed = 10 + Math.random() * 15 + (hour >= 12 && hour <= 18 ? 10 : 0);

        hourlyData.push({
          timestamp,
          temperature,
          feelsLike: temperature - (windSpeed > 20 ? 2 : 0),
          precipitation: Math.round(precipitation),
          humidity: 50 + Math.random() * 30,
          windSpeed: Math.round(windSpeed),
          windDirection: Math.floor(Math.random() * 360),
          pressure: 1010 + Math.random() * 20,
          uvIndex: hour >= 10 && hour <= 16 ? Math.floor(4 + Math.random() * 4) : 0,
          cloudCover: Math.round(precipitation),
          visibility: 10 - (precipitation / 20),
          condition: this.getConditionFromData(temperature, precipitation, hour),
          icon: this.getIconFromCondition(this.getConditionFromData(temperature, precipitation, hour))
        });
      }

      // Agregar eventos especiales
      const sunriseTime = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      sunriseTime.setHours(7, 30, 0, 0);
      events.push({
        id: `sunrise-${day}`,
        timestamp: sunriseTime,
        type: 'sunrise',
        title: 'Amanecer',
        icon: 'fas fa-sunrise',
        color: '#f59e0b'
      });

      const sunsetTime = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      sunsetTime.setHours(19, 45, 0, 0);
      events.push({
        id: `sunset-${day}`,
        timestamp: sunsetTime,
        type: 'sunset',
        title: 'Atardecer',
        icon: 'fas fa-sunset',
        color: '#e91e63'
      });

      // Agregar alerta si hay alta precipitación
      const highPrecipHour = hourlyData.find((d, i) => 
        i >= day * 24 && i < (day + 1) * 24 && d.precipitation > 60
      );
      if (highPrecipHour) {
        events.push({
          id: `alert-precip-${day}`,
          timestamp: highPrecipHour.timestamp,
          type: 'alert',
          title: 'Alerta de Lluvia',
          description: 'Alta probabilidad de precipitación intensa',
          severity: 'medium',
          icon: 'fas fa-cloud-rain',
          color: '#3b82f6'
        });
      }
    }

    this.dataSubject.next(hourlyData);
    this.eventsSubject.next(events);

    // Configurar rango de tiempo inicial
    this.timeRangeSubject.next({
      start: now,
      end: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Obtiene la condición del tiempo basada en los datos
   */
  private getConditionFromData(temp: number, precip: number, hour: number): string {
    if (precip > 60) return 'Lluvioso';
    if (precip > 30) return 'Parcialmente nublado';
    if (hour >= 6 && hour <= 20 && precip < 20) return 'Soleado';
    if (hour < 6 || hour > 20) return 'Despejado';
    return 'Nublado';
  }

  /**
   * Obtiene el icono según la condición
   */
  private getIconFromCondition(condition: string): string {
    const icons: Record<string, string> = {
      'Soleado': 'fas fa-sun',
      'Parcialmente nublado': 'fas fa-cloud-sun',
      'Nublado': 'fas fa-cloud',
      'Lluvioso': 'fas fa-cloud-rain',
      'Despejado': 'fas fa-moon'
    };
    return icons[condition] || 'fas fa-cloud';
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): TimelineConfig {
    return this.configSubject.value;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<TimelineConfig>): void {
    const current = this.configSubject.value;
    this.configSubject.next({ ...current, ...config });
  }

  /**
   * Cambia el modo del timeline
   */
  setMode(mode: 'hourly' | 'daily' | 'weekly'): void {
    this.updateConfig({ mode });
  }

  /**
   * Alterna una métrica en la visualización
   */
  toggleMetric(metric: TimelineMetric): void {
    const config = this.configSubject.value;
    const metrics = config.selectedMetrics;
    const index = metrics.indexOf(metric);
    
    if (index > -1) {
      metrics.splice(index, 1);
    } else {
      metrics.push(metric);
    }
    
    this.updateConfig({ selectedMetrics: [...metrics] });
  }

  /**
   * Obtiene el estado de reproducción actual
   */
  getPlaybackState(): PlaybackState {
    return this.playbackSubject.value;
  }

  /**
   * Inicia la reproducción del timeline
   */
  play(): void {
    const state = this.playbackSubject.value;
    if (state.isPlaying) return;

    this.playbackSubject.next({ ...state, isPlaying: true });

    // Simular avance del tiempo
    const timeRange = this.timeRangeSubject.value;
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    const speedMultiplier = state.speed;
    
    // Intervalos de 100ms, avanza según la velocidad
    const advancePerTick = (duration / 1000) * speedMultiplier; // ms por tick

    interval(100)
      .pipe(
        takeWhile(() => this.playbackSubject.value.isPlaying),
        map(() => {
          const current = this.playbackSubject.value;
          const newTime = new Date(current.currentTime.getTime() + advancePerTick);
          
          // Si llegamos al final
          if (newTime >= timeRange.end) {
            if (current.loop) {
              return timeRange.start;
            } else {
              this.pause();
              return timeRange.end;
            }
          }
          
          return newTime;
        })
      )
      .subscribe(newTime => {
        const current = this.playbackSubject.value;
        this.playbackSubject.next({ ...current, currentTime: newTime });
      });
  }

  /**
   * Pausa la reproducción
   */
  pause(): void {
    const state = this.playbackSubject.value;
    this.playbackSubject.next({ ...state, isPlaying: false });
  }

  /**
   * Detiene y resetea la reproducción
   */
  stop(): void {
    const state = this.playbackSubject.value;
    const timeRange = this.timeRangeSubject.value;
    this.playbackSubject.next({
      ...state,
      isPlaying: false,
      currentTime: timeRange.start
    });
  }

  /**
   * Establece el tiempo actual
   */
  setCurrentTime(time: Date): void {
    const state = this.playbackSubject.value;
    this.playbackSubject.next({ ...state, currentTime: time });
  }

  /**
   * Establece la velocidad de reproducción
   */
  setSpeed(speed: number): void {
    const state = this.playbackSubject.value;
    this.playbackSubject.next({ ...state, speed: Math.max(0.25, Math.min(4, speed)) });
  }

  /**
   * Alterna el modo loop
   */
  toggleLoop(): void {
    const state = this.playbackSubject.value;
    this.playbackSubject.next({ ...state, loop: !state.loop });
  }

  /**
   * Obtiene los datos en el rango de tiempo especificado
   */
  getDataInRange(start: Date, end: Date): TimelineDataPoint[] {
    return this.dataSubject.value.filter(
      point => point.timestamp >= start && point.timestamp <= end
    );
  }

  /**
   * Obtiene el punto de datos más cercano a un tiempo específico
   */
  getDataAtTime(time: Date): TimelineDataPoint | undefined {
    const data = this.dataSubject.value;
    if (data.length === 0) return undefined;

    let closest = data[0];
    let minDiff = Math.abs(time.getTime() - closest.timestamp.getTime());

    for (const point of data) {
      const diff = Math.abs(time.getTime() - point.timestamp.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  /**
   * Obtiene eventos en el rango de tiempo
   */
  getEventsInRange(start: Date, end: Date): TimelineEvent[] {
    return this.eventsSubject.value.filter(
      event => event.timestamp >= start && event.timestamp <= end
    );
  }

  /**
   * Agrega un evento personalizado
   */
  addEvent(event: TimelineEvent): void {
    const events = [...this.eventsSubject.value, event];
    this.eventsSubject.next(events);
  }

  /**
   * Elimina un evento
   */
  removeEvent(eventId: string): void {
    const events = this.eventsSubject.value.filter(e => e.id !== eventId);
    this.eventsSubject.next(events);
  }

  /**
   * Agrega datos agregados por día
   */
  getAggregatedData(mode: 'hourly' | 'daily' | 'weekly'): AggregatedData[] {
    const data = this.dataSubject.value;
    const events = this.eventsSubject.value;
    const aggregated: AggregatedData[] = [];

    if (mode === 'daily') {
      // Agrupar por día
      const dayGroups = new Map<string, TimelineDataPoint[]>();
      
      data.forEach(point => {
        const dayKey = point.timestamp.toISOString().split('T')[0];
        if (!dayGroups.has(dayKey)) {
          dayGroups.set(dayKey, []);
        }
        dayGroups.get(dayKey)!.push(point);
      });

      dayGroups.forEach((points, dayKey) => {
        const period = new Date(dayKey);
        const temps = points.map(p => p.temperature);
        const dayEvents = events.filter(e => 
          e.timestamp.toISOString().split('T')[0] === dayKey
        );

        aggregated.push({
          period,
          avgTemperature: temps.reduce((a, b) => a + b, 0) / temps.length,
          maxTemperature: Math.max(...temps),
          minTemperature: Math.min(...temps),
          totalPrecipitation: points.reduce((sum, p) => sum + p.precipitation, 0) / points.length,
          avgWindSpeed: points.reduce((sum, p) => sum + p.windSpeed, 0) / points.length,
          maxWindSpeed: Math.max(...points.map(p => p.windSpeed)),
          avgHumidity: points.reduce((sum, p) => sum + p.humidity, 0) / points.length,
          dominantCondition: this.getDominantCondition(points),
          events: dayEvents
        });
      });
    }

    return aggregated.sort((a, b) => a.period.getTime() - b.period.getTime());
  }

  /**
   * Obtiene la condición dominante de un conjunto de puntos
   */
  private getDominantCondition(points: TimelineDataPoint[]): string {
    const conditions = new Map<string, number>();
    
    points.forEach(point => {
      const count = conditions.get(point.condition) || 0;
      conditions.set(point.condition, count + 1);
    });

    let maxCount = 0;
    let dominant = 'Desconocido';
    
    conditions.forEach((count, condition) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = condition;
      }
    });

    return dominant;
  }

  /**
   * Exporta los datos del timeline
   */
  exportData(): { data: TimelineDataPoint[], events: TimelineEvent[] } {
    return {
      data: this.dataSubject.value,
      events: this.eventsSubject.value
    };
  }
}
