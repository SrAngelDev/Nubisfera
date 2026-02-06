import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { fetchWeatherApi } from 'openmeteo';

/**
 * Datos de calidad del aire
 */
export interface AirQualityData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  europeanAqi: number;           // European AQI (0-500)
  usAqi: number;                 // US AQI (0-500)
  pm10: number;                  // Particulate Matter 10μm (μg/m³)
  pm2_5: number;                 // Particulate Matter 2.5μm (μg/m³)
  carbonMonoxide: number;        // CO (μg/m³)
  nitrogenDioxide: number;       // NO₂ (μg/m³)
  sulphurDioxide: number;        // SO₂ (μg/m³)
  ozone: number;                 // O₃ (μg/m³)
  aerosol: number;               // Aerosol Optical Depth at 550nm
  dust: number;                  // Dust particles (μg/m³)
  uvIndex: number;               // UV Index (0-11+)
  ammonia?: number;              // NH₃ (μg/m³)
}

/**
 * Interpretación de AQI según estándares europeos
 */
export const AQI_LEVELS = {
  GOOD: { min: 0, max: 20, label: 'Buena', color: '#50f0e6', icon: '😊' },
  FAIR: { min: 21, max: 40, label: 'Aceptable', color: '#50ccaa', icon: '🙂' },
  MODERATE: { min: 41, max: 60, label: 'Moderada', color: '#f0e641', icon: '😐' },
  POOR: { min: 61, max: 80, label: 'Mala', color: '#ff5050', icon: '😷' },
  VERY_POOR: { min: 81, max: 100, label: 'Muy Mala', color: '#960032', icon: '🤢' },
  EXTREMELY_POOR: { min: 101, max: 500, label: 'Extrema', color: '#7d2181', icon: '☠️' }
};

/**
 * Servicio de Calidad del Aire usando Open-Meteo Air Quality API
 * https://open-meteo.com/en/docs/air-quality-api
 */
@Injectable({
  providedIn: 'root'
})
export class AirQualityService {
  private readonly API_URL = 'https://air-quality.open-meteo.com/v1/air-quality';

  constructor() {}

  /**
   * Obtiene los datos de calidad del aire actuales y pronóstico
   */
  getAirQuality(latitude: number, longitude: number): Observable<AirQualityData> {
    const params = {
      latitude,
      longitude,
      current: [
        'european_aqi',
        'us_aqi',
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'aerosol_optical_depth',
        'dust',
        'uv_index',
        'ammonia'
      ],
      timezone: 'Europe/Madrid',
      forecast_days: 1
    };

    return from(fetchWeatherApi(this.API_URL, params)).pipe(
      map(responses => {
        if (!responses || responses.length === 0) {
          throw new Error('No se recibieron datos de calidad del aire');
        }

        const response = responses[0];
        const current = response.current();
        
        if (!current) {
          throw new Error('No hay datos actuales de calidad del aire');
        }

        const airQualityData: AirQualityData = {
          latitude: response.latitude(),
          longitude: response.longitude(),
          timestamp: new Date(),
          europeanAqi: current.variables(0)?.value() ?? 0,
          usAqi: current.variables(1)?.value() ?? 0,
          pm10: current.variables(2)?.value() ?? 0,
          pm2_5: current.variables(3)?.value() ?? 0,
          carbonMonoxide: current.variables(4)?.value() ?? 0,
          nitrogenDioxide: current.variables(5)?.value() ?? 0,
          sulphurDioxide: current.variables(6)?.value() ?? 0,
          ozone: current.variables(7)?.value() ?? 0,
          aerosol: current.variables(8)?.value() ?? 0,
          dust: current.variables(9)?.value() ?? 0,
          uvIndex: current.variables(10)?.value() ?? 0,
          ammonia: current.variables(11)?.value()
        };

        console.log('🌫️ Datos de calidad del aire:', airQualityData);
        return airQualityData;
      }),
      catchError(error => {
        console.error('Error obteniendo calidad del aire:', error);
        return of(this.getEmptyAirQualityData(latitude, longitude));
      })
    );
  }

