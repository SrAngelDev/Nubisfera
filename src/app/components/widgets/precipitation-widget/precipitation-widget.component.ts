import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { CircularGaugeComponent } from '../../circular-gauge/circular-gauge.component';
import { PrecipitationWidgetData } from '../../../models/widget.model';

/**
 * Widget de Precipitación
 * Muestra probabilidad de lluvia, acumulación y pronóstico
 */
@Component({
  selector: 'app-precipitation-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent, CircularGaugeComponent],
  template: `
    <app-base-widget
      title="Precipitación"
      icon="fas fa-cloud-rain"
      [size]="size"
      type="precipitation"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
    >
      @if (data) {
        <div class="precipitation-content">
          <!-- Probabilidad Actual -->
          <div class="current-probability">
            <div class="gauge-wrapper">
              <app-circular-gauge
                [value]="data.currentProbability"
                [max]="100"
                [size]="120"
                [strokeWidth]="12"
                [color]="getProbabilityColor(data.currentProbability)"
                unit="%"
              ></app-circular-gauge>
            </div>
            <div class="probability-label">
              <span class="label-text">Ahora</span>
              <p class="probability-description">{{ getProbabilityText(data.currentProbability) }}</p>
            </div>
          </div>

          <!-- Próxima Hora y Acumulado -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Próxima hora</span>
                <span class="info-value">{{ data.nextHourProbability }}%</span>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-tint"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Últimas 24h</span>
                <span class="info-value">{{ data.accumulated24h }} mm</span>
              </div>
            </div>
          </div>

          <!-- Pronóstico por Horas -->
          @if (data.forecast.length > 0) {
            <div class="forecast-timeline">
              <h4 class="section-title">Próximas horas</h4>
              <div class="timeline-bars">
                @for (item of data.forecast.slice(0, 6); track item.hour) {
                  <div class="timeline-item">
                    <div class="bar-container">
                      <div 
                        class="bar-fill"
                        [style.height.%]="item.probability"
                        [style.background]="getProbabilityColor(item.probability)"
                      ></div>
                    </div>
                    <span class="bar-label">{{ item.hour }}</span>
                    <span class="bar-value">{{ item.probability }}%</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </app-base-widget>
  `,
  styles: [`
    .precipitation-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    /* Probabilidad Actual */
    .current-probability {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .gauge-wrapper {
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
    }

    .probability-label {
      text-align: center;
    }

    .label-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .probability-description {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0.25rem 0 0 0;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }

    .info-card:hover {
      background: rgba(100, 149, 237, 0.08);
      border-color: rgba(100, 149, 237, 0.2);
      transform: translateY(-2px);
    }

    .info-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(100, 149, 237, 0.1);
      border-radius: 10px;
      color: var(--primary-blue);
      font-size: 1.125rem;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .info-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Timeline de Pronóstico */
    .forecast-timeline {
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

    .timeline-bars {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.75rem;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-container {
      width: 100%;
      height: 80px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .bar-fill {
      width: 100%;
      border-radius: 6px 6px 0 0;
      transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 4px;
    }

    .bar-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .bar-value {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }

      .timeline-bars {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class PrecipitationWidgetComponent implements OnInit {
  @Input() data?: PrecipitationWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    // Datos de prueba si no se proporcionan
    if (!this.data && !this.isLoading) {
      this.data = {
        currentProbability: 35,
        nextHourProbability: 45,
        accumulated24h: 2.5,
        forecast: [
          { hour: '14h', probability: 35, amount: 0.5 },
          { hour: '15h', probability: 45, amount: 1.2 },
          { hour: '16h', probability: 60, amount: 2.5 },
          { hour: '17h', probability: 75, amount: 3.8 },
          { hour: '18h', probability: 50, amount: 1.5 },
          { hour: '19h', probability: 25, amount: 0.3 }
        ]
      };
    }
  }

  onRefresh(): void {
    console.log('Refreshing precipitation widget...');
  }

  getProbabilityColor(probability: number): string {
    if (probability >= 80) return '#2E4DEE'; // Azul oscuro - Alta
    if (probability >= 60) return '#3B5BFF'; // Azul medio - Media-alta
    if (probability >= 40) return '#5D7FFF'; // Azul claro - Media
    if (probability >= 20) return '#87CEEB'; // Azul muy claro - Baja
    return '#B0E0F6'; // Azul pálido - Muy baja
  }

  getProbabilityText(probability: number): string {
    if (probability >= 80) return 'Lluvia muy probable';
    if (probability >= 60) return 'Lluvia probable';
    if (probability >= 40) return 'Posible lluvia';
    if (probability >= 20) return 'Lluvia poco probable';
    return 'Sin lluvia esperada';
  }
}
