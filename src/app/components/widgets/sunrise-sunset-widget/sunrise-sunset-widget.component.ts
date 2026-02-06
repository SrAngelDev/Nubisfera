import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { SunriseSunsetWidgetData } from '../../../models/widget.model';

/**
 * Widget de Amanecer/Atardecer
 * Muestra horas de salida y puesta del sol, duración del día
 */
@Component({
  selector: 'app-sunrise-sunset-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent],
  template: `
    <app-base-widget
      title="Amanecer y Atardecer"
      icon="fas fa-sun-cloud"
      [size]="size"
      type="sunrise-sunset"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
    >
      @if (data) {
        <div class="sun-content">
          <!-- Visualización Circular del Día -->
          <div class="day-circle-viz">
            <svg viewBox="0 0 200 110" class="sun-arc">
              <!-- Arco del día -->
              <path
                d="M 20 90 Q 100 10 180 90"
                fill="none"
                stroke="rgba(100, 149, 237, 0.2)"
                stroke-width="4"
                stroke-linecap="round"
              />
              <!-- Progreso del día -->
              <path
                d="M 20 90 Q 100 10 180 90"
                fill="none"
                [attr.stroke]="getSunColor()"
                stroke-width="4"
                stroke-linecap="round"
                [attr.stroke-dasharray]="getArcLength()"
                [attr.stroke-dashoffset]="getProgressOffset()"
                class="progress-arc"
              />
              <!-- Sol animado -->
              <circle
                [attr.cx]="getSunPosition().x"
                [attr.cy]="getSunPosition().y"
                r="8"
                [attr.fill]="getSunColor()"
                class="sun-marker"
              />
              <circle
                [attr.cx]="getSunPosition().x"
                [attr.cy]="getSunPosition().y"
                r="12"
                [attr.fill]="getSunColor()"
                opacity="0.3"
                class="sun-glow"
              />
              
              <!-- Marcadores -->
              <g class="markers">
                <!-- Amanecer -->
                <circle cx="20" cy="90" r="4" fill="var(--primary-blue)" opacity="0.6"/>
                <text x="20" y="105" text-anchor="middle" class="marker-label">
                  {{ formatTime(data.sunrise) }}
                </text>
                
                <!-- Mediodía -->
                <circle cx="100" cy="10" r="4" fill="var(--primary-blue)" opacity="0.6"/>
                <text x="100" y="5" text-anchor="middle" class="marker-label">
                  12:00
                </text>
                
                <!-- Atardecer -->
                <circle cx="180" cy="90" r="4" fill="var(--primary-blue)" opacity="0.6"/>
                <text x="180" y="105" text-anchor="middle" class="marker-label">
                  {{ formatTime(data.sunset) }}
                </text>
              </g>
            </svg>
            
            <div class="current-time-badge">
              <i class="fas fa-clock"></i>
              {{ getCurrentTime() }}
            </div>
          </div>

          <!-- Info Cards -->
          <div class="info-grid">
            <div class="info-card sunrise">
              <div class="card-icon">
                <i class="fas fa-sunrise"></i>
              </div>
              <div class="card-content">
                <span class="card-label">Amanecer</span>
                <span class="card-value">{{ formatTime(data.sunrise) }}</span>
                <span class="card-sublabel">{{ getTimeUntil(data.sunrise) }}</span>
              </div>
            </div>

            <div class="info-card sunset">
              <div class="card-icon">
                <i class="fas fa-sunset"></i>
              </div>
              <div class="card-content">
                <span class="card-label">Atardecer</span>
                <span class="card-value">{{ formatTime(data.sunset) }}</span>
                <span class="card-sublabel">{{ getTimeUntil(data.sunset) }}</span>
              </div>
            </div>
          </div>

          <!-- Estadísticas del Día -->
          <div class="day-stats">
            <div class="stat-item">
              <i class="fas fa-hourglass-half"></i>
              <div class="stat-info">
                <span class="stat-label">Duración del día</span>
                <span class="stat-value">{{ formatDuration(data.dayLength) }}</span>
              </div>
            </div>

            <div class="stat-divider"></div>

            <div class="stat-item">
              <i class="fas fa-adjust"></i>
              <div class="stat-info">
                <span class="stat-label">Crepúsculo</span>
                <span class="stat-value">
                  {{ formatTime(data.civilTwilight.dawn) }} - {{ formatTime(data.civilTwilight.dusk) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Barra de Progreso del Día -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progreso del día</span>
              <span class="progress-percentage">{{ data.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="data.progress"
              ></div>
            </div>
          </div>
        </div>
      }
    </app-base-widget>
  `,
  styles: [`
    .sun-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    /* Visualización Circular */
    .day-circle-viz {
      position: relative;
      padding: 1rem 0;
    }

    .sun-arc {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .marker-label {
      font-size: 0.625rem;
      font-weight: 600;
      fill: var(--text-secondary);
    }

    .progress-arc {
      transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sun-marker {
      filter: drop-shadow(0 2px 8px rgba(255, 152, 0, 0.6));
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sun-glow {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    .current-time-badge {
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .current-time-badge i {
      color: var(--primary-blue);
    }

    /* Info Cards */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }

    .info-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .info-card.sunrise {
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
      border-color: rgba(255, 152, 0, 0.2);
    }

    .info-card.sunset {
      background: linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%);
      border-color: rgba(233, 30, 99, 0.2);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      font-size: 1.5rem;
    }

    .info-card.sunrise .card-icon {
      color: #ff9800;
    }

    .info-card.sunset .card-icon {
      color: #e91e63;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .card-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }

    .card-sublabel {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Estadísticas */
    .day-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(100, 149, 237, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(100, 149, 237, 0.15);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .stat-item i {
      font-size: 1.5rem;
      color: var(--primary-blue);
      opacity: 0.8;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
    }

    /* Progress Bar */
    .progress-section {
      margin-top: auto;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .progress-percentage {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-blue);
    }

    .progress-bar {
      height: 10px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #5DDFFF, #87CEEB);
      border-radius: 5px;
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
    }

    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }

      .day-stats {
        flex-direction: column;
      }

      .stat-divider {
        width: 60px;
        height: 1px;
      }
    }
  `]
})
export class SunriseSunsetWidgetComponent implements OnInit {
  @Input() data?: SunriseSunsetWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    if (!this.data && !this.isLoading) {
      const now = new Date();
      const sunrise = new Date(now);
      sunrise.setHours(7, 30, 0);
      const sunset = new Date(now);
      sunset.setHours(19, 45, 0);

      this.data = {
        sunrise,
        sunset,
        dayLength: 735, // 12h 15min en minutos
        civilTwilight: {
          dawn: new Date(now.setHours(7, 0, 0)),
          dusk: new Date(now.setHours(20, 15, 0))
        },
        progress: this.calculateProgress(sunrise, sunset)
      };
    }
  }

  onRefresh(): void {
    console.log('Refreshing sunrise/sunset widget...');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getTimeUntil(targetDate: Date): string {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Ya pasó';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `En ${hours}h ${minutes}m`;
    return `En ${minutes}m`;
  }

  calculateProgress(sunrise: Date, sunset: Date): number {
    const now = new Date();
    const totalDay = sunset.getTime() - sunrise.getTime();
    const elapsed = now.getTime() - sunrise.getTime();
    
    if (elapsed < 0) return 0;
    if (elapsed > totalDay) return 100;
    
    return Math.round((elapsed / totalDay) * 100);
  }

  getSunPosition(): { x: number; y: number } {
    if (!this.data) return { x: 20, y: 90 };
    
    const progress = this.data.progress / 100;
    const t = progress;
    
    // Curva cuadrática Bezier: Q 100 10
    const x = 20 + (2 * (1 - t) * t * 100) + (t * t * 180);
    const y = 90 + (2 * (1 - t) * t * (10 - 90)) + (t * t * 90);
    
    return { x, y };
  }

  getSunColor(): string {
    if (!this.data) return '#5DDFFF';
    
    if (this.data.progress < 20) return '#5DDFFF'; // Amanecer cyan
    if (this.data.progress > 80) return '#4DD4E8'; // Atardecer cyan oscuro
    return '#87CEEB'; // Día celeste
  }

  getArcLength(): string {
    // Longitud aproximada del arco
    return '240';
  }

  getProgressOffset(): number {
    if (!this.data) return 240;
    return 240 - (240 * this.data.progress / 100);
  }
}
