import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWidgetComponent } from '../base-widget/base-widget.component';
import { AlertsWidgetData } from '../../../models/widget.model';

/**
 * Widget de Alertas Meteorológicas
 * Muestra alertas activas con severidad y detalles
 */
@Component({
  selector: 'app-alerts-widget',
  standalone: true,
  imports: [CommonModule, BaseWidgetComponent],
  template: `
    <app-base-widget
      title="Alertas Meteorológicas"
      icon="fas fa-exclamation-triangle"
      [size]="size"
      type="alerts"
      [isLoading]="isLoading"
      [hasError]="hasError"
      (refresh)="onRefresh()"
      [footer]="!!(data && data.alerts.length > 0)"
    >
      @if (data) {
        <div class="alerts-content">
          @if (data.active === 0) {
            <!-- Sin alertas -->
            <div class="no-alerts-state">
              <div class="icon-wrapper">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3 class="no-alerts-title">Sin alertas activas</h3>
              <p class="no-alerts-text">
                No hay alertas meteorológicas en este momento. Las condiciones son normales.
              </p>
            </div>
          } @else {
            <!-- Header con contador -->
            <div class="alerts-header">
              <div class="alert-badge" [class.has-danger]="hasDangerAlert()">
                <i class="fas fa-bell"></i>
                <span class="badge-count">{{ data.active }}</span>
              </div>
              <div class="alert-summary">
                <span class="summary-text">
                  {{ data.active }} {{ data.active === 1 ? 'alerta activa' : 'alertas activas' }}
                </span>
                <span class="summary-subtext">Revisa los detalles</span>
              </div>
            </div>

            <!-- Lista de Alertas -->
            <div class="alerts-list">
              @for (alert of data.alerts; track alert.title) {
                <article 
                  class="alert-card"
                  [class.severity-info]="alert.severity === 'info'"
                  [class.severity-warning]="alert.severity === 'warning'"
                  [class.severity-danger]="alert.severity === 'danger'"
                >
                  <!-- Header de Alerta -->
                  <header class="alert-header">
                    <div class="alert-icon-badge" [class]="'type-' + alert.type">
                      <i [ngClass]="getAlertIcon(alert.type)"></i>
                    </div>
                    <div class="alert-title-section">
                      <h4 class="alert-title">{{ alert.title }}</h4>
                      <span class="alert-severity-badge">{{ getSeverityText(alert.severity) }}</span>
                    </div>
                  </header>

                  <!-- Body de Alerta -->
                  <div class="alert-body">
                    <p class="alert-description">{{ alert.description }}</p>
                  </div>

                  <!-- Footer de Alerta -->
                  <footer class="alert-footer">
                    <div class="time-info">
                      <i class="fas fa-clock"></i>
                      <span>{{ formatAlertTime(alert.startTime, alert.endTime) }}</span>
                    </div>
                    <button class="details-btn" (click)="showAlertDetails(alert)">
                      Detalles
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </footer>
                </article>
              }
            </div>
          }
        </div>

        @if (data.active > 0) {
          <div slot="footer" class="widget-footer-content">
            <i class="fas fa-info-circle"></i>
            Mantente informado y toma precauciones necesarias
          </div>
        }
      }
    </app-base-widget>
  `,
  styles: [`
    .alerts-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      height: 100%;
    }

    /* Estado sin alertas */
    .no-alerts-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      height: 100%;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
      border-radius: 50%;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
    }

    .icon-wrapper i {
      font-size: 2.5rem;
      color: white;
    }

    .no-alerts-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .no-alerts-text {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 400px;
      line-height: 1.5;
    }

    /* Header con contador */
    .alerts-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.08);
      border-radius: 12px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .alert-badge {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    .alert-badge.has-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      animation: pulse-alert 2s ease-in-out infinite;
    }

    @keyframes pulse-alert {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .alert-badge i {
      font-size: 1.5rem;
      color: white;
    }

    .badge-count {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      color: var(--text-primary);
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .alert-summary {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-text {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .summary-subtext {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Lista de Alertas */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      max-height: 500px;
    }

    .alert-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .alert-card:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .alert-card.severity-info {
      border-left: 4px solid #2E4DEE;
      background: rgba(46, 77, 238, 0.05);
    }

    .alert-card.severity-warning {
      border-left: 4px solid #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .alert-card.severity-danger {
      border-left: 4px solid #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .alert-icon-badge {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      font-size: 1.125rem;
    }

    .alert-icon-badge.type-rain { background: rgba(46, 77, 238, 0.15); color: #2E4DEE; }
    .alert-icon-badge.type-wind { background: rgba(93, 223, 255, 0.15); color: #5DDFFF; }
    .alert-icon-badge.type-temperature { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .alert-icon-badge.type-storm { background: rgba(59, 91, 255, 0.15); color: #3B5BFF; }
    .alert-icon-badge.type-snow { background: rgba(176, 224, 246, 0.15); color: #B0E0F6; }
    .alert-icon-badge.type-fog { background: rgba(135, 206, 235, 0.15); color: #87CEEB; }

    .alert-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
    }

    .alert-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .alert-severity-badge {
      display: inline-block;
      width: fit-content;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .severity-info .alert-severity-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    .severity-warning .alert-severity-badge {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .severity-danger .alert-severity-badge {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .alert-body {
      padding: 1rem;
    }

    .alert-description {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text-secondary);
      margin: 0;
    }

    .alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .time-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .time-info i {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .details-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      background: rgba(100, 149, 237, 0.1);
      border: 1px solid rgba(100, 149, 237, 0.2);
      border-radius: 8px;
      color: var(--primary-blue);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .details-btn:hover {
      background: rgba(100, 149, 237, 0.2);
      transform: translateX(2px);
    }

    .details-btn i {
      font-size: 0.7rem;
    }

    .widget-footer-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .widget-footer-content i {
      color: var(--primary-blue);
    }

    @media (max-width: 768px) {
      .alerts-list {
        max-height: 400px;
      }
    }
  `]
})
export class AlertsWidgetComponent implements OnInit {
  @Input() data?: AlertsWidgetData;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;

