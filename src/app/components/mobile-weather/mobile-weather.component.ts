import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, takeUntil, timeout } from 'rxjs/operators';
import { WeatherService } from '../../services/weather.service';
import { MobilePlacesService, validPlace } from '../../services/mobile-places.service';
import { ThemeService } from '../../services/theme.service';
import { Municipio } from '../../models/municipio.model';
import { DailyForecast, HourlyForecast, WeatherData, WMO_WEATHER_CODES } from '../../models/weather.model';
import { MobileIconComponent } from './mobile-icon.component';
import { PwaInstallComponent } from './pwa-install.component';

@Component({
  selector: 'app-mobile-weather', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MobileIconComponent, PwaInstallComponent],
  templateUrl: './mobile-weather.component.html', styleUrl: './mobile-weather.component.css'
})
export class MobileWeatherComponent implements OnInit, OnDestroy {
  readonly places = inject(MobilePlacesService);
  readonly theme = inject(ThemeService);
  private weather = inject(WeatherService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyed$ = new Subject<void>();
  private requests$ = new Subject<Municipio>();
  private queries$ = new Subject<string>();
  readonly view = signal<'weather' | 'places' | 'more'>('weather');
  readonly data = signal<WeatherData | null>(null);
  readonly loading = signal(false);
  readonly locating = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly offline = signal(!navigator.onLine);
  readonly savedAt = signal<number | null>(null);
  readonly stale = signal(false);
  readonly searching = signal(false);
  readonly searchError = signal(false);
  readonly results = signal<Municipio[]>([]);
  readonly searchOpen = signal(false);
  readonly selectedDay = signal<DailyForecast | null>(null);
  readonly expanded = signal(false);
  query = '';
  private dead = false;
  private clock = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;
  private searchTrigger?: HTMLElement;
  private dayTrigger?: HTMLElement;
  private requestedPlace: Municipio | null = null;

  private onlineHandler = () => {
    this.offline.set(false);
    const place = this.data()?.municipio || this.places.last();
    if (place) this.load(place);
  };
  private offlineHandler = () => { this.offline.set(true); this.stale.set(true); };

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroyed$)).subscribe(params => {
      const view = params.get('view');
      this.view.set(view === 'places' || view === 'more' ? view : 'weather');
      this.searchOpen.set(false); this.selectedDay.set(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    this.requests$.pipe(
      switchMap(place => this.weather.getWeatherForecast(place, true).pipe(
        timeout(20000),
        map(data => ({ data, place })),
        catchError(() => of({ data: null, place }))
      )), takeUntil(this.destroyed$)
    ).subscribe(result => {
      this.loading.set(false);
      if (!result.data || result.data.daily.length === 0 || !Number.isFinite(result.data.current.temperature)) {
        this.error.set(this.data() ? 'Actualización fallida. Conservamos la última consulta.' : 'No hemos podido cargar el tiempo. Puedes reintentar o buscar otro lugar.');
        this.stale.set(true);
        return;
      }
      this.selectedDay.set(null);
      this.data.set(result.data);
      this.savedAt.set(Date.now()); this.stale.set(false); this.error.set('');
      this.places.remember(result.place); this.places.saveWeather(result.data);
    });
    this.queries$.pipe(
      // Emit every change before debouncing to cancel obsolete in-flight searches immediately.
      distinctUntilChanged(),
      switchMap(query => query.length < 2 ? of({ results: [] as Municipio[], failed: false }) :
        timer(300).pipe(switchMap(() => this.weather.searchMunicipios(query, 12, true).pipe(
          timeout(12000), map(results => ({ results, failed: false })),
          catchError(() => of({ results: [] as Municipio[], failed: true }))
        )))), takeUntil(this.destroyed$)
    ).subscribe(result => {
      this.results.set(result.results.filter(validPlace)); this.searchError.set(result.failed); this.searching.set(false);
    });
    const cached = this.places.cachedWeather();
    if (cached) { this.data.set(cached.data); this.savedAt.set(cached.savedAt); this.stale.set(true); }
    const place = this.places.last() || cached?.data.municipio;
    if (place && navigator.onLine) this.load(place);
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.timer = setInterval(() => {
      this.clock.set(Date.now());
      if (this.savedAt() && Date.now() - this.savedAt()! > 30 * 60 * 1000) this.stale.set(true);
    }, 60000);
  }

  ngOnDestroy(): void {
    this.dead = true;
    this.destroyed$.next(); this.destroyed$.complete();
    if (this.timer) clearInterval(this.timer);
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  load(place: Municipio): void {
    this.requestedPlace = place;
    this.loading.set(true); this.error.set(''); this.notice.set(''); this.selectedDay.set(null);
    this.requests$.next(place);
  }
  choose(place: Municipio): void {
    this.closeSearch(); this.expanded.set(false);
    void this.router.navigate(['/']);
    this.load(place);
  }
  refresh(): void {
    const place = this.requestedPlace || this.data()?.municipio || this.places.last();
    if (place) this.load(place);
  }
  openSearch(event?: Event): void {
    this.searchTrigger = event?.currentTarget as HTMLElement;
    this.searchOpen.set(true); this.query = ''; this.results.set([]); this.notice.set('');
    this.searchError.set(false); this.queries$.next('');
    setTimeout(() => document.getElementById('mobile-city-search')?.focus());
  }
  closeSearch(): void {
    this.searchOpen.set(false); this.queries$.next(''); this.searching.set(false);
    this.searchTrigger?.focus();
  }
  search(): void {
    this.results.set([]); this.searchError.set(false);
    this.searching.set(this.query.trim().length >= 2);
    this.queries$.next(this.query.trim());
  }
  openDay(day: DailyForecast, event: Event): void {
    this.dayTrigger = event.currentTarget as HTMLElement;
    this.selectedDay.set(day);
    setTimeout(() => document.getElementById('close-day')?.focus());
  }
  closeDay(): void { this.selectedDay.set(null); this.dayTrigger?.focus(); }
  trapFocus(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.searchOpen()) this.closeSearch(); else this.closeDay();
      event.preventDefault(); return;
    }
    if (event.key !== 'Tab') return;
    const nodes = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href], [tabindex="0"]'));
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  locate(): void {
    if (!navigator.geolocation) { this.notice.set('La ubicación no está disponible. Busca tu ciudad por su nombre.'); return; }
    this.locating.set(true); this.notice.set('');
    navigator.geolocation.getCurrentPosition(position => {
      if (this.dead) return;
      this.locating.set(false);
      // Forecast directly at the permitted coordinates: no unsupported reverse-geocoding request.
      const lat = position.coords.latitude.toFixed(4), lon = position.coords.longitude.toFixed(4);
      this.choose({ id: `location-${lat}-${lon}`, nombre: 'Mi ubicación', provincia: `${lat}, ${lon}`, latitud_dec: lat, longitud_dec: lon });
    }, error => {
      if (this.dead) return;
      this.locating.set(false);
      this.notice.set(error.code === error.PERMISSION_DENIED ? 'Permiso de ubicación denegado. Puedes buscar tu ciudad manualmente.' : 'No hemos podido localizarte. Busca tu ciudad manualmente.');
    }, { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false });
  }
  get hours(): HourlyForecast[] {
    const now = this.clock();
    return (this.data()?.hourly || []).filter(h => h.time.getTime() >= now - 30 * 60000).slice(0, 24);
  }
  get days(): DailyForecast[] { return (this.data()?.daily || []).slice(0, this.expanded() ? 16 : 7); }
  get today(): DailyForecast | undefined { return this.data()?.daily[0]; }
  get summary(): string {
    const hours = this.hours.slice(0, 12);
    if (!hours.length) return 'Consulta la previsión de los próximos días.';
    const rain = hours.find(h => h.precipitationProbability >= 50);
    if (rain) return `Posibilidad de lluvia hacia las ${this.time(rain.time)} (${Math.round(rain.precipitationProbability)}%).`;
    if (hours.every(h => h.precipitationProbability < 20)) return 'Baja probabilidad de lluvia en las próximas 12 horas.';
    return 'Lluvia poco probable. Consulta cómo evoluciona por horas.';
  }
  description(code: number): string { return WMO_WEATHER_CODES[code]?.description || 'Estado no disponible'; }
  icon(code: number, isDay = 1): string {
    if (code === 0) return isDay ? 'sun' : 'moon';
    if (code <= 3) return 'cloud';
    if (code <= 48) return 'fog';
    if (code >= 95) return 'storm';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    return 'rain';
  }
  time(date: Date): string { return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: this.data()?.timezone || 'UTC' }).format(date); }
  dateKey(date: Date): string { return new Intl.DateTimeFormat('en-CA', { timeZone: this.data()?.timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
  dayLabel(day: DailyForecast, index?: number): string {
    if (this.dateKey(day.date) === this.dateKey(new Date(this.clock()))) return 'Hoy';
    if (this.dateKey(day.date) === this.dateKey(new Date(this.clock() + 86400000))) return 'Mañana';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', timeZone: this.data()?.timezone || 'UTC' }).format(day.date);
  }
  dayTitle(day: DailyForecast): string { return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: this.data()?.timezone || 'UTC' }).format(day.date); }
  hoursFor(day: DailyForecast): HourlyForecast[] { return (this.data()?.hourly || []).filter(h => this.dateKey(h.time) === this.dateKey(day.date)); }
  rangeStart(day: DailyForecast): number {
    const all = this.data()?.daily || [day];
    const min = Math.min(...all.map(d => d.temperatureMin)), max = Math.max(...all.map(d => d.temperatureMax));
    return (day.temperatureMin - min) / Math.max(1, max - min) * 100;
  }
  rangeWidth(day: DailyForecast): number {
    const all = this.data()?.daily || [day];
    return Math.max(5, (day.temperatureMax - day.temperatureMin) / Math.max(1, Math.max(...all.map(d => d.temperatureMax)) - Math.min(...all.map(d => d.temperatureMin))) * 100);
  }
  get recent(): Municipio[] { return this.places.recent().filter(p => !this.places.isFavorite(p)); }
  validPlace = validPlace;
}
