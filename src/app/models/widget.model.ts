/**
 * Modelo para el sistema de widgets del dashboard
 */

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';
export type WidgetType = 
  | 'temperature' 
  | 'precipitation' 
  | 'wind' 
  | 'humidity' 
  | 'uv-index' 
  | 'air-quality'
  | 'sunrise-sunset'
  | 'alerts'
  | 'forecast-summary'
  | 'radar'
  | 'custom';

/**
 * Configuración base de un widget
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  order: number;
  enabled: boolean;
  refreshInterval?: number; // en segundos
}

/**
 * Datos de temperatura para el widget
 */
export interface TemperatureWidgetData {
  current: number;
  feelsLike: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  hourlyForecast: Array<{
    hour: string;
    temp: number;
  }>;
}

/**
 * Datos de precipitación para el widget
 */
export interface PrecipitationWidgetData {
  currentProbability: number;
  nextHourProbability: number;
  accumulated24h: number;
  forecast: Array<{
    hour: string;
    probability: number;
    amount: number;
  }>;
}

/**
 * Datos de viento para el widget
 */
export interface WindWidgetData {
  speed: number;
  gusts: number;
  direction: number;
  directionName: string;
  beaufortScale: number;
  forecast: Array<{
    hour: string;
    speed: number;
    direction: number;
  }>;
}

/**
 * Datos de UV Index para el widget
 */
export interface UVIndexWidgetData {
  current: number;
  max: number;
  level: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
  protection: string;
  hourlyForecast: Array<{
    hour: string;
    index: number;
  }>;
}

/**
 * Datos de Sunrise/Sunset para el widget
 */
export interface SunriseSunsetWidgetData {
  sunrise: Date;
  sunset: Date;
  dayLength: number; // en minutos
  civilTwilight: {
    dawn: Date;
    dusk: Date;
  };
  progress: number; // 0-100, progreso del día
}

/**
 * Datos de Alertas Meteorológicas para el widget
 */
export interface AlertsWidgetData {
  active: number;
  alerts: Array<{
    type: 'rain' | 'wind' | 'temperature' | 'storm' | 'snow' | 'fog';
    severity: 'info' | 'warning' | 'danger';
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }>;
}

/**
 * Layout del dashboard
 */
export interface DashboardLayout {
  columns: number;
  widgets: WidgetConfig[];
}

/**
 * Configuración de comparación de ciudades
 */
export interface CityComparisonConfig {
  enabled: boolean;
  cities: Array<{
    id: string;
    name: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  }>;
  metrics: Array<'temperature' | 'precipitation' | 'wind' | 'humidity'>;
}
