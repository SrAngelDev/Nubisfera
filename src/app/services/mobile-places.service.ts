import { Injectable, signal } from '@angular/core';
import { Municipio } from '../models/municipio.model';
import { WeatherData } from '../models/weather.model';

export function validPlace(value: unknown): value is Municipio {
  if (!value || typeof value !== 'object') return false;
  const p = value as Municipio;
  return typeof p.id === 'string' && typeof p.nombre === 'string' && !!p.nombre &&
    typeof p.latitud_dec === 'string' && p.latitud_dec.trim() !== '' &&
    typeof p.longitud_dec === 'string' && p.longitud_dec.trim() !== '' &&
    Number.isFinite(Number(p.latitud_dec)) && Math.abs(Number(p.latitud_dec)) <= 90 &&
    Number.isFinite(Number(p.longitud_dec)) && Math.abs(Number(p.longitud_dec)) <= 180;
}

@Injectable({ providedIn: 'root' })
export class MobilePlacesService {
  readonly favorites = signal<Municipio[]>(this.readPlaces('favorites'));
  readonly recent = signal<Municipio[]>(this.readPlaces('recent'));

  private read(key: string): unknown {
    try { return JSON.parse(localStorage.getItem('nubisfera-mobile-' + key) || 'null'); }
    catch { return null; }
  }
  private write(key: string, value: unknown): void {
    try { localStorage.setItem('nubisfera-mobile-' + key, JSON.stringify(value)); }
    catch { /* Storage can be unavailable or full; consultation still works. */ }
  }
  private readPlaces(key: string): Municipio[] {
    const value = this.read(key);
    return Array.isArray(value) ? value.filter(validPlace).slice(0, 20) : [];
  }
  last(): Municipio | null {
    const value = this.read('last');
    return validPlace(value) ? value : null;
  }
  remember(place: Municipio): void {
    this.write('last', place);
    this.recent.update(list => [place, ...list.filter(p => p.id !== place.id)].slice(0, 8));
    this.write('recent', this.recent());
  }
  isFavorite(place: Municipio): boolean { return this.favorites().some(p => p.id === place.id); }
  toggleFavorite(place: Municipio): void {
    this.favorites.update(list => this.isFavorite(place) ? list.filter(p => p.id !== place.id) : [...list, place]);
    this.write('favorites', this.favorites());
  }
  saveWeather(data: WeatherData): void { this.write('weather', { savedAt: Date.now(), data }); }
  cachedWeather(): { data: WeatherData; savedAt: number } | null {
    try {
      const value = this.read('weather') as { data: WeatherData; savedAt: number } | null;
      if (!value || !Number.isFinite(value.savedAt) || !validPlace(value.data?.municipio) ||
          !value.data.current || !Array.isArray(value.data.hourly) || !Array.isArray(value.data.daily) ||
          value.data.daily.length === 0 || !Number.isFinite(value.data.current.temperature)) return null;
      const data = value.data;
      new Intl.DateTimeFormat('es', { timeZone: data.timezone });
      data.current.time = new Date(data.current.time);
      data.hourly = data.hourly.map(h => ({ ...h, time: new Date(h.time) }));
      data.daily = data.daily.map(d => ({ ...d, date: new Date(d.date), sunrise: new Date(d.sunrise), sunset: new Date(d.sunset) }));
      if (![data.current.time, ...data.hourly.map(h => h.time), ...data.daily.flatMap(d => [d.date, d.sunrise, d.sunset])]
        .every(d => Number.isFinite(d.getTime()))) return null;
      return { data, savedAt: value.savedAt };
    } catch { return null; }
  }
}
