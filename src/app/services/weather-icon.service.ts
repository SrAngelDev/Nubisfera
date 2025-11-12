import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherIconService {

  private readonly iconos: { [key: string]: string } = {
    '11': '☀️', '11n': '🌙',   // Despejado
    '12': '🌤️', '12n': '🌤️', // Poco nuboso
    '13': '⛅', '13n': '⛅',   // Intervalos nubosos
    '14': '☁️', '14n': '☁️',   // Nuboso
    '15': '☁️', '15n': '☁️',   // Muy nuboso
    '16': '☁️', '16n': '☁️',   // Cubierto
    '17': '🌦️', '17n': '🌦️', // Nubes altas
    '23': '🌧️', '23n': '🌧️', // Lluvia
    '24': '🌧️', '24n': '🌧️', // Lluvia
    '25': '⛈️', '25n': '⛈️',   // Tormenta
    '26': '⛈️', '26n': '⛈️',   // Tormenta con lluvia
    '27': '❄️', '27n': '❄️',   // Nieve
    '51': '🌧️', '51n': '🌧️', // Lluvia débil
    '52': '🌧️', '52n': '🌧️', // Lluvia moderada
    '53': '🌧️', '53n': '🌧️', // Lluvia fuerte
    '61': '⛈️', '61n': '⛈️',   // Tormenta
    '62': '⛈️', '62n': '⛈️',   // Tormenta fuerte
    '63': '❄️', '63n': '❄️',   // Nieve débil
    '64': '❄️', '64n': '❄️',   // Nieve moderada
    '65': '❄️', '65n': '❄️',   // Nieve fuerte
    '71': '🌫️', '71n': '🌫️', // Niebla
    'default': '🌡️'
  };

  constructor() { }

  getWeatherIcon(codigo: string): string {
    return this.iconos[codigo] || this.iconos['default'];
  }

  getWeatherDescription(codigo: string): string {
    const descriptions: { [key: string]: string } = {
      '11': 'Despejado',
      '12': 'Poco nuboso',
      '13': 'Intervalos nubosos',
      '14': 'Nuboso',
      '15': 'Muy nuboso',
      '16': 'Cubierto',
      '17': 'Nubes altas',
      '23': 'Lluvia',
      '24': 'Lluvia',
      '25': 'Tormenta',
      '26': 'Tormenta con lluvia',
      '27': 'Nieve',
      '51': 'Lluvia débil',
      '52': 'Lluvia moderada',
      '53': 'Lluvia fuerte',
      '61': 'Tormenta',
      '62': 'Tormenta fuerte',
      '63': 'Nieve débil',
      '64': 'Nieve moderada',
      '65': 'Nieve fuerte',
      '71': 'Niebla'
    };
    
    return descriptions[codigo] || 'Sin datos';
  }
}