import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

/**
 * Animated Background Component
 * Fondo dinámico con partículas flotantes o mesh gradient animado
 * Responde a la hora del día y condiciones meteorológicas
 */
@Component({
  selector: 'app-animated-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animated-background" [attr.data-style]="style()">
      <canvas #bgCanvas class="bg-canvas"></canvas>
      
      @if (style() === 'mesh-gradient') {
        <div class="mesh-gradient-overlay">
          <div class="gradient-blob blob-1"></div>
          <div class="gradient-blob blob-2"></div>
          <div class="gradient-blob blob-3"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animated-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      background: var(--background-dark);
    }

    .bg-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Mesh Gradient Style */
    .mesh-gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      filter: blur(60px);
      opacity: 0.5;
    }

    .gradient-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      mix-blend-mode: screen;
      animation: float-blob 20s ease-in-out infinite;
    }

    .blob-1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(46, 77, 238, 0.4) 0%, transparent 70%);
      top: -10%;
      left: -10%;
      animation-delay: 0s;
    }

    .blob-2 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(93, 223, 255, 0.3) 0%, transparent 70%);
      top: 30%;
      right: -15%;
      animation-delay: -7s;
    }

    .blob-3 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(77, 212, 232, 0.3) 0%, transparent 70%);
      bottom: -10%;
      left: 40%;
      animation-delay: -14s;
    }

    @keyframes float-blob {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      25% {
        transform: translate(30px, -50px) scale(1.1);
      }
      50% {
        transform: translate(-20px, -30px) scale(0.9);
      }
      75% {
        transform: translate(20px, 20px) scale(1.05);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .gradient-blob {
        filter: blur(30px);
      }
      
      .blob-1 { width: 300px; height: 300px; }
      .blob-2 { width: 350px; height: 350px; }
      .blob-3 { width: 250px; height: 250px; }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .gradient-blob {
        animation: none;
      }
    }
  `]
})
export class AnimatedBackgroundComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private themeService = inject(ThemeService);

  // Inputs
  style = input<'particles' | 'mesh-gradient'>('particles');
  timeOfDay = input<'day' | 'night' | 'sunset'>('night');

  // Canvas variables
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId!: number;
  private width = 0;
  private height = 0;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.style() === 'particles') {
      this.initCanvas();
      this.createParticles();
      this.animate();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private createParticles(): void {
    const particleCount = Math.floor((this.width * this.height) / 15000);
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(this.width, this.height));
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Clear con fade para trail effect
    this.ctx.fillStyle = this.themeService.isDark() ? 'rgba(10, 14, 26, 0.05)' : 'rgba(240, 244, 255, 0.08)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update y draw particles
    this.particles.forEach(particle => {
      particle.update();
      particle.draw(this.ctx);

      // Respawn si sale de la pantalla
      if (particle.y > this.height + 10) {
        particle.reset(this.width, this.height);
      }
    });
  };
}

/**
 * Clase Particle para el sistema de partículas
 */
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = Math.random() * 0.5 + 0.2;
    this.size = Math.random() * 2 + 1;
    this.opacity = Math.random() * 0.5 + 0.2;
    
    // Colores según tema
    const colors = ['#2E4DEE', '#3B5BFF', '#5DDFFF', '#87CEEB'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    
    // Efecto de flotación suave
    this.vx += (Math.random() - 0.5) * 0.01;
    this.vy += (Math.random() - 0.5) * 0.01;
    
    // Límites de velocidad
    this.vx = Math.max(-1, Math.min(1, this.vx));
    this.vy = Math.max(0.1, Math.min(1.5, this.vy));
    
    // Pulsación de opacidad
    this.opacity += (Math.random() - 0.5) * 0.02;
    this.opacity = Math.max(0.1, Math.min(0.7, this.opacity));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  reset(width: number, height: number): void {
    this.x = Math.random() * width;
    this.y = -10;
    this.vy = Math.random() * 0.5 + 0.2;
  }
}
