import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MobileWeatherComponent } from './mobile-weather.component';
import { WeatherService } from '../../services/weather.service';
import { ThemeService } from '../../services/theme.service';
import { MobilePlacesService, validPlace } from '../../services/mobile-places.service';
import { Municipio } from '../../models/municipio.model';
import { WeatherData } from '../../models/weather.model';

const madrid: Municipio = { id: 'madrid', nombre: 'Madrid', provincia: 'Madrid', latitud_dec: '40.4', longitud_dec: '-3.7' };
const tokyo: Municipio = { id: 'tokyo', nombre: 'Tokio', latitud_dec: '35.7', longitud_dec: '139.7' };
function forecast(place = madrid): WeatherData {
  const start = new Date(); start.setMinutes(0, 0, 0);
  return { municipio: place, latitude: 40, longitude: -3, elevation: 600, timezone: 'Europe/Madrid',
    current: { time: new Date(), temperature: 21, apparentTemperature: 20, humidity: 60, weatherCode: 0, windSpeed: 12, windDirection: 90 },
    hourly: Array.from({ length: 24 }, (_, i) => ({ time: new Date(start.getTime() + i * 3600000), temperature: 21, apparentTemperature: 20, humidity: 60, precipitationProbability: i === 3 ? 70 : 10, precipitation: 0, weatherCode: 0, windSpeed: 12, windDirection: 90 })),
    daily: Array.from({ length: 10 }, (_, i) => ({ date: new Date(start.getTime() + i * 86400000), weatherCode: 0, temperatureMax: 24, temperatureMin: 14, apparentTemperatureMax: 24, apparentTemperatureMin: 14, sunrise: new Date(), sunset: new Date(), precipitationSum: 0, precipitationProbabilityMax: 10, windSpeedMax: 15, windDirectionDominant: 90 })) };
}
function clearMobileStorage(): void {
  for (const key of ['last', 'recent', 'favorites', 'weather']) localStorage.removeItem('nubisfera-mobile-' + key);
}

