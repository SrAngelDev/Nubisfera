import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Circular Gauge Component
 * Gauge circular para mostrar porcentajes (humedad, probabilidad, etc.)
 */
@Component({
  selector: 'app-circular-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gauge-container" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="gauge-svg">
        <!-- Background circle -->
        <circle
          class="gauge-bg"
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          fill="none"
          stroke="currentColor"
          opacity="0.2"
        />
        
        <!-- Progress circle -->
        <circle
          class="gauge-progress"
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          [attr.stroke]="color"
          fill="none"
          stroke-linecap="round"
          [style.transform]="'rotate(-90deg)'"
          [style.transform-origin]="'50% 50%'"
        />
      </svg>
      
      <div class="gauge-label">
        <span class="gauge-value">{{ value }}</span>
        <span class="gauge-unit">{{ unit }}</span>
      </div>
    </div>
  `,
  styles: [`
    .gauge-container {
      position: relative;
      display: inline-block;
    }

    .gauge-svg {
      width: 100%;
      height: 100%;
    }

    .gauge-progress {
      transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .gauge-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      font-weight: 600;
    }

    .gauge-value {
      display: block;
      font-size: 1.25rem;
      line-height: 1;
      color: var(--text-primary);
    }

    .gauge-unit {
      display: block;
      font-size: 0.75rem;
      margin-top: 0.125rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
  `]
})
export class CircularGaugeComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() unit = '%';
  @Input() color = '#2E4DEE';
  @Input() size = 80;
  @Input() strokeWidth = 8;

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get dashOffset(): number {
    const progress = Math.min(Math.max(this.value / this.max, 0), 1);
    return this.circumference * (1 - progress);
  }
}
