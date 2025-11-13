import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../../services/weather.service';
import { WeatherIconService } from '../../services/weather-icon.service';
import { Municipio } from '../../models/municipio.model';
import { WeatherData, DailyForecast, HourlyForecast, WMO_WEATHER_CODES } from '../../models/weather.model';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-weather-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-display.component.html',
  styleUrls: ['./weather-display.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('50ms', [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'none' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class WeatherDisplayComponent implements OnChanges {
  @Input() municipio!: Municipio;
  @Input() tipoPrecision: 'diaria' | 'horaria' = 'diaria';

  weatherData: WeatherData | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private weatherService: WeatherService,
    private weatherIconService: WeatherIconService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['municipio'] && this.municipio) {
      this.cargarPrediccion();
    }
  }

  private cargarPrediccion() {
    if (!this.municipio) return;

    this.isLoading = true;
    this.error = null;
    this.weatherData = null;

    this.weatherService.getWeatherForecast(this.municipio).subscribe({
      next: (data) => {
        this.weatherData = data;
        this.isLoading = false;
        console.log('Datos del tiempo cargados:', data);
      },
      error: (err) => {
        console.error('Error cargando datos del tiempo:', err);
        this.error = 'No se pudo cargar la predicción. Intenta con otro municipio.';
        this.isLoading = false;
      }
    });
  }

  getWeatherIcon(code: number, fecha?: Date): string {
    return this.weatherIconService.getWeatherIcon(code, fecha);
  }

  getWeatherDescription(code: number): string {
    return this.weatherIconService.getWeatherDescription(code);
  }

  formatDate(date: Date, format: 'd MMM' | 'EEEE d'): string {
    if (format === 'd MMM') {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
  }

  getDayName(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    if (dateToCheck.getTime() === today.getTime()) {
      return 'Hoy';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (dateToCheck.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    }

    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return today.toDateString() === date.toDateString();
  }

  getDiasFuturos(): DailyForecast[] {
    if (!this.weatherData?.daily) return [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.weatherData.daily.filter(dia => {
      const fechaDia = new Date(dia.date);
      fechaDia.setHours(0, 0, 0, 0);
      return fechaDia >= hoy;
    });
  }

  getHorasHoy(): HourlyForecast[] {
    if (!this.weatherData?.hourly) return [];
    
    const ahora = new Date();
    
    return this.weatherData.hourly.filter(hora => {
      return hora.time >= ahora;
    }).slice(0, 24); // Próximas 24 horas
  }

  getHorasPorDia(): { [key: string]: HourlyForecast[] } {
    if (!this.weatherData?.hourly) return {};
    
    const horasPorDia: { [key: string]: HourlyForecast[] } = {};
    
    this.weatherData.hourly.forEach(hora => {
      const dateKey = hora.time.toDateString();
      if (!horasPorDia[dateKey]) {
        horasPorDia[dateKey] = [];
      }
      horasPorDia[dateKey].push(hora);
    });
    
    return horasPorDia;
  }

  getDiasConHoras(): { date: Date; horas: HourlyForecast[] }[] {
    const horasPorDia = this.getHorasPorDia();
    const ahora = new Date();
    const hoyInicio = new Date(ahora);
    hoyInicio.setHours(0, 0, 0, 0);
    
    return Object.entries(horasPorDia)
      .map(([dateStr, horas]) => {
        const fecha = new Date(dateStr);
        const esHoy = fecha.toDateString() === ahora.toDateString();
        
        // Si es hoy, filtrar solo las horas >= hora actual
        const horasFiltradas = esHoy 
          ? horas.filter(hora => hora.time >= ahora)
          : horas;
        
        return {
          date: fecha,
          horas: horasFiltradas
        };
      })
      .filter(item => {
        const fecha = new Date(item.date);
        fecha.setHours(0, 0, 0, 0);
        // Solo incluir días futuros o hoy (y que tengan horas después del filtrado)
        return fecha >= hoyInicio && item.horas.length > 0;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  formatHora(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  retryLoad() {
    this.cargarPrediccion();
  }
}