  /**
   * Interpreta el European AQI en un nivel legible
   */
  getAQILevel(aqi: number): typeof AQI_LEVELS[keyof typeof AQI_LEVELS] {
    if (aqi <= 20) return AQI_LEVELS.GOOD;
    if (aqi <= 40) return AQI_LEVELS.FAIR;
    if (aqi <= 60) return AQI_LEVELS.MODERATE;
    if (aqi <= 80) return AQI_LEVELS.POOR;
    if (aqi <= 100) return AQI_LEVELS.VERY_POOR;
    return AQI_LEVELS.EXTREMELY_POOR;
  }

  /**
   * Obtiene recomendaciones de salud según el AQI
   */
  getHealthRecommendation(aqi: number): string {
    const level = this.getAQILevel(aqi);
    
    const recommendations: { [key: string]: string } = {
      'Buena': 'Calidad del aire ideal para actividades al aire libre.',
      'Aceptable': 'Calidad del aire aceptable. Las personas sensibles deben considerar reducir actividades prolongadas al aire libre.',
      'Moderada': 'Personas muy sensibles pueden experimentar síntomas respiratorios. Considere reducir ejercicio intenso al aire libre.',
      'Mala': 'Todos pueden comenzar a experimentar efectos en la salud. Reduzca actividades prolongadas o intensas al aire libre.',
      'Muy Mala': 'Alerta de salud. Toda la población puede experimentar efectos más graves. Evite actividades al aire libre.',
      'Extrema': 'Alerta de emergencia. Alto riesgo para toda la población. Permanezca en interiores con ventanas cerradas.'
    };

    return recommendations[level.label] || 'Datos no disponibles.';
  }

  /**
   * Interpreta nivel de PM2.5 según estándares de la OMS
   */
  getPM25Level(pm25: number): { level: string; color: string } {
    if (pm25 <= 10) return { level: 'Excelente', color: '#50f0e6' };
    if (pm25 <= 25) return { level: 'Bueno', color: '#50ccaa' };
    if (pm25 <= 50) return { level: 'Moderado', color: '#f0e641' };
    if (pm25 <= 75) return { level: 'Malo', color: '#ff5050' };
    return { level: 'Muy Malo', color: '#960032' };
  }

  /**
   * Datos vacíos de calidad del aire (fallback)
   */
  private getEmptyAirQualityData(latitude: number, longitude: number): AirQualityData {
    return {
      latitude,
      longitude,
      timestamp: new Date(),
      europeanAqi: 0,
      usAqi: 0,
      pm10: 0,
      pm2_5: 0,
      carbonMonoxide: 0,
      nitrogenDioxide: 0,
      sulphurDioxide: 0,
      ozone: 0,
      aerosol: 0,
      dust: 0,
      uvIndex: 0
    };
  }

  /**
   * Formatea valor de contaminante para visualización
   */
  formatPollutant(value: number, unit: string = 'μg/m³'): string {
    if (value === 0 || value === null || value === undefined) {
      return `N/A`;
    }
    return `${value.toFixed(1)} ${unit}`;
  }

  /**
   * Obtiene el color indicador según el nivel de contaminante
   */
  getPollutantColor(pollutant: 'pm10' | 'pm2_5' | 'no2' | 'o3' | 'co', value: number): string {
    // Thresholds basados en estándares de la OMS y UE
    const thresholds = {
      pm10: [25, 50, 90, 180],
      pm2_5: [10, 25, 50, 75],
      no2: [40, 100, 200, 400],
      o3: [60, 120, 180, 240],
      co: [4000, 10000, 20000, 30000]
    };

    const levels = thresholds[pollutant];
    if (!levels) return '#50f0e6';

    if (value <= levels[0]) return '#50f0e6'; // Excelente
    if (value <= levels[1]) return '#50ccaa'; // Bueno
    if (value <= levels[2]) return '#f0e641'; // Moderado
    if (value <= levels[3]) return '#ff5050'; // Malo
    return '#960032'; // Muy malo
  }
}
