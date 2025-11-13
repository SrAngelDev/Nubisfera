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
   * Obtiene el emoji del clima según el código WMO y la hora
   */
  getWeatherIcon(codigo: number, fecha?: Date): string {
    const isDaytime = fecha ? this.isDaytime(fecha) : true;
    
    // Mapeo de códigos WMO a emojis (día/noche)
    const iconMap: { [key: number]: { day: string; night: string } } = {
      0: { day: '☀️', night: '🌙' },          // Despejado
      1: { day: '🌤️', night: '🌙☁️' },       // Principalmente despejado
      2: { day: '⛅', night: '☁️' },          // Parcialmente nublado
      3: { day: '☁️', night: '☁️' },          // Nublado
      45: { day: '🌫️', night: '🌫️' },        // Niebla
      48: { day: '🌫️', night: '🌫️' },        // Niebla con escarcha
      51: { day: '🌦️', night: '🌧️' },        // Llovizna ligera
      53: { day: '🌦️', night: '🌧️' },        // Llovizna moderada
      55: { day: '🌧️', night: '🌧️' },        // Llovizna densa
      56: { day: '🌧️', night: '🌧️' },        // Llovizna helada ligera
      57: { day: '🌧️', night: '🌧️' },        // Llovizna helada densa
      61: { day: '🌧️', night: '🌧️' },        // Lluvia ligera
      63: { day: '🌧️', night: '🌧️' },        // Lluvia moderada
      65: { day: '⛈️', night: '⛈️' },         // Lluvia intensa
      66: { day: '🌧️', night: '🌧️' },        // Lluvia helada ligera
      67: { day: '⛈️', night: '⛈️' },         // Lluvia helada intensa
      71: { day: '🌨️', night: '🌨️' },        // Nieve ligera
      73: { day: '🌨️', night: '🌨️' },        // Nieve moderada
      75: { day: '❄️', night: '❄️' },         // Nieve intensa
      77: { day: '🌨️', night: '🌨️' },        // Granos de nieve
      80: { day: '🌦️', night: '🌧️' },        // Chubascos ligeros
      81: { day: '🌧️', night: '🌧️' },        // Chubascos moderados
      82: { day: '⛈️', night: '⛈️' },         // Chubascos violentos
      85: { day: '🌨️', night: '🌨️' },        // Chubascos de nieve ligeros
      86: { day: '❄️', night: '❄️' },         // Chubascos de nieve intensos
      95: { day: '⛈️', night: '⛈️' },         // Tormenta
      96: { day: '⛈️', night: '⛈️' },         // Tormenta con granizo ligero
      99: { day: '⛈️', night: '⛈️' }          // Tormenta con granizo intenso
    };

    const icons = iconMap[codigo];
    if (!icons) {
      console.warn('Código WMO desconocido:', codigo);
      return '🌡️';
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