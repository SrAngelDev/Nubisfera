import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Animated Weather Icon Component
 * Iconos SVG animados para diferentes condiciones meteorológicas
 * Cada icono tiene animaciones CSS específicas
 */
@Component({
  selector: 'app-animated-weather-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weather-icon-animated" [attr.data-condition]="condition" [style.width.px]="size" [style.height.px]="size">
      @switch (condition) {
        @case ('sunny') {
          <svg viewBox="0 0 100 100" class="icon-sunny">
            <circle class="sun-core" cx="50" cy="50" r="20" fill="currentColor"/>
            <g class="sun-rays">
              @for (ray of [0,45,90,135,180,225,270,315]; track ray) {
                <line 
                  [attr.x1]="50 + Math.cos(ray * Math.PI / 180) * 30" 
                  [attr.y1]="50 + Math.sin(ray * Math.PI / 180) * 30"
                  [attr.x2]="50 + Math.cos(ray * Math.PI / 180) * 40" 
                  [attr.y2]="50 + Math.sin(ray * Math.PI / 180) * 40"
                  stroke="currentColor" 
                  stroke-width="3" 
                  stroke-linecap="round"
                />
              }
            </g>
          </svg>
        }
        @case ('cloudy') {
          <svg viewBox="0 0 100 100" class="icon-cloudy">
            <path class="cloud" d="M 25,50 Q 25,40 35,40 Q 35,30 45,30 Q 55,30 55,40 Q 65,40 65,50 Q 65,60 55,60 L 35,60 Q 25,60 25,50 Z" fill="currentColor"/>
            <path class="cloud cloud-2" d="M 35,60 Q 35,55 40,55 Q 40,50 47,50 Q 54,50 54,55 Q 59,55 59,60 Q 59,65 54,65 L 40,65 Q 35,65 35,60 Z" fill="currentColor" opacity="0.7"/>
          </svg>
        }
        @case ('rainy') {
          <svg viewBox="0 0 100 100" class="icon-rainy">
            <path class="cloud" d="M 25,35 Q 25,25 35,25 Q 35,15 45,15 Q 55,15 55,25 Q 65,25 65,35 Q 65,45 55,45 L 35,45 Q 25,45 25,35 Z" fill="currentColor"/>
            <g class="rain-drops">
              <line class="drop drop-1" x1="35" y1="50" x2="32" y2="65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line class="drop drop-2" x1="45" y1="50" x2="42" y2="65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line class="drop drop-3" x1="55" y1="50" x2="52" y2="65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </g>
          </svg>
        }
        @case ('stormy') {
          <svg viewBox="0 0 100 100" class="icon-stormy">
            <path class="cloud dark" d="M 25,30 Q 25,20 35,20 Q 35,10 45,10 Q 55,10 55,20 Q 65,20 65,30 Q 65,40 55,40 L 35,40 Q 25,40 25,30 Z" fill="currentColor"/>
            <path class="lightning" d="M 45,45 L 40,60 L 48,60 L 43,75" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        }
        @case ('snowy') {
          <svg viewBox="0 0 100 100" class="icon-snowy">
            <path class="cloud" d="M 25,30 Q 25,20 35,20 Q 35,10 45,10 Q 55,10 55,20 Q 65,20 65,30 Q 65,40 55,40 L 35,40 Q 25,40 25,30 Z" fill="currentColor"/>
            <g class="snowflakes">
              @for (flake of [{x:33,y:50},{x:45,y:55},{x:57,y:50}]; track flake.x) {
                <g [attr.transform]="'translate(' + flake.x + ',' + flake.y + ')'">
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="currentColor" stroke-width="1"/>
                  <line x1="-3" y1="3" x2="3" y2="-3" stroke="currentColor" stroke-width="1"/>
                </g>
              }
            </g>
          </svg>
        }
        @case ('windy') {
          <svg viewBox="0 0 100 100" class="icon-windy">
            <g class="wind-lines">
              <path class="wind-line wind-1" d="M 20,35 L 70,35 Q 75,35 75,40" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path class="wind-line wind-2" d="M 30,50 L 75,50" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path class="wind-line wind-3" d="M 25,65 L 65,65 Q 70,65 70,60" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </g>
          </svg>
        }
        @case ('partly-cloudy') {
          <svg viewBox="0 0 100 100" class="icon-partly-cloudy">
            <g class="sun-behind">
              <circle class="sun-core" cx="60" cy="30" r="12" fill="currentColor"/>
              <g class="sun-rays" opacity="0.6">
                @for (ray of [0,60,120,180,240,300]; track ray) {
                  <line 
                    [attr.x1]="60 + Math.cos(ray * Math.PI / 180) * 18" 
                    [attr.y1]="30 + Math.sin(ray * Math.PI / 180) * 18"
                    [attr.x2]="60 + Math.cos(ray * Math.PI / 180) * 24" 
                    [attr.y2]="30 + Math.sin(ray * Math.PI / 180) * 24"
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round"
                  />
                }
              </g>
            </g>
            <path class="cloud" d="M 25,55 Q 25,45 35,45 Q 35,35 45,35 Q 55,35 55,45 Q 65,45 65,55 Q 65,65 55,65 L 35,65 Q 25,65 25,55 Z" fill="currentColor"/>
          </svg>
        }
        @default {
          <svg viewBox="0 0 100 100" class="icon-default">
            <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.3"/>
          </svg>
        }
      }
    </div>
  `,
  styles: [`
    .weather-icon-animated {
      display: inline-block;
      color: currentColor;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Sunny Animation */
    .icon-sunny .sun-core {
      animation: pulse-sun 2s ease-in-out infinite;
    }

    .icon-sunny .sun-rays {
      transform-origin: 50% 50%;
      animation: rotate 20s linear infinite;
    }

    @keyframes pulse-sun {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    @keyframes rotate {
      to { transform: rotate(360deg); }
    }

    /* Cloudy Animation */
    .icon-cloudy .cloud {
      animation: float-cloud 4s ease-in-out infinite;
    }

    .icon-cloudy .cloud-2 {
      animation: float-cloud 4s ease-in-out infinite 0.5s;
    }

    @keyframes float-cloud {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(5px); }
    }

    /* Rainy Animation */
    .icon-rainy .drop {
      animation: rain-fall 1s ease-in infinite;
    }

    .icon-rainy .drop-1 { animation-delay: 0s; }
    .icon-rainy .drop-2 { animation-delay: 0.3s; }
    .icon-rainy .drop-3 { animation-delay: 0.6s; }

    @keyframes rain-fall {
      0% { opacity: 0; transform: translateY(0); }
      50% { opacity: 1; }
      100% { opacity: 0; transform: translateY(8px); }
    }

    /* Stormy Animation */
    .icon-stormy .lightning {
      animation: flash 2s ease-in-out infinite;
    }

    @keyframes flash {
      0%, 45%, 55%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }

    /* Snowy Animation */
    .icon-snowy .snowflakes g {
      animation: snow-fall 3s ease-in-out infinite;
    }

    .icon-snowy .snowflakes g:nth-child(1) { animation-delay: 0s; }
    .icon-snowy .snowflakes g:nth-child(2) { animation-delay: 1s; }
    .icon-snowy .snowflakes g:nth-child(3) { animation-delay: 2s; }

    @keyframes snow-fall {
      0% { opacity: 0; transform: translateY(0); }
      50% { opacity: 1; }
      100% { opacity: 0; transform: translateY(20px); }
    }

    /* Windy Animation */
    .icon-windy .wind-line {
      animation: wind-blow 2s ease-in-out infinite;
    }

    .icon-windy .wind-1 { animation-delay: 0s; }
    .icon-windy .wind-2 { animation-delay: 0.3s; }
    .icon-windy .wind-3 { animation-delay: 0.6s; }

    @keyframes wind-blow {
      0%, 100% { opacity: 0.3; transform: translateX(0); }
      50% { opacity: 1; transform: translateX(5px); }
    }

    /* Partly Cloudy Animation */
    .icon-partly-cloudy .sun-rays {
      transform-origin: 60px 30px;
      animation: rotate 15s linear infinite;
    }

    .icon-partly-cloudy .cloud {
      animation: float-cloud 3s ease-in-out infinite;
    }

    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .weather-icon-animated * {
        animation: none !important;
      }
    }
  `]
})
export class AnimatedWeatherIconComponent {
  @Input() condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'partly-cloudy' = 'sunny';
  @Input() size = 64;

  // Expose Math for template
  Math = Math;
}
