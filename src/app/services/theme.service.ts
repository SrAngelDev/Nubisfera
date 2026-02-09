import { Injectable, signal, effect, computed, OnDestroy } from '@angular/core';
import { ThemeMode } from '../models/theme.model';

const STORAGE_KEY = 'nubisfera-theme';
const TRANSITION_DURATION = 300;

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {

  /** Modo elegido por el usuario: 'light' | 'dark' | 'auto' */
  readonly mode = signal<ThemeMode>(this.loadSavedMode());

  /** Tema efectivo resuelto (nunca 'auto') */
  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const m = this.mode();
    if (m === 'auto') return this.systemPreference();
    return m;
  });

  /** Preferencia del SO detectada */
  readonly systemPreference = signal<'light' | 'dark'>(this.detectSystemPreference());

  /** Indica si está en modo oscuro */
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = (e: MediaQueryListEvent) => {
    this.systemPreference.set(e.matches ? 'dark' : 'light');
  };

  constructor() {
    // Escuchar cambios del SO
    this.mediaQuery.addEventListener('change', this.mediaListener);

    // Efecto reactivo: aplica la clase al <html> cada vez que cambia el tema
    effect(() => {
      const theme = this.resolvedTheme();
      this.applyTheme(theme);
    });
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
  }

  /** Cicla entre: dark → light → auto → dark ... */
  cycle(): void {
    const order: ThemeMode[] = ['dark', 'light', 'auto'];
    const idx = order.indexOf(this.mode());
    this.setMode(order[(idx + 1) % order.length]);
  }

  /** Establece el modo manualmente */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  /** Toggle rápido entre claro y oscuro (ignora auto) */
  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  // ── Privados ────────────────────────────────────────

  private loadSavedMode(): ThemeMode {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) return saved;
    return 'auto'; // por defecto seguir preferencia del SO
  }

  private detectSystemPreference(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;

    // Activar transición suave
    root.classList.add('theme-transitioning');

    if (theme === 'light') {
      root.classList.add('light-mode', 'light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.remove('light-mode', 'light-theme');
      root.classList.add('dark-theme');
    }

    // Quitar clase de transición después de la animación
    setTimeout(() => root.classList.remove('theme-transitioning'), TRANSITION_DURATION);
  }
}
