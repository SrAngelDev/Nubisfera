import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherIconService {

  constructor() { }

  /**
   * Determina si es de día según la hora
   * Considera día entre las 7:00 y las 20:00
   */
  private isDaytime(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 7 && hour < 20;
  }

  /**
   * Obtiene el icono de Weather Icons según el código WMO y la hora
   */
  getWeatherIcon(codigo: number, fecha?: Date): string {
    const isDaytime = fecha ? this.isDaytime(fecha) : true;
    
    // Mapeo de códigos WMO a Weather Icons (día/noche)
    const iconMap: { [key: number]: { day: string; night: string } } = {
      0: { day: 'wi-day-sunny', night: 'wi-night-clear' },                    // Despejado
      1: { day: 'wi-day-sunny-overcast', night: 'wi-night-alt-partly-cloudy' }, // Principalmente despejado
      2: { day: 'wi-day-cloudy', night: 'wi-night-alt-cloudy' },              // Parcialmente nublado
      3: { day: 'wi-cloudy', night: 'wi-cloudy' },                            // Nublado
      45: { day: 'wi-day-fog', night: 'wi-night-fog' },                       // Niebla
      48: { day: 'wi-day-fog', night: 'wi-night-fog' },                       // Niebla con escarcha
      51: { day: 'wi-day-sprinkle', night: 'wi-night-alt-sprinkle' },        // Llovizna ligera
      53: { day: 'wi-day-sprinkle', night: 'wi-night-alt-sprinkle' },        // Llovizna moderada
      55: { day: 'wi-day-rain', night: 'wi-night-alt-rain' },                // Llovizna densa
      56: { day: 'wi-day-rain-mix', night: 'wi-night-alt-rain-mix' },        // Llovizna helada ligera
      57: { day: 'wi-day-rain-mix', night: 'wi-night-alt-rain-mix' },        // Llovizna helada densa
      61: { day: 'wi-day-rain', night: 'wi-night-alt-rain' },                // Lluvia ligera
      63: { day: 'wi-day-rain', night: 'wi-night-alt-rain' },                // Lluvia moderada
      65: { day: 'wi-day-rain-wind', night: 'wi-night-alt-rain-wind' },      // Lluvia intensa
      66: { day: 'wi-day-sleet', night: 'wi-night-alt-sleet' },              // Lluvia helada ligera
      67: { day: 'wi-day-sleet', night: 'wi-night-alt-sleet' },              // Lluvia helada intensa
      71: { day: 'wi-day-snow', night: 'wi-night-alt-snow' },                // Nieve ligera
      73: { day: 'wi-day-snow', night: 'wi-night-alt-snow' },                // Nieve moderada
      75: { day: 'wi-day-snow-wind', night: 'wi-night-alt-snow-wind' },      // Nieve intensa
      77: { day: 'wi-day-snow', night: 'wi-night-alt-snow' },                // Granos de nieve
      80: { day: 'wi-day-showers', night: 'wi-night-alt-showers' },          // Chubascos ligeros
      81: { day: 'wi-day-showers', night: 'wi-night-alt-showers' },          // Chubascos moderados
      82: { day: 'wi-day-storm-showers', night: 'wi-night-alt-storm-showers' }, // Chubascos violentos
      85: { day: 'wi-day-snow', night: 'wi-night-alt-snow' },                // Chubascos de nieve ligeros
      86: { day: 'wi-day-snow-wind', night: 'wi-night-alt-snow-wind' },      // Chubascos de nieve intensos
      95: { day: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm' }, // Tormenta
      96: { day: 'wi-day-hail', night: 'wi-night-alt-hail' },                // Tormenta con granizo ligero
      99: { day: 'wi-day-hail', night: 'wi-night-alt-hail' }                 // Tormenta con granizo intenso
    };

    const icons = iconMap[codigo];
    if (!icons) {
      console.warn('Código WMO desconocido:', codigo);
      return 'wi-thermometer';
    }

    return isDaytime ? icons.day : icons.night;
  }

  getWeatherDescription(codigo: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Despejado',
      1: 'Principalmente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla con escarcha',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna densa',
      56: 'Llovizna helada ligera',
      57: 'Llovizna helada densa',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia intensa',
      66: 'Lluvia helada ligera',
      67: 'Lluvia helada intensa',
      71: 'Nieve ligera',
      73: 'Nieve moderada',
      75: 'Nieve intensa',
      77: 'Granos de nieve',
      80: 'Chubascos ligeros',
      81: 'Chubascos moderados',
      82: 'Chubascos violentos',
      85: 'Chubascos de nieve ligeros',
      86: 'Chubascos de nieve intensos',
      95: 'Tormenta',
      96: 'Tormenta con granizo ligero',
      99: 'Tormenta con granizo intenso'
    };

    const description = descriptions[codigo];
    if (!description) {
      console.warn('Código WMO desconocido:', codigo);
      return 'Información no disponible';
    }
    return description;
  }
}