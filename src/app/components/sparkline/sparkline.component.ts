import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Sparkline Component
 * Mini gráfico de línea para mostrar tendencias de temperatura
 */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sparkline-container">
      <canvas #sparklineCanvas [width]="width" [height]="height"></canvas>
    </div>
  `,
  styles: [`
    .sparkline-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class SparklineComponent implements AfterViewInit, OnChanges {
  @ViewChild('sparklineCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() data: number[] = [];
  @Input() width = 150;
  @Input() height = 40;
  @Input() color = '#2E4DEE';
  @Input() lineWidth = 2;
  @Input() showFill = true;

  ngAfterViewInit(): void {
    this.draw();
  }

  ngOnChanges(): void {
    if (this.canvasRef) {
      this.draw();
    }
  }

  private draw(): void {
    if (!this.data || this.data.length === 0) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Calculate scale
    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;
    const padding = 5;

    const stepX = (this.width - padding * 2) / (this.data.length - 1);
    const scaleY = (this.height - padding * 2) / range;

    // Create gradient for fill
    if (this.showFill) {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, `${this.color}40`);
      gradient.addColorStop(1, `${this.color}00`);

      ctx.beginPath();
      ctx.moveTo(padding, this.height - padding);

      this.data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = this.height - padding - (value - min) * scaleY;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(this.width - padding, this.height - padding);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = this.height - padding - (value - min) * scaleY;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }
}