describe('Mobile weather consultation', () => {
  let weather: jasmine.SpyObj<WeatherService>;
  beforeEach(async () => {
    clearMobileStorage();
    weather = jasmine.createSpyObj('WeatherService', ['getWeatherForecast', 'searchMunicipios']);
    weather.getWeatherForecast.and.returnValue(of(forecast()));
    weather.searchMunicipios.and.returnValue(of([madrid]));
    await TestBed.configureTestingModule({ imports: [MobileWeatherComponent], providers: [provideRouter([]),
      { provide: WeatherService, useValue: weather },
      { provide: ThemeService, useValue: { mode: signal('auto'), setMode: jasmine.createSpy('setMode') } }]
    }).compileComponents();
  });
  afterEach(() => clearMobileStorage());

  it('starts with explicit search and never asks for location on entry', () => {
    const locate = spyOn(navigator.geolocation, 'getCurrentPosition');
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Buscar una ciudad');
    expect(locate).not.toHaveBeenCalled(); fixture.destroy();
  });

  it('shows compact days, expands the forecast and persists real Date values', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    const component = fixture.componentInstance; component.load(madrid); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.condition').textContent).toContain('Despejado');
    expect(fixture.nativeElement.querySelectorAll('.day-row').length).toBe(7);
    component.expanded.set(true); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.day-row').length).toBe(10);
    const places = TestBed.inject(MobilePlacesService), cache = places.cachedWeather();
    expect(cache?.data.hourly[0].time instanceof Date).toBeTrue();
    expect(cache?.data.daily[0].sunrise instanceof Date).toBeTrue();
    expect(places.last()?.id).toBe('madrid'); fixture.destroy();
  });

  it('retains weather when search is cancelled or refresh fails', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    const component = fixture.componentInstance; component.load(madrid);
    component.openSearch(); component.closeSearch();
    expect(component.data()?.municipio.id).toBe('madrid');
    weather.getWeatherForecast.and.returnValue(throwError(() => new Error('offline')));
    component.refresh(); fixture.detectChanges();
    expect(component.data()?.current.temperature).toBe(21);
    expect(component.stale()).toBeTrue(); expect(component.error()).toContain('Conservamos');
    fixture.destroy();
  });

  it('retries the requested place after the first request fails', () => {
    weather.getWeatherForecast.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid);
    weather.getWeatherForecast.and.returnValue(of(forecast())); fixture.componentInstance.refresh();
    expect(fixture.componentInstance.data()?.municipio.id).toBe('madrid'); fixture.destroy();
  });

  it('ignores responses from an earlier selected city', () => {
    const first = new Subject<WeatherData>(), second = new Subject<WeatherData>();
    weather.getWeatherForecast.and.returnValues(first, second);
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid); fixture.componentInstance.load(tokyo);
    second.next(forecast(tokyo)); first.next(forecast(madrid));
    expect(fixture.componentInstance.data()?.municipio.id).toBe('tokyo'); fixture.destroy();
  });

  it('cancels pending results immediately when the query is cleared', fakeAsync(() => {
    const response = new Subject<Municipio[]>(); weather.searchMunicipios.and.returnValue(response);
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    const component = fixture.componentInstance; component.query = 'Madrid'; component.search(); tick(300);
    component.query = ''; component.search(); response.next([madrid]);
    expect(component.results()).toEqual([]); expect(component.searching()).toBeFalse(); fixture.destroy();
  }));

  it('debounces typing and requires explicit selection of a city', fakeAsync(() => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    const component = fixture.componentInstance;
    component.query = 'Ma'; component.search(); tick(150);
    component.query = 'Madrid'; component.search(); tick(299);
    expect(weather.searchMunicipios).not.toHaveBeenCalled(); tick(1);
    expect(weather.searchMunicipios).toHaveBeenCalledOnceWith('Madrid', 12, true);
    expect(component.results().length).toBe(1); expect(component.data()).toBeNull(); fixture.destroy();
  }));

  it('explains denied geolocation and preserves manual search', () => {
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((_success, error) => {
      error?.({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' });
    });
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.locate();
    expect(fixture.componentInstance.notice()).toContain('denegado');
    expect(fixture.componentInstance.locating()).toBeFalse(); fixture.destroy();
  });

  it('uses the selected locality timezone', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    const data = forecast(tokyo); data.timezone = 'Asia/Tokyo'; fixture.componentInstance.data.set(data);
    expect(fixture.componentInstance.time(new Date('2026-11-09T00:00:00Z'))).toBe('09:00'); fixture.destroy();
  });

  it('restores cached weather offline without requesting the network', () => {
    const places = TestBed.inject(MobilePlacesService); places.remember(madrid); places.saveWeather(forecast());
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    expect(fixture.componentInstance.data()?.municipio.id).toBe('madrid');
    expect(fixture.nativeElement.textContent).toContain('Sin conexión · datos guardados');
    expect(weather.getWeatherForecast).not.toHaveBeenCalled(); fixture.destroy();
  });

  it('distinguishes network search errors from a successful empty result', fakeAsync(() => {
    weather.searchMunicipios.and.returnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.query = 'Madrid'; fixture.componentInstance.search(); tick(300);
    expect(fixture.componentInstance.searchError()).toBeTrue();
    expect(fixture.componentInstance.searching()).toBeFalse(); fixture.destroy();
  }));

  it('opens daily detail and closes it with Escape without losing weather', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid); fixture.detectChanges();
    (fixture.nativeElement.querySelector('.day-row') as HTMLButtonElement).click(); fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('.day-panel') as HTMLElement;
    expect(dialog.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.day-panel')).toBeNull();
    expect(fixture.componentInstance.data()?.municipio.id).toBe('madrid'); fixture.destroy();
  });

  it('fits the primary column at 320, 375, 414 and 768 pixels', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement; document.body.appendChild(host);
    for (const width of [320, 375, 414, 768]) {
      host.style.width = width + 'px';
      const page = host.querySelector('.mobile-page') as HTMLElement;
      expect(page.scrollWidth).withContext('primary width ' + width).toBeLessThanOrEqual(page.clientWidth + 1);
    }
    fixture.destroy(); host.remove();
  });

  it('fits every primary view and dialog in real iframe viewports, in both themes', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid); fixture.detectChanges();
    const frame = document.createElement('iframe'); frame.style.height = '900px'; document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    for (const style of document.querySelectorAll('style, link[rel="stylesheet"]')) doc.head.appendChild(style.cloneNode(true));
    for (const theme of ['', 'light-mode']) {
      doc.documentElement.className = theme;
      for (const width of [320, 375, 414, 768]) {
        frame.style.width = width + 'px';
        for (const view of ['weather', 'places', 'more'] as const) {
          fixture.componentInstance.view.set(view); fixture.detectChanges();
          doc.body.replaceChildren(fixture.nativeElement.cloneNode(true));
          expect(doc.documentElement.scrollWidth).withContext(`${theme} ${view} ${width}`).toBeLessThanOrEqual(width);
          const buttons = doc.querySelectorAll<HTMLElement>('.primary-button, .secondary-button, .theme-options button, .install-button');
          for (const button of buttons) expect(button.scrollWidth).withContext(button.textContent || '').toBeLessThanOrEqual(button.clientWidth + 1);
        }
        fixture.componentInstance.searchOpen.set(true); fixture.detectChanges();
        doc.body.replaceChildren(fixture.nativeElement.cloneNode(true));
        const panel = doc.querySelector<HTMLElement>('.search-panel')!;
        expect(panel.scrollWidth).withContext(`search ${width}`).toBeLessThanOrEqual(panel.clientWidth + 1);
        fixture.componentInstance.searchOpen.set(false);
        fixture.componentInstance.selectedDay.set(forecast().daily[0]); fixture.detectChanges();
        doc.body.replaceChildren(fixture.nativeElement.cloneNode(true));
        const detail = doc.querySelector<HTMLElement>('.day-panel')!;
        expect(detail.scrollWidth).withContext(`detail ${width}`).toBeLessThanOrEqual(detail.clientWidth + 1);
        fixture.componentInstance.selectedDay.set(null);
      }
    }
    frame.remove(); fixture.destroy();
  });

  it('keeps enlarged text inside the weather column at mobile widths', () => {
    const fixture = TestBed.createComponent(MobileWeatherComponent); fixture.detectChanges();
    fixture.componentInstance.load(madrid); fixture.detectChanges();
    const frame = document.createElement('iframe'); frame.style.height = '900px'; document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    for (const style of document.querySelectorAll('style, link[rel="stylesheet"]')) doc.head.appendChild(style.cloneNode(true));
    doc.documentElement.style.fontSize = '200%';
    for (const width of [320, 375, 414, 768]) {
      frame.style.width = width + 'px';
      for (const view of ['weather', 'places', 'more'] as const) {
        fixture.componentInstance.view.set(view); fixture.detectChanges();
        doc.body.replaceChildren(fixture.nativeElement.cloneNode(true));
        const page = doc.querySelector<HTMLElement>('.mobile-page')!;
        expect(page.scrollWidth).withContext(`200% text ${view} ${width}`).toBeLessThanOrEqual(page.clientWidth + 1);
      }
    }
    frame.remove(); fixture.destroy();
  });
});

describe('Mobile places persistence', () => {
  beforeEach(() => clearMobileStorage()); afterEach(() => clearMobileStorage());
  it('validates coordinates and ignores malformed storage', () => {
    expect(validPlace({ ...madrid, latitud_dec: 'invalid' })).toBeFalse();
    expect(validPlace({ ...madrid, latitud_dec: '' })).toBeFalse();
    localStorage.setItem('nubisfera-mobile-last', '{broken');
    const places = new MobilePlacesService(); expect(places.last()).toBeNull(); expect(places.cachedWeather()).toBeNull();
  });
  it('deduplicates recents and persists removal of favorites', () => {
    const places = new MobilePlacesService(); places.remember(madrid); places.remember(tokyo); places.remember(madrid);
    expect(places.recent().map(p => p.id)).toEqual(['madrid', 'tokyo']);
    places.toggleFavorite(madrid); expect(new MobilePlacesService().isFavorite(madrid)).toBeTrue();
    places.toggleFavorite(madrid); expect(new MobilePlacesService().isFavorite(madrid)).toBeFalse();
  });
});
