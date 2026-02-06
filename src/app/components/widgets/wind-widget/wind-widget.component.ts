import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { WindWidgetData } from '../../../models/widget.model';

/**
 * Widget de Viento
 * Muestra velocidad, ráfagas, dirección y escala Beaufort
 */
@Component({
  selector: 'app-wind-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent],
  template: `
    <app-base-widget
      title="Viento"
      icon="fas fa-wind"
      [size]="size"
      type="wind"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
    >
      @if (data) {
        <div class="wind-content">
          <!-- Rosa de Vientos -->
          <div class="wind-compass">
            <div class="compass-circle">
              <div class="compass-directions">
                <span class="direction-label north">N</span>
                <span class="direction-label east">E</span>
                <span class="direction-label south">S</span>
                <span class="direction-label west">O</span>
              </div>
              
              <div 
                class="wind-arrow"
                [style.transform]="'rotate(' + data.direction + 'deg)'"
              >
                <i class="fas fa-long-arrow-alt-up"></i>
              </div>
              
              <div class="compass-center">
                <div class="direction-name">{{ data.directionName }}</div>
                <div class="direction-degrees">{{ data.direction }}°</div>
              </div>
            </div>
          </div>

          <!-- Métricas de Viento -->
          <div class="wind-metrics">
            <div class="metric-card primary">
              <div class="metric-icon">
                <i class="fas fa-wind"></i>
              </div>
              <div class="metric-info">
                <span class="metric-label">Velocidad</span>
                <span class="metric-value">{{ data.speed }} <span class="unit">km/h</span></span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">
                <i class="fas fa-flag"></i>
              </div>
              <div class="metric-info">
                <span class="metric-label">Ráfagas</span>
                <span class="metric-value">{{ data.gusts }} <span class="unit">km/h</span></span>
              </div>
            </div>
          </div>

          <!-- Escala Beaufort -->
          <div class="beaufort-scale">
            <div class="scale-header">
              <span class="scale-title">Escala Beaufort</span>
              <span class="scale-value">{{ getBeaufortName(data.beaufortScale) }}</span>
            </div>
            <div class="scale-bar">
              <div 
                class="scale-fill"
                [style.width.%]="(data.beaufortScale / 12) * 100"
                [style.background]="getBeaufortColor(data.beaufortScale)"
              ></div>
              <div class="scale-markers">
                @for (mark of [0, 3, 6, 9, 12]; track mark) {
                  <div class="scale-marker" [style.left.%]="(mark / 12) * 100"></div>
                }
              </div>
            </div>
            <div class="scale-labels">
              <span>Calma</span>
              <span>Moderado</span>
              <span>Fuerte</span>
              <span>Temporal</span>
            </div>
          </div>
        </div>
      }
    </app-base-widget>
  `,
  styles: [`
    .wind-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    /* Rosa de Vientos */
    .wind-compass {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem 0;
    }

    .compass-circle {
      position: relative;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(100, 149, 237, 0.1) 0%, rgba(100, 149, 237, 0.05) 70%);
      border: 2px solid rgba(100, 149, 237, 0.2);
      box-shadow: 
        0 0 0 1px rgba(100, 149, 237, 0.1),
        inset 0 0 20px rgba(100, 149, 237, 0.05);
    }

    .compass-directions {
      position: absolute;
      inset: 0;
    }

    .direction-label {
      position: absolute;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .north { top: 8px; left: 50%; transform: translateX(-50%); }
    .east { right: 8px; top: 50%; transform: translateY(-50%); }
    .south { bottom: 8px; left: 50%; transform: translateX(-50%); }
    .west { left: 8px; top: 50%; transform: translateY(-50%); }

    .wind-arrow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 60px;
      transform-origin: center bottom;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      margin-left: -2px;
      margin-top: -30px;
    }

    .wind-arrow i {
      font-size: 3rem;
      color: var(--primary-blue);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .compass-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      width: 70px;
      height: 70px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .direction-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-blue);
    }

    .direction-degrees {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    /* Métricas de Viento */
    .wind-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      background: rgba(100, 149, 237, 0.08);
      border-color: rgba(100, 149, 237, 0.2);
      transform: translateY(-2px);
    }

    .metric-card.primary {
      grid-column: 1 / -1;
      background: rgba(100, 149, 237, 0.08);
      border-color: rgba(100, 149, 237, 0.2);
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(100, 149, 237, 0.15);
      border-radius: 12px;
      color: var(--primary-blue);
      font-size: 1.25rem;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .metric-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .unit {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-left: 0.25rem;
    }

    /* Escala Beaufort */
    .beaufort-scale {
      margin-top: auto;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .scale-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .scale-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .scale-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-blue);
    }

    .scale-bar {
      position: relative;
      width: 100%;
      height: 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .scale-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .scale-markers {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .scale-marker {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-secondary);
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .wind-metrics {
        grid-template-columns: 1fr;
      }

      .metric-card.primary {
        grid-column: 1;
      }
    }
  `]
})
export class WindWidgetComponent implements OnInit {
  @Input() data?: WindWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    // Datos de prueba si no se proporcionan
    if (!this.data && !this.isLoading) {
      this.data = {
        speed: 18,
        gusts: 28,
        direction: 225, // SO
        directionName: 'SO',
        beaufortScale: 4,
        forecast: []
      };
    }
  }

  onRefresh(): void {
    console.log('Refreshing wind widget...');
  }

  getBeaufortName(scale: number): string {
    const names = [
      'Calma', 'Ventolina', 'Flojito', 'Flojo', 'Bonancible',
      'Fresquito', 'Fresco', 'Frescachón', 'Duro', 'Muy duro',
      'Temporal', 'Temporal fuerte', 'Temporal huracanado'
    ];
    return names[Math.min(scale, 12)] || 'Calma';
  }

  getBeaufortColor(scale: number): string {
    if (scale >= 10) return '#ef4444'; // Rojo - Temporal
    if (scale >= 8) return '#f97316'; // Naranja - Duro
    if (scale >= 6) return '#f59e0b'; // Amarillo - Fresco
    if (scale >= 4) return '#5DDFFF'; // Cyan - Moderado
    return '#87CEEB'; // Celeste - Calma/Ligero
  }
}
