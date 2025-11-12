import { Component, Input, OnChanges, SimpleChanges, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AemetService } from '../../services/aemet.service';
import { WeatherIconService } from '../../services/weather-icon.service';
import { Municipio } from '../../models/municipio.model';
import { PrediccionDiaria, Dia, Hora } from '../../models/prediccion.model';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// --- Pipe para renderizar HTML de forma segura ---
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

// --- Interfaz para datos horarios combinados ---
interface HoraCombinada {
  periodo: string;
  temperatura: string;
  estadoCielo: string;
  probPrecipitacion: number;
}

@Component({
  selector: 'app-weather-display',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
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

  prediccion: PrediccionDiaria | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private aemetService: AemetService,
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
    this.prediccion = null; // Resetea la predicción para que las animaciones se disparen

    // Siempre pedimos la predicción diaria, que es más completa
    this.aemetService.getPrediccionDiaria(this.municipio.id).subscribe({
      next: (prediccion) => {
        this.prediccion = prediccion;
        this.isLoading = false;
        console.log('Predicción completa cargada:', prediccion);
      },
      error: (error) => {
        console.error('Error cargando predicción:', error);
        this.error = 'No se pudo cargar la predicción. Intenta con otro municipio.';
        this.isLoading = false;
      }
    });
  }

  getWeatherIcon(codigo: string): string {
    return this.weatherIconService.getWeatherIcon(codigo);
  }

  getWeatherDescription(codigo: string): string {
    return this.weatherIconService.getWeatherDescription(codigo);
  }

  formatDate(fecha: string, format: 'd MMM' | 'EEEE d'): string {
    const date = new Date(fecha);
    if (format === 'd MMM') {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
  }

  getDayName(fecha: string): string {
    const date = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(fecha);
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

  isToday(fecha: string): boolean {
    const today = new Date();
    const date = new Date(fecha);
    return today.toDateString() === date.toDateString();
  }

  retryLoad() {
    this.cargarPrediccion();
  }

  // --- Nuevos Métodos para Predicción Horaria Combinada ---

  getHorasCombinadas(dia: Dia): HoraCombinada[] {
    const horas: HoraCombinada[] = [];

    // Asumimos que todos los arrays tienen la misma estructura de periodos
    if (!dia.estadoCielo || dia.estadoCielo.length === 0) {
      return [];
    }

    for (const estadoCieloHora of dia.estadoCielo) {
      const periodo = estadoCieloHora.periodo;
      if (parseInt(periodo) > new Date().getHours() || !this.isToday(dia.fecha)) {
        horas.push({
          periodo: periodo,
          estadoCielo: estadoCieloHora.value,
          temperatura: this.findMatchingValue(dia.temperatura.dato, periodo),
          probPrecipitacion: parseInt(this.findMatchingValue(dia.probPrecipitacion, periodo)) || 0
        });
      }
    }
    return horas;
  }

  private findMatchingValue(array: Hora[] | undefined, periodo: string): string {
    if (!array) return '--';
    const match = array.find(item => item.periodo === periodo);
    return match ? match.value.toString() : '--';
  }
}