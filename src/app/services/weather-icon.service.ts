import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherIconService {

  private readonly iconos: { [key: string]: string } = {
    '11': '☀️', '11n': '🌙',   // Despejado
    '12': '🌤️', '12n': '🌙☁️', // Poco nuboso
    '13': '⛅', '13n': '🌙☁️',   // Intervalos nubosos
    '14': '☁️', '14n': '☁️',   // Nuboso
    '15': '☁️', '15n': '☁️',   // Muy nuboso
    '16': '☁️', '16n': '☁️',   // Cubierto
    '17': '🌦️', '17n': '🌦️', // Nubes altas
    '23': '🌧️', '23n': '🌧️', // Lluvia
    '24': '🌧️', '24n': '🌧️', // Lluvia
    '25': '⛈️', '25n': '⛈️',   // Tormenta
    '26': '⛈️', '26n': '⛈️',   // Tormenta con lluvia
    '27': '❄️', '27n': '❄️',   // Nieve
    '33': '🌧️☀️', '33n': '🌧️🌙', // Intervalos nubosos con lluvia
    '34': '🌧️☁️', '34n': '🌧️☁️', // Nuboso con lluvia
    '43': '😶‍🌫️', '43n': '😶‍🌫️', // Bruma
    '44': '🌁', '44n': '🌁', // Niebla baja
    '45': '🌁', '45n': '🌁', // Niebla
    '46': '🌁❄️', '46n': '🌁❄️', // Niebla depositando escarcha
    '51': '🌧️', '51n': '🌧️', // Lluvia débil
    '52': '🌧️', '52n': '🌧️', // Lluvia moderada
    '53': '🌧️', '53n': '🌧️', // Lluvia fuerte
    '54': '🌧️', '54n': '🌧️', // Lluvia muy fuerte
    '61': '⛈️', '61n': '⛈️',   // Tormenta
    '62': '⛈️', '62n': '⛈️',   // Tormenta fuerte
    '63': '❄️', '63n': '❄️',   // Nieve débil
    '64': '❄️', '64n': '❄️',   // Nieve moderada
    '65': '❄️', '65n': '❄️',   // Nieve fuerte
    '71': '🌁', '71n': '🌁', // Niebla
    '81': '🌦️', '81n': '🌦️', // Chubascos débiles
    '82': '🌧️', '82n': '🌧️', // Chubascos moderados
    '83': '🌧️', '83n': '🌧️', // Chubascos fuertes
    'default': '🌡️'
  };

  constructor() { }

  getWeatherIcon(codigo: string): string {
    if (!codigo || codigo === '' || codigo === 'undefined') {
      console.warn('Código de estado del cielo vacío o inválido:', codigo);
      return this.iconos['default'];
    }
    // Convertir a string y limpiar cualquier tipo extraño
    const codigoStr = String(codigo).trim();
    return this.iconos[codigoStr] || this.iconos['default'];
  }

  getWeatherDescription(codigo: string): string {
    if (!codigo || codigo === '' || codigo === 'undefined') {
      return 'Información no disponible';
    }
    
    // Convertir a string y limpiar cualquier tipo extraño (BigInt, etc)
    const codigoStr = String(codigo).trim();
    // Eliminar sufijo 'n' (noche) para obtener descripción base
    const codigoBase = codigoStr.replace(/n$/, '');
    
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
      '33': 'Intervalos nubosos con lluvia',
      '34': 'Nuboso con lluvia',
      '43': 'Bruma',
      '44': 'Niebla baja',
      '45': 'Niebla',
      '46': 'Niebla con escarcha',
      '51': 'Lluvia débil',
      '52': 'Lluvia moderada',
      '53': 'Lluvia fuerte',
      '54': 'Lluvia muy fuerte',
      '61': 'Tormenta',
      '62': 'Tormenta fuerte',
      '63': 'Nieve débil',
      '64': 'Nieve moderada',
      '65': 'Nieve fuerte',
      '71': 'Niebla',
      '81': 'Chubascos débiles',
      '82': 'Chubascos moderados',
      '83': 'Chubascos fuertes'
    };
    
    const description = descriptions[codigoBase];
    if (!description) {
      console.warn('Código de estado del cielo desconocido:', codigoStr, '(base:', codigoBase + ')');
      return 'Información no disponible';
    }
    return description;
  }
}