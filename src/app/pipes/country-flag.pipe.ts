import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe optimizado para convertir códigos de país (ISO 3166-1 alpha-2) en emojis de banderas.
 * Al ser un Pipe puro, solo se recalcula cuando el input cambia, 
 * evitando miles de ejecuciones innecesarias durante los ciclos de detección de cambios.
 * 
 * @example
 * {{ 'ES' | countryFlag }} // 🇪🇸
 * {{ 'US' | countryFlag }} // 🇺🇸
 * {{ 'FR' | countryFlag }} // 🇫🇷
 */
@Pipe({
  name: 'countryFlag',
  standalone: true,
  pure: true // Optimización: solo se recalcula si el input cambia
})
export class CountryFlagPipe implements PipeTransform {
  transform(countryCode: string): string {
    // Validación: si no hay código o no tiene 2 caracteres, retorna emoji genérico
    if (!countryCode || countryCode.length !== 2) {
      return '🌍';
    }
    
    // Conversión de código ISO a emoji de bandera
    // Los emojis de banderas son combinaciones de "Regional Indicator Symbols"
    // que van del código Unicode U+1F1E6 (A) al U+1F1FF (Z)
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0)); // 127397 = 0x1F1E6 - 65 (código A)
    
    return String.fromCodePoint(...codePoints);
  }
}
