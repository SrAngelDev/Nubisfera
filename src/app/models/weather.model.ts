import { Municipio } from './municipio.model';

/**
 * Datos actuales del tiempo
 */
export interface CurrentWeather {
  time: Date;
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGusts?: number;
  isDay?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  cloudCover?: number;
  pressureMsl?: number;
  surfacePressure?: number;
}

/**
 * Predicción horaria
 */
export interface HourlyForecast {
  time: Date;
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  dewPoint?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  cloudCover?: number;
  pressureMsl?: number;
  surfacePressure?: number;
  visibility?: number;
  evapotranspiration?: number;
  windGusts?: number;
  uvIndex?: number;
  isDay?: number;
}

/**
 * Predicción diaria
 */
export interface DailyForecast {
  date: Date;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  sunrise: Date;
  sunset: Date;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  daylightDuration?: number;
  sunshineDuration?: number;
  uvIndexMax?: number;
  uvIndexClearSkyMax?: number;
  rainSum?: number;
  showersSum?: number;
  snowfallSum?: number;
  precipitationHours?: number;
  windGustsMax?: number;
  shortwaveRadiationSum?: number;
}

/**
 * Datos completos del tiempo
 */
export interface WeatherData {
  municipio: Municipio;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

/**
 * Códigos WMO del tiempo
 * https://open-meteo.com/en/docs
 */
export const WMO_WEATHER_CODES: { [key: number]: { description: string; icon: string } } = {
  0: { description: 'Despejado', icon: '☀️' },
  1: { description: 'Principalmente despejado', icon: '🌤️' },
  2: { description: 'Parcialmente nublado', icon: '⛅' },
  3: { description: 'Nublado', icon: '☁️' },
  45: { description: 'Niebla', icon: '🌫️' },
  48: { description: 'Niebla con escarcha', icon: '🌫️' },
  51: { description: 'Llovizna ligera', icon: '🌦️' },
  53: { description: 'Llovizna moderada', icon: '🌦️' },
  55: { description: 'Llovizna densa', icon: '🌧️' },
  56: { description: 'Llovizna helada ligera', icon: '🌧️' },
  57: { description: 'Llovizna helada densa', icon: '🌧️' },
  61: { description: 'Lluvia ligera', icon: '🌧️' },
  63: { description: 'Lluvia moderada', icon: '🌧️' },
  65: { description: 'Lluvia intensa', icon: '⛈️' },
  66: { description: 'Lluvia helada ligera', icon: '🌧️' },
  67: { description: 'Lluvia helada intensa', icon: '⛈️' },
  71: { description: 'Nieve ligera', icon: '🌨️' },
  73: { description: 'Nieve moderada', icon: '🌨️' },
  75: { description: 'Nieve intensa', icon: '❄️' },
  77: { description: 'Granos de nieve', icon: '🌨️' },
  80: { description: 'Chubascos ligeros', icon: '🌦️' },
  81: { description: 'Chubascos moderados', icon: '🌧️' },
  82: { description: 'Chubascos violentos', icon: '⛈️' },
  85: { description: 'Chubascos de nieve ligeros', icon: '🌨️' },
  86: { description: 'Chubascos de nieve intensos', icon: '❄️' },
  95: { description: 'Tormenta', icon: '⛈️' },
  96: { description: 'Tormenta con granizo ligero', icon: '⛈️' },
  99: { description: 'Tormenta con granizo intenso', icon: '⛈️' }
};
