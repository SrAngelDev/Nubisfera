import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { CircularGaugeComponent } from '../../circular-gauge/circular-gauge.component';
import { UVIndexWidgetData } from '../../../models/widget.model';

/**
 * Widget de Índice UV
 * Muestra índice UV actual, nivel de riesgo y recomendaciones
 */
@Component({
  selector: 'app-uv-index-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent, CircularGaugeComponent],
  template: `
    <app-base-widget
      title="Índice UV"
      icon="fas fa-sun"
      [size]="size"
      type="uv-index"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
    >
      @if (data) {
        <div class="uv-content">
          <!-- Gauge Principal -->
          <div class="uv-gauge-section">
            <div class="gauge-container">
              <app-circular-gauge
                [value]="data.current"
                [max]="data.max"
                [size]="140"
                [strokeWidth]="14"
                [color]="getUVColor(data.current)"
                [unit]="''"
              ></app-circular-gauge>
            </div>
            <div class="uv-level-badge" [style.background]="getUVColor(data.current)">
              {{ getUVLevelText(data.level) }}
            </div>
          </div>

          <!-- Info Cards -->
          <div class="uv-info-grid">
            <div class="info-card">
              <div class="info-label">
                <i class="fas fa-arrow-up"></i>
                Máximo hoy
              </div>
              <div class="info-value">{{ data.max }}</div>
            </div>

            <div class="info-card highlight">
              <div class="info-label">
                <i class="fas fa-shield-alt"></i>
                Protección
              </div>
              <div class="info-text">{{ data.protection }}</div>
            </div>
          </div>

          <!-- Recomendaciones -->
          <div class="recommendations">
            <h4 class="section-title">
              <i class="fas fa-lightbulb"></i>
              Recomendaciones
            </h4>
            <ul class="recommendation-list">
              @for (rec of getRecommendations(data.level); track rec) {
                <li class="recommendation-item">
                  <i class="fas fa-check-circle"></i>
                  <span>{{ rec }}</span>
                </li>
              }
            </ul>
          </div>

          <!-- Timeline UV -->
          @if (data.hourlyForecast.length > 0) {
            <div class="uv-timeline">
              <h4 class="section-title">Evolución UV</h4>
              <div class="timeline-chart">
                @for (item of data.hourlyForecast.slice(0, 8); track item.hour) {
                  <div class="timeline-bar">
                    <div 
                      class="bar-fill"
                      [style.height.%]="(item.index / 12) * 100"
                      [style.background]="getUVColor(item.index)"
                    ></div>
                    <span class="bar-value">{{ item.index }}</span>
                    <span class="bar-label">{{ item.hour }}</span>
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
    .uv-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    .uv-gauge-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .gauge-container {
      filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.1));
    }

    .uv-level-badge {
      padding: 0.625rem 1.5rem;
      border-radius: 16px;
      color: white;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .uv-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .info-card {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-card.highlight {
      grid-column: 1 / -1;
      background: rgba(255, 152, 0, 0.08);
      border-color: rgba(255, 152, 0, 0.2);
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .info-label i {
      color: var(--primary-blue);
    }

    .info-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .info-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .recommendations {
      padding: 1rem;
      background: rgba(100, 149, 237, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(100, 149, 237, 0.15);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .section-title i {
      color: var(--primary-blue);
      font-size: 1rem;
    }

    .recommendation-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      font-size: 0.875rem;
      line-height: 1.4;
      color: var(--text-primary);
    }

    .recommendation-item i {
      color: var(--success-green);
      font-size: 0.875rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }

    .uv-timeline {
      margin-top: auto;
    }

    .timeline-chart {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0.5rem;
    }

    .timeline-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
    }

    .bar-fill {
      width: 100%;
      min-height: 60px;
      max-height: 100px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bar-value {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .bar-label {
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .timeline-chart {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `]
})
export class UvIndexWidgetComponent implements OnInit {
  @Input() data?: UVIndexWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    if (!this.data && !this.isLoading) {
      this.data = {
        current: 6,
        max: 8,
        level: 'high',
        protection: 'Se recomienda protección solar',
        hourlyForecast: [
          { hour: '10h', index: 4 },
          { hour: '11h', index: 5 },
          { hour: '12h', index: 6 },
          { hour: '13h', index: 7 },
          { hour: '14h', index: 8 },
          { hour: '15h', index: 7 },
          { hour: '16h', index: 6 },
          { hour: '17h', index: 4 }
        ]
      };
    }
  }

  onRefresh(): void {
    console.log('Refreshing UV index widget...');
  }

  getUVColor(index: number): string {
    if (index >= 11) return '#b91c8e'; // Extremo - Morado
    if (index >= 8) return '#d60028'; // Muy alto - Rojo
    if (index >= 6) return '#ff8c00'; // Alto - Naranja
    if (index >= 3) return '#ffd700'; // Moderado - Amarillo
    return '#4caf50'; // Bajo - Verde
  }

  getUVLevelText(level: string): string {
    const levels: Record<string, string> = {
      'low': 'Bajo',
      'moderate': 'Moderado',
      'high': 'Alto',
      'very-high': 'Muy Alto',
      'extreme': 'Extremo'
    };
    return levels[level] || 'Desconocido';
  }

  getRecommendations(level: string): string[] {
    const recommendations: Record<string, string[]> = {
      'low': [
        'Puedes estar al aire libre sin protección',
        'Usa gafas de sol en días brillantes'
      ],
      'moderate': [
        'Busca sombra durante las horas centrales',
        'Usa protector solar SPF 30+',
        'Usa sombrero y gafas de sol'
      ],
      'high': [
        'Evita el sol entre 10:00 y 16:00',
        'Usa protector solar SPF 50+',
        'Ropa protectora, sombrero y gafas',
        'Busca sombra siempre que sea posible'
      ],
      'very-high': [
        'Minimiza exposición solar entre 10:00-16:00',
        'Protector solar SPF 50+ cada 2 horas',
        'Ropa de manga larga y sombrero',
        'Permanece en la sombra'
      ],
      'extreme': [
        'Evita totalmente el sol entre 10:00-16:00',
        'Protección máxima obligatoria',
        'Ropa protectora completa',
        'Reaplica protector cada hora'
      ]
    };
    return recommendations[level] || [];
  }
}
