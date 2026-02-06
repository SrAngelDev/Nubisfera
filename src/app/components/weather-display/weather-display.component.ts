import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../../services/weather.service';
import { WeatherIconService } from '../../services/weather-icon.service';
import { Municipio } from '../../models/municipio.model';
import { WeatherData, DailyForecast, HourlyForecast, WMO_WEATHER_CODES } from '../../models/weather.model';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { WeatherChartsComponent } from '../weather-charts/weather-charts.component';
import { AnimatedWeatherIconComponent } from '../animated-weather-icon/animated-weather-icon.component';
import { SparklineComponent } from '../sparkline/sparkline.component';
import { CircularGaugeComponent } from '../circular-gauge/circular-gauge.component';

@Component({
  selector: 'app-weather-display',
  standalone: true,
  imports: [
    CommonModule, 
    WeatherChartsComponent,
    AnimatedWeatherIconComponent,
    SparklineComponent,
    CircularGaugeComponent
  ],
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

  private _todayCache?: { date: string; tomorrow: string };
  
  getDayName(date: Date): string {
    // Cachear los valores de hoy y mañana para evitar cambios en cada ciclo de detección
    const todayKey = new Date().toDateString();
    
    if (!this._todayCache || this._todayCache.date !== todayKey) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      this._todayCache = {
        date: today.toDateString(),
        tomorrow: tomorrow.toDateString()
      };
    }
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    const dateStr = dateToCheck.toDateString();

    if (dateStr === this._todayCache.date) {
      return 'Hoy';
    }
    
    if (dateStr === this._todayCache.tomorrow) {
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

  getDiasConHoras(): { date: Date; horas: HourlyForecast[]; tempMax: number; tempMin: number }[] {
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
        
        // Calcular temperatura máxima y mínima del día
        const temperaturas = horasFiltradas.map(h => h.temperature);
        const tempMax = temperaturas.length > 0 ? Math.max(...temperaturas) : 0;
        const tempMin = temperaturas.length > 0 ? Math.min(...temperaturas) : 0;
        
        return {
          date: fecha,
          horas: horasFiltradas,
          tempMax,
          tempMin
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

  /**
   * Verificar si una hora es la hora actual
   */
  isCurrentHour(hora: Date): boolean {
    const ahora = new Date();
    return hora.getHours() === ahora.getHours() && 
           hora.getDate() === ahora.getDate() &&
           hora.getMonth() === ahora.getMonth() &&
           hora.getFullYear() === ahora.getFullYear();
  }

  /**
   * Mapear código WMO a tipo de icono animado
   */
  getAnimatedIconType(code: number, fecha?: Date): 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'partly-cloudy' {
    const isNight = fecha ? this.isNightTime(fecha) : false;

    // Despejado
    if (code === 0 || code === 1) return 'sunny';
    
    // Parcialmente nublado  
    if (code === 2) return 'partly-cloudy';
    
    // Nublado
    if (code === 3 || code === 45 || code === 48) return 'cloudy';
    
    // Lluvia
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
    
    // Tormenta
    if ([95, 96, 99].includes(code)) return 'stormy';
    
    // Nieve
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
    
    // Por defecto
    return 'partly-cloudy';
  }

  /**
   * Obtener datos de temperatura para sparkline
   */
  getTemperatureSparkline(dia: DailyForecast): number[] {
    if (!this.weatherData?.hourly) return [];
    
    // Obtener temperaturas del día específico
    const dateStr = dia.date.toISOString().split('T')[0];
    const horasDelDia = this.weatherData.hourly.filter(h => {
      const hourDateStr = h.time.toISOString().split('T')[0];
      return hourDateStr === dateStr;
    });

    return horasDelDia.map(h => h.temperature);
  }

  /**
   * Obtener color según temperatura
   */
  getTemperatureColor(temp: number): string {
    if (temp >= 30) return '#ff6b6b';
    if (temp >= 25) return '#ff9a76';
    if (temp >= 20) return '#ffd97d';
    if (temp >= 15) return '#2E4DEE';
    if (temp >= 10) return '#82b1ff';
    return '#a8d5ff';
  }

  /**
   * Verificar si es de noche
   */
  private isNightTime(date: Date): boolean {
    const hour = date.getHours();
    return hour < 7 || hour >= 21;
  }

  formatHora(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  retryLoad() {
    this.cargarPrediccion();
  }
}