  ngOnInit(): void {
    if (!this.data && !this.isLoading) {
      // Datos de prueba con algunas alertas
      const now = new Date();
      this.data = {
        active: 2,
        alerts: [
          {
            type: 'wind',
            severity: 'warning',
            title: 'Alerta de Viento Fuerte',
            description: 'Se esperan rachas de viento de hasta 70 km/h durante la tarde. Se recomienda precaución al conducir y evitar actividades al aire libre.',
            startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000)
          },
          {
            type: 'rain',
            severity: 'info',
            title: 'Probabilidad de Lluvia Alta',
            description: 'Alta probabilidad de precipitaciones durante la noche. Lleva paraguas si sales.',
            startTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000)
          }
        ]
      };
      
      // Para prueba sin alertas, descomenta esto:
      // this.data = { active: 0, alerts: [] };
    }
  }

  onRefresh(): void {
    console.log('Refreshing alerts widget...');
  }

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      'rain': 'fas fa-cloud-rain',
      'wind': 'fas fa-wind',
      'temperature': 'fas fa-thermometer-full',
      'storm': 'fas fa-bolt',
      'snow': 'fas fa-snowflake',
      'fog': 'fas fa-smog'
    };
    return icons[type] || 'fas fa-exclamation';
  }

  getSeverityText(severity: string): string {
    const texts: Record<string, string> = {
      'info': 'Información',
      'warning': 'Aviso',
      'danger': 'Peligro'
    };
    return texts[severity] || severity;
  }

  formatAlertTime(start: Date, end: Date): string {
    const formatTime = (date: Date) => 
      date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    const startStr = `${formatDate(start)} ${formatTime(start)}`;
    const endStr = `${formatTime(end)}`;

    return `${startStr} - ${endStr}`;
  }

  hasDangerAlert(): boolean {
    return this.data?.alerts.some(alert => alert.severity === 'danger') || false;
  }

  showAlertDetails(alert: any): void {
    console.log('Showing alert details:', alert);
    // TODO: Implementar modal con detalles completos
  }
}
