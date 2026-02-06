import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { SparklineComponent } from '../../sparkline/sparkline.component';
import { TemperatureWidgetData } from '../../../models/widget.model';

/**
 * Widget de Temperatura
 * Muestra temperatura actual, sensación térmica, tendencia y pronóstico por horas
 */
@Component({
  selector: 'app-temperature-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent, SparklineComponent],
  template: `
    <app-base-widget
      title="Temperatura"
      icon="fas fa-thermometer-half"
      [size]="size"
      type="temperature"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
    >
      @if (data) {
        <div class="temperature-content">
          <!-- Temperatura Actual -->
          <div class="current-temp-section">
            <div class="temp-display">
              <span 
                class="temp-value" 
                [style.color]="getTemperatureColor(data.current)"
              >
                {{ data.current | number:'1.0-0' }}°
              </span>
              <div class="temp-trend">
                @if (data.trend === 'up') {
                  <i class="fas fa-arrow-up trend-up"></i>
                  <span class="trend-label">Subiendo</span>
                } @else if (data.trend === 'down') {
                  <i class="fas fa-arrow-down trend-down"></i>
                  <span class="trend-label">Bajando</span>
                } @else {
                  <i class="fas fa-minus trend-stable"></i>
                  <span class="trend-label">Estable</span>
                }
              </div>
            </div>

            <!-- Sensación Térmica -->
            <div class="feels-like">
              <span class="label">Sensación térmica</span>
              <span class="value">{{ data.feelsLike | number:'1.0-0' }}°</span>
            </div>
          </div>

          <!-- Rango Diario -->
          <div class="temp-range-section">
            <div class="range-item">
              <i class="fas fa-arrow-down temp-icon-min"></i>
              <div class="range-info">
                <span class="range-label">Mínima</span>
                <span class="range-value">{{ data.min | number:'1.0-0' }}°</span>
              </div>
            </div>
            <div class="range-divider"></div>
            <div class="range-item">
              <i class="fas fa-arrow-up temp-icon-max"></i>
              <div class="range-info">
                <span class="range-label">Máxima</span>
                <span class="range-value">{{ data.max | number:'1.0-0' }}°</span>
              </div>
            </div>
          </div>

          <!-- Pronóstico por Horas (Sparkline) -->
          @if (data.hourlyForecast.length > 0) {
            <div class="hourly-forecast-section">
              <h4 class="section-title">Próximas horas</h4>
              <div class="sparkline-container">
                <app-sparkline
                  [data]="getHourlyTemps()"
                  [width]="getSparklineWidth()"
                  [height]="60"
                  [color]="getTemperatureColor(data.current)"
                  [showFill]="true"
                  [lineWidth]="2"
                ></app-sparkline>
              </div>
              <div class="hourly-labels">
                @for (hour of getHourlyLabels(); track hour) {
                  <span class="hour-label">{{ hour }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </app-base-widget>
  `,
  styles: [`
    .temperature-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    /* Sección Temperatura Actual */
    .current-temp-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .temp-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .temp-value {
      font-size: 4rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -2px;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transition: color 0.3s ease;
    }

    .temp-trend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .temp-trend i {
      font-size: 1rem;
    }

    .trend-up {
      color: var(--error-red);
    }

    .trend-down {
      color: var(--info-cyan);
    }

    .trend-stable {
      color: var(--text-secondary);
      opacity: 0.6;
    }

    .trend-label {
      color: var(--text-secondary);
    }

    .feels-like {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .feels-like .label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .feels-like .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Rango Diario */
    .temp-range-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .range-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .temp-icon-min {
      font-size: 1.25rem;
      color: var(--info-cyan);
    }

    .temp-icon-max {
      font-size: 1.25rem;
      color: var(--error-red);
    }

    .range-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .range-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .range-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .range-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Pronóstico por Horas */
    .hourly-forecast-section {
      margin-top: auto;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sparkline-container {
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .hourly-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding: 0 0.5rem;
    }

    .hour-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .temp-value {
        font-size: 3rem;
      }

      .temp-range-section {
        flex-direction: column;
        gap: 1rem;
      }

      .range-divider {
        width: 60px;
        height: 1px;
      }
    }
  `]
})
export class TemperatureWidgetComponent implements OnInit {
  @Input() data?: TemperatureWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    // Datos de prueba si no se proporcionan
    if (!this.data && !this.isLoading) {
      this.data = {
        current: 22,
        feelsLike: 21,
        min: 15,
        max: 28,
        trend: 'up',
        hourlyForecast: [
          { hour: '14:00', temp: 22 },
          { hour: '15:00', temp: 24 },
          { hour: '16:00', temp: 26 },
          { hour: '17:00', temp: 28 },
          { hour: '18:00', temp: 26 },
          { hour: '19:00', temp: 24 },
          { hour: '20:00', temp: 22 }
        ]
      };
    }
  }

  onRefresh(): void {
    console.log('Refreshing temperature widget...');
    // Aquí iría la lógica de actualización
  }

  getTemperatureColor(temp: number): string {
    if (temp >= 30) return '#f87171';
    if (temp >= 25) return '#5DDFFF';
    if (temp >= 20) return '#87CEEB';
    if (temp >= 15) return '#2E4DEE';
    if (temp >= 10) return '#3B5BFF';
    return '#B0E0F6';
  }

  getHourlyTemps(): number[] {
    return this.data?.hourlyForecast.map(h => h.temp) || [];
  }

  getHourlyLabels(): string[] {
    if (!this.data?.hourlyForecast) return [];
    const labels = this.data.hourlyForecast.map(h => h.hour.split(':')[0] + 'h');
    // Mostrar solo algunas etiquetas para evitar saturación
    return labels.filter((_, i) => i % 2 === 0);
  }

  getSparklineWidth(): number {
    // Calcular ancho dinámicamente basado en el contenedor
    // Por ahora retornamos un valor fijo que se ajuste bien
    return 240;
  }
}
