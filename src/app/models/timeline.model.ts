/**
 * Modelos para el Timeline Meteorológico
 */

/**
 * Punto de datos en el timeline
 */
export interface TimelineDataPoint {
  timestamp: Date;
  temperature: number;
  feelsLike: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  cloudCover: number;
  visibility: number;
  condition: string;
  icon: string;
}

/**
 * Rango de tiempo para el timeline
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Configuración de visualización del timeline
 */
export interface TimelineConfig {
  mode: 'hourly' | 'daily' | 'weekly';
  autoPlay: boolean;
  playbackSpeed: number; // 0.5x - 4x
  showGrid: boolean;
  showTooltips: boolean;
  selectedMetrics: TimelineMetric[];
}

/**
 * Métrica visualizable en el timeline
 */
export type TimelineMetric = 
  | 'temperature'
  | 'precipitation'
  | 'wind'
  | 'humidity'
  | 'pressure'
  | 'uvIndex'
  | 'cloudCover';

/**
 * Estado del reproductor de timeline
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: Date;
  speed: number;
  loop: boolean;
}

/**
 * Evento del timeline
 */
export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'alert' | 'sunrise' | 'sunset' | 'peak-temp' | 'storm' | 'custom';
  title: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  icon?: string;
  color?: string;
}

/**
 * Configuración de zoom del timeline
 */
export interface ZoomConfig {
  minScale: number;
  maxScale: number;
  currentScale: number;
  centerTime: Date;
}

/**
 * Datos agregados por período
 */
export interface AggregatedData {
  period: Date;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  totalPrecipitation: number;
  avgWindSpeed: number;
  maxWindSpeed: number;
  avgHumidity: number;
  dominantCondition: string;
  events: TimelineEvent[];
}
