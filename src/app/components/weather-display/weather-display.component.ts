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
  periodo: string; // Ahora representa rangos: "00-24", "12-18", etc.
  temperatura: string;
  estadoCielo: string;
  probPrecipitacion: number;
  esReal: boolean; // Indica si la temperatura es real o estimada
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

  // Obtener días desde hoy en adelante (para vista diaria)
  getDiasFuturos(): Dia[] {
    if (!this.prediccion?.prediccion?.dia) return [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.prediccion.prediccion.dia.filter(dia => {
      const fechaDia = new Date(dia.fecha);
      fechaDia.setHours(0, 0, 0, 0);
      return fechaDia >= hoy;
    }); // Mostrar todos los días disponibles
  }

  // Obtener días con datos horarios disponibles (para vista horaria)
  getDiasConHoras(): Dia[] {
    if (!this.prediccion?.prediccion?.dia) return [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Filtrar días desde hoy que tengan rangos horarios
    return this.prediccion.prediccion.dia.filter(dia => {
      const fechaDia = new Date(dia.fecha);
      fechaDia.setHours(0, 0, 0, 0);
      
      // Solo días desde hoy en adelante
      if (fechaDia < hoy) return false;
      
      // Verificar que tenga datos para mostrar
      const rangosCombinados = this.getHorasCombinadas(dia);
      return rangosCombinados.length > 0;
    }); // Mostrar todos los días con rangos disponibles
  }

  retryLoad() {
    this.cargarPrediccion();
  }

  formatHora(periodo: string): string {
    // Manejar rangos horarios: "00-24", "12-18", "06-12", etc.
    if (!periodo || periodo === 'undefined') return 'Todo el día';
    
    // Si es un rango (contiene guión)
    if (periodo.includes('-')) {
      const [inicio, fin] = periodo.split('-');
      const horaInicio = inicio.padStart(2, '0');
      const horaFin = fin.padStart(2, '0');
      return `${horaInicio}:00 - ${horaFin}:00`;
    }
    
    // Si es una hora individual (legacy)
    const hora = parseInt(periodo);
    if (isNaN(hora)) return periodo;
    if (hora === 0) return '00:00';
    if (hora < 10) return `0${hora}:00`;
    return `${hora}:00`;
  }

  // --- Nuevos Métodos para Predicción Horaria Combinada ---

  getHorasCombinadas(dia: Dia): HoraCombinada[] {
    // Usar Map para evitar duplicados - mantiene solo el último valor por rango
    const rangosMap = new Map<string, HoraCombinada>();

    // Verificar que tengamos datos básicos
    if (!dia.estadoCielo || dia.estadoCielo.length === 0) {
      return [];
    }

    if (!dia.temperatura) {
      return [];
    }

    const tempMin = dia.temperatura.minima ?? 10;
    const tempMax = dia.temperatura.maxima ?? 20;
    const tieneDatosTemperatura = dia.temperatura.dato && dia.temperatura.dato.length > 0;
    
    // Obtener fecha actual
    const ahora = new Date();
    const fechaDia = new Date(dia.fecha);
    
    // Si el día es anterior a hoy, no mostrar
    if (fechaDia < new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())) {
      return [];
    }
    
    console.log('Procesando día:', dia.fecha, {
      tieneDatosTemperatura,
      tempMin,
      tempMax,
      numeroRangos: dia.estadoCielo.length
    });
    
    // Procesar todos los rangos horarios
    for (const estadoCieloRango of dia.estadoCielo) {
      const periodo = estadoCieloRango.periodo;
      
      // Saltar periodos undefined o inválidos
      if (!periodo || periodo === 'undefined') {
        console.warn('Periodo inválido omitido:', periodo);
        continue;
      }

      // Convertir a string para evitar tipos BigInt
      const estadoCielo = String(estadoCieloRango.value).trim();
      
      // Validar que tengamos código de estado del cielo
      if (!estadoCielo || estadoCielo === '' || estadoCielo === 'undefined') {
        console.warn(`Estado del cielo vacío para periodo ${periodo}, omitiendo`);
        continue;
      }

      let temperatura: string;
      let esReal: boolean;
      
      if (tieneDatosTemperatura) {
        const tempValue = this.findMatchingValue(dia.temperatura.dato, periodo);
        if (tempValue !== '--' && tempValue !== 'N/D') {
          temperatura = tempValue;
          esReal = true;
        } else {
          // Calcular temperatura promedio del rango
          temperatura = Math.round((tempMin + tempMax) / 2).toString();
          esReal = false;
        }
      } else {
        temperatura = Math.round((tempMin + tempMax) / 2).toString();
        esReal = false;
      }

      // Usar Map - si ya existe, se sobrescribe
      rangosMap.set(periodo, {
        periodo: periodo,
        estadoCielo: estadoCieloRango.value,
        temperatura: temperatura,
        probPrecipitacion: parseInt(this.findMatchingValue(dia.probPrecipitacion, periodo)) || 0,
        esReal: esReal
      });
    }
    
    // Convertir Map a array y ordenar por especificidad del rango
    const rangosArray = Array.from(rangosMap.values()).sort((a, b) => {
      // Priorizar rangos más específicos (más cortos)
      const duracionA = this.calcularDuracionRango(a.periodo);
      const duracionB = this.calcularDuracionRango(b.periodo);
      if (duracionA !== duracionB) {
        return duracionA - duracionB; // Rangos más cortos primero
      }
      // Si tienen la misma duración, ordenar por hora de inicio
      return this.obtenerHoraInicio(a.periodo) - this.obtenerHoraInicio(b.periodo);
    });
    
    console.log('Horas únicas generadas:', rangosArray.length, rangosArray.map(h => h.periodo));
    return rangosArray;
  }

  // Calcular duración de un rango horario
  private calcularDuracionRango(periodo: string): number {
    if (!periodo || !periodo.includes('-')) return 24;
    const [inicio, fin] = periodo.split('-').map(Number);
    return fin - inicio;
  }

  // Obtener hora de inicio de un rango
  private obtenerHoraInicio(periodo: string): number {
    if (!periodo || !periodo.includes('-')) return 0;
    const [inicio] = periodo.split('-').map(Number);
    return inicio;
  }

  private estimarTemperatura(hora: number, min: number, max: number): string {
    // Asegurar valores por defecto si son inválidos
    const tempMin = (min != null && !isNaN(min)) ? min : 10;
    const tempMax = (max != null && !isNaN(max)) ? max : 20;
    
    // Asegurar que max >= min
    const minFinal = Math.min(tempMin, tempMax);
    const maxFinal = Math.max(tempMin, tempMax);

    // Estimación basada en patrón diario típico
    if (hora >= 0 && hora < 6) {
      // Noche/Madrugada: temperatura mínima
      return Math.round(minFinal).toString();
    } else if (hora >= 14 && hora <= 16) {
      // Media tarde: temperatura máxima
      return Math.round(maxFinal).toString();
    } else if (hora >= 6 && hora < 14) {
      // Mañana: sube de min a max (6am a 2pm)
      const ratio = (hora - 6) / 8;
      const temp = minFinal + (maxFinal - minFinal) * ratio;
      return Math.round(temp).toString();
    } else {
      // Tarde/Noche: baja de max a min (4pm a 6am)
      const horasHastaMin = hora < 6 ? 6 - hora : 30 - hora; // 24h - hora + 6
      const horasDeDescenso = 14; // De 16 a 6 (siguiente día)
      const ratio = 1 - (horasHastaMin / horasDeDescenso);
      const temp = minFinal + (maxFinal - minFinal) * Math.max(0, ratio);
      return Math.round(temp).toString();
    }
  }

  private findMatchingValue(array: Hora[] | undefined, periodo: string): string {
    if (!array || array.length === 0) {
      return '--';
    }
    const match = array.find(item => item.periodo === periodo);
    return match ? match.value.toString() : '--';
  }
}