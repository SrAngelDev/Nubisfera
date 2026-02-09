import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  icon: string;
}

interface TimelineItem {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  icon: string;
}

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  icon: string;
  current: number;
}

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acerca-de.component.html',
  styleUrls: ['./acerca-de.component.css']
})
export class AcercaDeComponent implements OnInit, OnDestroy {
  private animationFrameId: number | null = null;
  private observer: IntersectionObserver | null = null;

  expandedFaq = signal<number | null>(null);
  statsAnimated = signal(false);

  stats: StatItem[] = [
    { label: 'Ciudades disponibles', value: 200000, suffix: '+', icon: '🌍', current: 0 },
    { label: 'Días de predicción', value: 16, suffix: '', icon: '📅', current: 0 },
    { label: 'Actualizaciones/hora', value: 4, suffix: '', icon: '🔄', current: 0 },
    { label: 'Código abierto', value: 100, suffix: '%', icon: '💚', current: 0 },
  ];

  features = [
    {
      icon: '🔍',
      title: 'Búsqueda Global',
      description: 'Busca cualquier ciudad del mundo con autocompletado inteligente y búsqueda por voz',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '🌡️',
      title: 'Predicción Detallada',
      description: 'Hasta 16 días de predicción con datos reales horarios, temperaturas, humedad y viento',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '📊',
      title: 'Dashboard Interactivo',
      description: 'Gráficos avanzados con Chart.js y D3.js para visualizar tendencias meteorológicas',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '🗺️',
      title: 'Mapa de España',
      description: 'Visualiza el tiempo en toda España con mapa SVG interactivo por comunidades y datos de Open-Meteo',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: '⚡',
      title: 'Rendimiento Óptimo',
      description: 'Sistema de caché inteligente, lazy loading y PWA para experiencia nativa',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: '🏆',
      title: 'Gamificación',
      description: 'Sistema de logros y recompensas que hace divertido consultar el tiempo',
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
    },
    {
      icon: '🎙️',
      title: 'Búsqueda por Voz',
      description: 'Usa tu voz para buscar ciudades con la Web Speech API integrada',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
      icon: '🌙',
      title: 'Tema Adaptativo',
      description: 'Modo oscuro y claro con detección automática del sistema operativo',
      gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
    }
  ];

  technologies = [
    { name: 'Angular 21', icon: '🅰️', color: '#DD0031' },
    { name: 'TypeScript 5.8', icon: '🔷', color: '#3178C6' },
    { name: 'RxJS 7.8', icon: '⚡', color: '#B7178C' },
    { name: 'Chart.js', icon: '📊', color: '#FF6384' },
    { name: 'D3.js', icon: '📈', color: '#F9A03C' },
    { name: 'Three.js', icon: '🎮', color: '#049EF4' },
    { name: 'GSAP', icon: '🎬', color: '#88CE02' },
    { name: 'Open-Meteo', icon: '🌤️', color: '#FF9500' },
    { name: 'PWA', icon: '📱', color: '#5A0FC8' },
    { name: 'Web Speech API', icon: '🎙️', color: '#4285F4' },
  ];

  timeline: TimelineItem[] = [
    {
      version: '2.0',
      date: 'Actual',
      title: 'Experiencia Completa',
      icon: '🚀',
      highlights: [
        'Dashboard meteorológico avanzado con D3.js',
        'Comparación de ciudades lado a lado',
        'Timeline interactivo del tiempo',
        'Sistema de gamificación con logros',
        'Mapa interactivo de España',
        'Fondo animado 3D con Three.js',
        'Predicción extendida hasta 16 días'
      ]
    },
    {
      version: '1.0',
      date: 'Inicio',
      title: 'Fundamentos',
      icon: '🌱',
      highlights: [
        'Búsqueda de ciudades global',
        'Predicción meteorológica con datos reales',
        'Diseño responsive dark mode',
        'Integración con Open-Meteo API',
        'Sistema de caché inteligente',
        'PWA con Service Worker'
      ]
    }
  ];

  faqs: FaqItem[] = [
    {
      icon: '🌐',
      question: '¿De dónde provienen los datos meteorológicos?',
      answer: 'Nubisfera utiliza exclusivamente la API de Open-Meteo, que agrega datos reales de los principales modelos meteorológicos del mundo (ECMWF, GFS, ICON, entre otros). Los datos son completamente reales y se actualizan cada 15 minutos, ofreciendo predicciones de hasta 16 días con una precisión que iguala o supera a muchos servicios nacionales.'
    },
    {
      icon: '💰',
      question: '¿Es gratuito?',
      answer: 'Sí, Nubisfera es completamente gratuito y de código abierto. No hay publicidad, suscripciones ni costes ocultos. El código fuente está disponible en GitHub bajo licencia open source.'
    },
    {
      icon: '📱',
      question: '¿Puedo instalarlo en mi móvil?',
      answer: 'Nubisfera es una Progressive Web App (PWA). Puedes instalarla desde el navegador usando "Añadir a pantalla de inicio" y funcionará como una aplicación nativa, incluso offline para datos previamente consultados.'
    },
    {
      icon: '🔒',
      question: '¿Se recopilan datos personales?',
      answer: 'No. Nubisfera no recopila ni almacena ningún dato personal. El historial de búsqueda se guarda exclusivamente en tu navegador mediante localStorage y nunca se envía a ningún servidor externo.'
    },
    {
      icon: '🎯',
      question: '¿Qué precisión tienen las predicciones?',
      answer: 'Open-Meteo utiliza los mejores modelos meteorológicos del mundo como ECMWF, GFS e ICON. La fiabilidad es muy alta para los próximos 5 días y sigue siendo buena hasta 16 días. Los datos son 100% reales y en muchos casos superan en detalle a los de servicios como AEMET.'
    }
  ];

  toggleFaq(index: number): void {
    this.expandedFaq.update(current => current === index ? null : index);
  }

  isFaqExpanded(index: number): boolean {
    return this.expandedFaq() === index;
  }

  ngOnInit(): void {
    this.setupStatsAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.observer?.disconnect();
  }

  private setupStatsAnimation(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.statsAnimated()) {
          this.statsAnimated.set(true);
          this.animateStats();
        }
      });
    }, { threshold: 0.3 });

    setTimeout(() => {
      const statsEl = document.querySelector('.stats-grid');
      if (statsEl) this.observer!.observe(statsEl);
    }, 100);
  }

  private animateStats(): void {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.stats = this.stats.map(stat => ({
        ...stat,
        current: Math.round(stat.value * eased)
      }));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return num.toLocaleString('es-ES');
    }
    return num.toString();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
