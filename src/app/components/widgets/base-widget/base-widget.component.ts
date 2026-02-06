import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetSize, WidgetType } from '../../../models/widget.model';

/**
 * Componente base para todos los widgets del dashboard
 * Proporciona estructura y estilos comunes
 */
@Component({
  selector: 'app-base-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article 
      class="base-widget"
      [class.size-small]="size === 'small'"
      [class.size-medium]="size === 'medium'"
      [class.size-large]="size === 'large'"
      [class.size-xlarge]="size === 'xlarge'"
      [class.loading]="isLoading"
      [class.error]="hasError"
    >
      <!-- Header del Widget -->
      <header class="widget-header">
        <div class="header-content">
          @if (icon) {
            <i class="widget-icon" [ngClass]="icon"></i>
          }
          <h3 class="widget-title">{{ title }}</h3>
        </div>
        <div class="header-actions">
          @if (showRefresh) {
            <button 
              class="action-btn refresh-btn" 
              (click)="onRefresh()"
              [disabled]="isLoading"
              aria-label="Actualizar widget"
            >
              <i class="fas fa-sync-alt" [class.spinning]="isLoading"></i>
            </button>
          }
          @if (showSettings) {
            <button 
              class="action-btn settings-btn" 
              (click)="onSettings()"
              aria-label="Configurar widget"
            >
              <i class="fas fa-cog"></i>
            </button>
          }
        </div>
      </header>

      <!-- Body del Widget -->
      <div class="widget-body">
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner-small"></div>
            <p>Cargando...</p>
          </div>
        } @else if (hasError) {
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ errorMessage }}</p>
            <button class="retry-btn-small" (click)="onRefresh()">
              Reintentar
            </button>
          </div>
        } @else {
          <ng-content></ng-content>
        }
      </div>

      @if (footer) {
        <footer class="widget-footer">
          <ng-content select="[slot='footer']"></ng-content>
        </footer>
      }
    </article>
  `,
  styles: [`
    .base-widget {
      position: relative;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .base-widget:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border-color: rgba(100, 149, 237, 0.3);
    }

    /* Tamaños de Widgets */
    .base-widget.size-small {
      min-height: 180px;
    }

    .base-widget.size-medium {
      min-height: 280px;
    }

    .base-widget.size-large {
      min-height: 380px;
    }

    .base-widget.size-xlarge {
      min-height: 480px;
    }

    /* Header del Widget */
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.03);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .widget-icon {
      font-size: 1.25rem;
      color: var(--primary-blue);
      opacity: 0.9;
    }

    .widget-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: 0.3px;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .action-btn:hover:not(:disabled) {
      background: rgba(100, 149, 237, 0.15);
      border-color: rgba(100, 149, 237, 0.3);
      color: var(--primary-blue);
      transform: scale(1.05);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Body del Widget */
    .widget-body {
      flex: 1;
      padding: 1.5rem;
      overflow: auto;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--text-secondary);
    }

    .spinner-small {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(100, 149, 237, 0.2);
      border-top-color: var(--primary-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 0.75rem;
      color: var(--error-red);
      text-align: center;
    }

    .error-state i {
      font-size: 2rem;
      opacity: 0.8;
    }

    .retry-btn-small {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--gradient-horizon);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .retry-btn-small:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(100, 149, 237, 0.3);
    }

    /* Footer del Widget */
    .widget-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.02);
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Estados del Widget */
    .base-widget.loading {
      pointer-events: none;
    }

    .base-widget.error {
      border-color: rgba(239, 68, 68, 0.3);
    }
  `]
})
export class BaseWidgetComponent {
  @Input() title: string = '';
  @Input() icon?: string;
  @Input() size: WidgetSize = 'medium';
  @Input() type?: WidgetType;
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = 'Error al cargar los datos';
  @Input() showRefresh: boolean = true;
  @Input() showSettings: boolean = false;
  @Input() footer: boolean = false;

  @Output() refresh = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }

  onSettings(): void {
    this.settings.emit();
  }
}
