import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

/**
 * Weather Orb Component
 * Orbe 3D interactivo que muestra el estado del clima de forma visual
 * Usa Three.js para renderizado 3D con efectos glassmorphism
 */
@Component({
  selector: 'app-weather-orb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weather-orb-container">
      <canvas #orbCanvas class="orb-canvas"></canvas>
      
      @if (weatherCondition()) {
        <div class="orb-overlay">
          <div class="orb-info animate-fade-in">
            <div class="weather-icon">{{ getWeatherEmoji(weatherCondition()!) }}</div>
            @if (temperature()) {
              <div class="temperature-display">
                <span class="temp-value">{{ temperature() }}</span>
                <span class="temp-unit">°C</span>
              </div>
            }
            <div class="condition-text">{{ getWeatherText(weatherCondition()!) }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .weather-orb-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: var(--radius-2xl);
    }

    .orb-canvas {
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
    }

    .orb-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: var(--z-base);
      pointer-events: none;
    }

    .orb-info {
      text-align: center;
      color: var(--text-primary);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .weather-icon {
      font-size: clamp(3rem, 8vw, 5rem);
      margin-bottom: var(--space-4);
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
    }

    .temperature-display {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: var(--space-1);
      margin-bottom: var(--space-2);
    }

    .temp-value {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 700;
      line-height: 1;
      background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .temp-unit {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 500;
      opacity: 0.7;
    }

    .condition-text {
      font-size: var(--text-lg);
      font-weight: 500;
      opacity: 0.9;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .weather-orb-container {
        min-height: 300px;
      }
    }
  `]
})
export class WeatherOrbComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('orbCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Inputs
  weatherCondition = input<string>(); // 'sunny', 'cloudy', 'rainy', 'stormy', 'snowy'
  temperature = input<number>();
  
  // Three.js variables
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private orb!: THREE.Mesh;
  private particles!: THREE.Points;
  private animationId!: number;
  private mouseX = 0;
  private mouseY = 0;

  constructor() {
    // Effect para reaccionar a cambios en el clima
    effect(() => {
      const condition = this.weatherCondition();
      if (condition && this.orb) {
        this.updateOrbAppearance(condition);
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createOrb();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || 400;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0e1a, 10, 50);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
  }

  private createOrb(): void {
    // Geometría esférica con alta calidad
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    
    // Material glassmorphism con reflexiones
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x2E4DEE,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8,
      transmission: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.5,
      thickness: 0.5,
      envMapIntensity: 1
    });

    this.orb = new THREE.Mesh(geometry, material);
    this.scene.add(this.orb);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x2E4DEE, 1, 100);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x5DDFFF, 0.5, 100);
    pointLight2.position.set(-5, -5, 5);
    this.scene.add(pointLight2);
  }

  private createParticles(): void {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x5DDFFF,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onWindowResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || 400;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onMouseMove = (event: MouseEvent): void => {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Rotación automática del orbe
    if (this.orb) {
      this.orb.rotation.y += 0.002;
      this.orb.rotation.x += 0.001;

      // Seguimiento suave del mouse
      this.orb.rotation.x += (this.mouseY * 0.1 - this.orb.rotation.x) * 0.05;
      this.orb.rotation.y += (this.mouseX * 0.1 - this.orb.rotation.y) * 0.05;
    }

    // Movimiento de partículas
    if (this.particles) {
      this.particles.rotation.y += 0.0005;
      this.particles.rotation.x += 0.0003;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateOrbAppearance(condition: string): void {
    if (!this.orb) return;

    const material = this.orb.material as THREE.MeshPhysicalMaterial;
    
    // Cambiar color según clima
    switch (condition) {
      case 'sunny':
      case 'despejado':
        material.color.setHex(0xffd97d);
        break;
      case 'cloudy':
      case 'nublado':
        material.color.setHex(0x9ca3af);
        break;
      case 'rainy':
      case 'lluvia':
        material.color.setHex(0x6495ed);
        break;
      case 'stormy':
      case 'tormenta':
        material.color.setHex(0x4169b8);
        break;
      case 'snowy':
      case 'nieve':
        material.color.setHex(0xe0e7ff);
        break;
      default:
        material.color.setHex(0x6495ed);
    }
  }

  protected getWeatherEmoji(condition: string): string {
    const emojis: Record<string, string> = {
      'sunny': '☀️',
      'despejado': '☀️',
      'cloudy': '☁️',
      'nublado': '☁️',
      'rainy': '🌧️',
      'lluvia': '🌧️',
      'stormy': '⛈️',
      'tormenta': '⛈️',
      'snowy': '❄️',
      'nieve': '❄️'
    };
    return emojis[condition.toLowerCase()] || '🌤️';
  }

  protected getWeatherText(condition: string): string {
    const texts: Record<string, string> = {
      'sunny': 'Despejado',
      'despejado': 'Despejado',
      'cloudy': 'Nublado',
      'nublado': 'Nublado',
      'rainy': 'Lluvia',
      'lluvia': 'Lluvia',
      'stormy': 'Tormenta',
      'tormenta': 'Tormenta',
      'snowy': 'Nieve',
      'nieve': 'Nieve'
    };
    return texts[condition.toLowerCase()] || 'Clima Variable';
  }
}
