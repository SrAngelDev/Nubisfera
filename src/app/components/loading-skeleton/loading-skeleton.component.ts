import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton para estados de carga
 * Mejora la percepción de velocidad mostrando placeholders animados
 */
@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('card') {
        <div class="skeleton-card">
          <div class="skeleton-header">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-lines">
              <div class="skeleton-line skeleton-line-short"></div>
              <div class="skeleton-line skeleton-line-medium"></div>
            </div>
          </div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line-full"></div>
            <div class="skeleton-line skeleton-line-full"></div>
            <div class="skeleton-line skeleton-line-medium"></div>
          </div>
        </div>
      }
      @case ('list') {
        <div class="skeleton-list">
          @for (item of [1, 2, 3, 4, 5]; track item) {
            <div class="skeleton-list-item">
              <div class="skeleton-avatar skeleton-avatar-small"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line-medium"></div>
                <div class="skeleton-line skeleton-line-short"></div>
              </div>
            </div>
          }
        </div>
      }
      @case ('grid') {
        <div class="skeleton-grid">
          @for (item of gridItems; track item) {
            <div class="skeleton-card-mini">
              <div class="skeleton-image"></div>
              <div class="skeleton-line skeleton-line-medium"></div>
              <div class="skeleton-line skeleton-line-short"></div>
            </div>
          }
        </div>
      }
      @case ('chart') {
        <div class="skeleton-chart">
          <div class="skeleton-chart-bars">
            @for (bar of [1, 2, 3, 4, 5, 6, 7, 8]; track bar) {
              <div class="skeleton-bar" [style.height.%]="getRandomHeight()"></div>
            }
          </div>
          <div class="skeleton-chart-legend">
            <div class="skeleton-line skeleton-line-short"></div>
            <div class="skeleton-line skeleton-line-short"></div>
            <div class="skeleton-line skeleton-line-short"></div>
          </div>
        </div>
      }
      @case ('map') {
        <div class="skeleton-map">
          <div class="skeleton-map-overlay"></div>
          <div class="skeleton-map-controls">
            <div class="skeleton-control-btn"></div>
            <div class="skeleton-control-btn"></div>
            <div class="skeleton-control-btn"></div>
          </div>
        </div>
      }
      @default {
        <div class="skeleton-box" [style.height.px]="height" [style.width]="width"></div>
      }
    }
  `,
  styles: [`
    /* Animación base */
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .skeleton-base {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
      border-radius: 8px;
    }

    /* Card Skeleton */
    .skeleton-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border: 1px solid var(--border-light);
    }

    .skeleton-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .skeleton-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(
        90deg,
        rgba(100, 149, 237, 0.1) 0%,
        rgba(100, 149, 237, 0.2) 50%,
        rgba(100, 149, 237, 0.1) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
      flex-shrink: 0;
    }

    .skeleton-avatar-small {
      width: 40px;
      height: 40px;
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
    }

    .skeleton-line-short {
      width: 40%;
    }

    .skeleton-line-medium {
      width: 60%;
    }

    .skeleton-line-full {
      width: 100%;
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* List Skeleton */
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-list-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid var(--border-light);
    }

    /* Grid Skeleton */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card-mini {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-image {
      width: 100%;
      height: 120px;
      border-radius: 8px;
      background: linear-gradient(
        90deg,
        rgba(100, 149, 237, 0.1) 0%,
        rgba(100, 149, 237, 0.2) 50%,
        rgba(100, 149, 237, 0.1) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
    }

    /* Chart Skeleton */
    .skeleton-chart {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      height: 200px;
    }

    .skeleton-bar {
      flex: 1;
      background: linear-gradient(
        180deg,
        rgba(100, 149, 237, 0.3) 0%,
        rgba(100, 149, 237, 0.1) 100%
      );
      border-radius: 8px 8px 0 0;
      animation: shimmer 2s infinite linear;
      background-size: 100% 1000px;
    }

    .skeleton-chart-legend {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    /* Map Skeleton */
    .skeleton-map {
      position: relative;
      width: 100%;
      height: calc(100vh - 80px);
      background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.8) 0%,
        rgba(30, 41, 59, 0.8) 50%,
        rgba(15, 23, 42, 0.8) 100%
      );
      border-radius: 16px;
      overflow: hidden;
    }

    .skeleton-map-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 30% 40%, rgba(100, 149, 237, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, rgba(135, 206, 235, 0.1) 0%, transparent 50%);
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }

    .skeleton-map-controls {
      position: absolute;
      bottom: 2rem;
      left: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-control-btn {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      animation: shimmer 2s infinite linear;
      background-size: 100px 100%;
    }

    /* Box Skeleton */
    .skeleton-box {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
      border-radius: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .skeleton-grid {
        grid-template-columns: 1fr;
      }

      .skeleton-chart-bars {
        height: 150px;
      }
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'list' | 'grid' | 'chart' | 'map' | 'box' = 'card';
  @Input() height: number = 100;
  @Input() width: string = '100%';
  @Input() count: number = 3;

  get gridItems(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  getRandomHeight(): number {
    return Math.floor(Math.random() * 60) + 40;
  }
}
