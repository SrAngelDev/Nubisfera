import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import confetti from 'canvas-confetti';
import {
  Achievement,
  AchievementType,
  UserStats,
  GamificationEvent,
  GamificationNotification,
  LevelConfig,
  ActionReward
} from '../models/gamification.model';

/**
 * Servicio de gamificación
 * Maneja logros, puntos, niveles y estadísticas del usuario
 */
@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private readonly STORAGE_KEY_STATS = 'nubisfera-user-stats';
  private readonly STORAGE_KEY_ACHIEVEMENTS = 'nubisfera-achievements';
  private readonly STORAGE_KEY_EVENTS = 'nubisfera-events';
  private readonly STORAGE_KEY_RATE_LIMITS = 'nubisfera-rate-limits';

  // Rate limiting: tracks cooldowns and daily action counts
  private rateLimits: Record<string, { lastTimestamp: number; dailyDate: string; dailyCount: number }> = {};

  // Estado reactivo
  private statsSubject: BehaviorSubject<UserStats>;
  private achievementsSubject: BehaviorSubject<Achievement[]>;
  private eventsSubject = new BehaviorSubject<GamificationEvent[]>([]);
  private notificationsSubject = new BehaviorSubject<GamificationNotification[]>([]);

  public stats$: Observable<UserStats>;
  public achievements$: Observable<Achievement[]>;
  public events$ = this.eventsSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();

  // Señales
  public currentLevel = signal(1);
  public currentPoints = signal(0);
  public currentStreak = signal(0);
  public unlockedAchievementsCount = signal(0);

  // Configuración de niveles
  private levels: LevelConfig[] = [
    { level: 1, minPoints: 0, maxPoints: 100, title: 'Novato', icon: 'fas fa-seedling', color: '#94a3b8' },
    { level: 2, minPoints: 100, maxPoints: 250, title: 'Aprendiz', icon: 'fas fa-user', color: '#6b7280' },
    { level: 3, minPoints: 250, maxPoints: 500, title: 'Explorador', icon: 'fas fa-compass', color: '#3b82f6' },
    { level: 4, minPoints: 500, maxPoints: 1000, title: 'Experto', icon: 'fas fa-star', color: '#8b5cf6' },
    { level: 5, minPoints: 1000, maxPoints: 2000, title: 'Maestro', icon: 'fas fa-crown', color: '#f59e0b' },
    { level: 6, minPoints: 2000, maxPoints: Infinity, title: 'Leyenda', icon: 'fas fa-trophy', color: '#ef4444' }
  ];

  // Recompensas por acción
  private actionRewards: ActionReward[] = [
    { action: 'visit_app', points: 5, description: 'Visitar la aplicación', cooldown: 60, maxDaily: 10 },
    { action: 'check_weather', points: 10, description: 'Consultar el tiempo', cooldown: 30, maxDaily: 20 },
    { action: 'use_map', points: 15, description: 'Usar el mapa 3D', cooldown: 15, maxDaily: 10 },
    { action: 'use_timeline', points: 20, description: 'Reproducir timeline', cooldown: 20, maxDaily: 5 },
    { action: 'compare_cities', points: 15, description: 'Comparar ciudades', cooldown: 10, maxDaily: 10 },
    { action: 'switch_theme', points: 5, description: 'Cambiar tema', maxDaily: 5 }
  ];

  // Definiciones de logros
  private achievementDefinitions: Achievement[] = [
    {
      id: 'first_visit',
      type: 'first_visit',
      category: 'general',
      rarity: 'common',
      name: 'Primera Visita',
      description: 'Visita Nubisfera por primera vez',
      icon: 'fas fa-door-open',
      points: 50,
      isUnlocked: false,
      color: '#3b82f6',
      hint: 'Abre la aplicación'
    },
    {
      id: 'weather_checker',
      type: 'weather_check',
      category: 'exploration',
      rarity: 'common',
      name: 'Observador del Clima',
      description: 'Consulta el tiempo 10 veces',
      icon: 'fas fa-cloud-sun',
      points: 100,
      isUnlocked: false,
      progress: 0,
      maxProgress: 10,
      color: '#fbbf24',
      hint: 'Consulta el tiempo varias veces'
    },
    {
      id: 'map_explorer',
      type: 'map_explorer',
      category: 'exploration',
      rarity: 'uncommon',
      name: 'Explorador de Mapas',
      description: 'Usa el mapa 3D 5 veces',
      icon: 'fas fa-map-marked-alt',
      points: 150,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5,
      color: '#10b981',
      hint: 'Explora el mapa interactivo'
    },
    {
      id: 'timeline_master',
      type: 'timeline_master',
      category: 'analysis',
      rarity: 'rare',
      name: 'Maestro del Tiempo',
      description: 'Reproduce el timeline completo 3 veces',
      icon: 'fas fa-history',
      points: 200,
      isUnlocked: false,
      progress: 0,
      maxProgress: 3,
      color: '#8b5cf6',
      hint: 'Usa el timeline interactivo'
    },
    {
      id: 'comparison_guru',
      type: 'comparison_guru',
      category: 'analysis',
      rarity: 'rare',
      name: 'Gurú de Comparaciones',
      description: 'Compara 20 ciudades diferentes',
      icon: 'fas fa-balance-scale',
      points: 250,
      isUnlocked: false,
      progress: 0,
      maxProgress: 20,
      color: '#06b6d4',
      hint: 'Compara múltiples ciudades'
    },
    {
      id: 'streak_7',
      type: 'streak_keeper',
      category: 'special',
      rarity: 'epic',
      name: 'Racha de Fuego 🔥',
      description: 'Visita la app 7 días seguidos',
      icon: 'fas fa-fire',
      points: 500,
      isUnlocked: false,
      progress: 0,
      maxProgress: 7,
      color: '#f97316',
      hint: 'Visita todos los días durante una semana'
    },
    {
      id: 'night_owl',
      type: 'night_owl',
      category: 'special',
      rarity: 'uncommon',
      name: 'Búho Nocturno',
      description: 'Usa la app entre las 00:00 y 05:00',
      icon: 'fas fa-moon',
      points: 100,
      isUnlocked: false,
      color: '#6366f1',
      hint: 'Consulta el tiempo de madrugada'
    },
    {
      id: 'early_bird',
      type: 'early_bird',
      category: 'special',
      rarity: 'uncommon',
      name: 'Madrugador',
      description: 'Usa la app antes de las 06:00',
      icon: 'fas fa-sun',
      points: 100,
      isUnlocked: false,
      color: '#fbbf24',
      hint: 'Consulta el tiempo muy temprano'
    },
    {
      id: 'data_analyst',
      type: 'data_analyst',
      category: 'analysis',
      rarity: 'legendary',
      name: 'Analista de Datos',
      description: 'Usa todas las funcionalidades (mapa, timeline, comparación)',
      icon: 'fas fa-chart-line',
      points: 1000,
      isUnlocked: false,
      color: '#ec4899',
      hint: 'Explora todas las herramientas'
    },
    {
      id: 'theme_master',
      type: 'theme_switcher',
      category: 'general',
      rarity: 'common',
      name: 'Maestro de Temas',
      description: 'Cambia entre temas claro y oscuro 5 veces',
      icon: 'fas fa-palette',
      points: 50,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5,
      color: '#a855f7',
      hint: 'Prueba diferentes temas'
    }
  ];

  constructor() {
    // Inicializar estado por defecto
    const defaultStats: UserStats = {
      totalVisits: 0,
      firstVisitDate: new Date(),
      lastVisitDate: new Date(),
      currentStreak: 0,
      longestStreak: 0,
      weatherChecks: 0,
      mapViewCount: 0,
      timelinePlaybacks: 0,
      citiesCompared: 0,
      totalTimeSpent: 0,
      avgSessionDuration: 0,
      totalPoints: 0,
      level: 1,
      pointsToNextLevel: 100,
      achievementsUnlocked: 0,
      achievementsTotal: this.achievementDefinitions.length
    };

    this.statsSubject = new BehaviorSubject(defaultStats);
    this.stats$ = this.statsSubject.asObservable();

    this.achievementsSubject = new BehaviorSubject([...this.achievementDefinitions]);
    this.achievements$ = this.achievementsSubject.asObservable();

    this.loadData();
    this.initializeSession();
  }

  /**
   * Carga datos guardados
   */
  private loadData(): void {
    try {
      // Cargar estadísticas
      const statsStr = localStorage.getItem(this.STORAGE_KEY_STATS);
      if (statsStr) {
        const stats = JSON.parse(statsStr);
        stats.firstVisitDate = new Date(stats.firstVisitDate);
        stats.lastVisitDate = new Date(stats.lastVisitDate);
        if (stats.lastCheckDate) stats.lastCheckDate = new Date(stats.lastCheckDate);
        // Siempre sincronizar el total de logros con las definiciones actuales
        stats.achievementsTotal = this.achievementDefinitions.length;
        this.statsSubject.next(stats);
        this.updateSignals();
      }

      // Cargar logros y MERGE con definiciones (para nuevos logros añadidos al código)
      const achievementsStr = localStorage.getItem(this.STORAGE_KEY_ACHIEVEMENTS);
      if (achievementsStr) {
        const saved: Achievement[] = JSON.parse(achievementsStr);
        saved.forEach(a => {
          if (a.unlockedAt) a.unlockedAt = new Date(a.unlockedAt);
        });

        // Merge: mantener progreso guardado, añadir nuevos logros faltantes
        const merged = this.achievementDefinitions.map(def => {
          const savedAch = saved.find(s => s.id === def.id);
          if (savedAch) {
            // Preservar progreso y estado desbloqueado, pero actualizar metadatos
            return {
              ...def,
              isUnlocked: savedAch.isUnlocked,
              unlockedAt: savedAch.unlockedAt,
              progress: savedAch.progress ?? def.progress
            };
          }
          return { ...def }; // Nuevo logro: usar definición por defecto
        });

        // Recalcular achievementsUnlocked basado en datos reales
        const stats = this.statsSubject.value;
        stats.achievementsUnlocked = merged.filter(a => a.isUnlocked).length;
        this.statsSubject.next(stats);
        this.unlockedAchievementsCount.set(stats.achievementsUnlocked);

        this.achievementsSubject.next(merged);
      }

      // Cargar eventos
      const eventsStr = localStorage.getItem(this.STORAGE_KEY_EVENTS);
      if (eventsStr) {
        const events: GamificationEvent[] = JSON.parse(eventsStr);
        events.forEach(e => e.timestamp = new Date(e.timestamp));
        this.eventsSubject.next(events);
      }

      // Cargar rate limits
      const rateLimitsStr = localStorage.getItem(this.STORAGE_KEY_RATE_LIMITS);
      if (rateLimitsStr) {
        this.rateLimits = JSON.parse(rateLimitsStr);
      }
    } catch (error) {
      console.warn('Error loading gamification data:', error);
    }
  }

  /**
   * Guarda datos
   */
  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_STATS, JSON.stringify(this.statsSubject.value));
      localStorage.setItem(this.STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(this.achievementsSubject.value));
      localStorage.setItem(this.STORAGE_KEY_EVENTS, JSON.stringify(this.eventsSubject.value));
      localStorage.setItem(this.STORAGE_KEY_RATE_LIMITS, JSON.stringify(this.rateLimits));
    } catch (error) {
      console.warn('Error saving gamification data:', error);
    }
  }

  /**
   * Actualiza las señales con los valores actuales
   */
  private updateSignals(): void {
    const stats = this.statsSubject.value;
    this.currentLevel.set(stats.level);
    this.currentPoints.set(stats.totalPoints);
    this.currentStreak.set(stats.currentStreak);
    this.unlockedAchievementsCount.set(stats.achievementsUnlocked);
  }

  /**
   * Inicializa la sesión actual
   */
  private initializeSession(): void {
    const stats = this.statsSubject.value;
    
    // Incrementar visitas
    stats.totalVisits++;
    stats.lastVisitDate = new Date();
    
    // Actualizar racha
    this.updateStreak();
    
    // Desbloquear logro de primera visita
    if (stats.totalVisits === 1) {
      this.unlockAchievement('first_visit');
    }
    
    // Verificar logros de hora
    this.checkTimeBasedAchievements();
    
    this.statsSubject.next(stats);
    this.saveData();
  }

  /**
   * Obtiene la fecha como string YYYY-MM-DD para comparar días calendario
   */
  private getCalendarDay(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Calcula la diferencia en días calendario entre dos fechas
   */
  private calendarDaysDiff(a: Date, b: Date): number {
    const dateA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const dateB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Actualiza la racha de días consecutivos
   */
  private updateStreak(): void {
    const stats = this.statsSubject.value;
    const now = new Date();
    const lastCheck = stats.lastCheckDate;
    
    if (!lastCheck) {
      // Primera visita: iniciar racha en 1
      stats.currentStreak = 1;
      stats.longestStreak = Math.max(stats.longestStreak, 1);
    } else {
      const daysDiff = this.calendarDaysDiff(lastCheck, now);
      
      if (daysDiff === 1) {
        // Día consecutivo
        stats.currentStreak++;
        stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      } else if (daysDiff > 1) {
        // Racha rota
        stats.currentStreak = 1;
      }
      // daysDiff === 0: mismo día, no cambiar racha
    }

    // Verificar logro de racha
    if (stats.currentStreak >= 7) {
      this.unlockAchievement('streak_7');
    }
    
    // Actualizar progreso del logro de racha
    const achievements = this.achievementsSubject.value;
    const streakAch = achievements.find(a => a.id === 'streak_7');
    if (streakAch && !streakAch.isUnlocked) {
      streakAch.progress = Math.min(stats.currentStreak, streakAch.maxProgress || 7);
      this.achievementsSubject.next(achievements);
    }
    
    stats.lastCheckDate = now;
    this.currentStreak.set(stats.currentStreak);
  }

  /**
   * Verifica logros basados en la hora
   */
  private checkTimeBasedAchievements(): void {
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 5) {
      this.unlockAchievement('night_owl');
    } else if (hour >= 5 && hour < 6) {
      this.unlockAchievement('early_bird');
    }
  }

  /**
   * Verifica si una acción puede otorgar puntos según cooldown y límite diario
   */
  private canAwardPoints(action: string, reward: ActionReward): boolean {
    const now = Date.now();
    const today = this.getCalendarDay(new Date());
    const limit = this.rateLimits[action];

    if (limit) {
      // Verificar cooldown (en minutos)
      if (reward.cooldown && reward.cooldown > 0) {
        const cooldownMs = reward.cooldown * 60 * 1000;
        if (now - limit.lastTimestamp < cooldownMs) {
          return false;
        }
      }

      // Verificar límite diario
      if (reward.maxDaily && reward.maxDaily > 0) {
        if (limit.dailyDate === today && limit.dailyCount >= reward.maxDaily) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Registra que una acción fue ejecutada para rate limiting
   */
  private recordAction(action: string): void {
    const now = Date.now();
    const today = this.getCalendarDay(new Date());
    const limit = this.rateLimits[action];

    if (limit && limit.dailyDate === today) {
      limit.lastTimestamp = now;
      limit.dailyCount++;
    } else {
      this.rateLimits[action] = {
        lastTimestamp: now,
        dailyDate: today,
        dailyCount: 1
      };
    }
  }

  /**
   * Otorga puntos por una acción (respeta cooldown y límite diario)
   */
  awardPoints(action: string, multiplier: number = 1): void {
    const reward = this.actionRewards.find(r => r.action === action);
    if (!reward) return;

    // Verificar rate limits
    if (!this.canAwardPoints(action, reward)) return;

    // Registrar acción para rate limiting
    this.recordAction(action);

    const points = Math.floor(reward.points * multiplier);
    const stats = this.statsSubject.value;
    
    stats.totalPoints += points;
    
    // Verificar si sube de nivel
    const oldLevel = stats.level;
    this.updateLevel();
    const newLevel = stats.level;
    
    if (newLevel > oldLevel) {
      this.showNotification({
        id: `level_${newLevel}_${Date.now()}`,
        type: 'level',
        title: '¡Nivel Superior!',
        message: `Has alcanzado el nivel ${newLevel}: ${this.getLevelTitle(newLevel)}`,
        icon: 'fas fa-level-up-alt',
        color: '#10b981',
        timestamp: new Date(),
        duration: 5000,
        showConfetti: true
      });
    } else if (points > 0) {
      this.showNotification({
        id: `points_${Date.now()}`,
        type: 'points',
        title: 'Puntos Ganados',
        message: `+${points} puntos`,
        icon: 'fas fa-star',
        color: '#fbbf24',
        timestamp: new Date(),
        duration: 2000,
        showConfetti: false
      });
    }
    
    this.statsSubject.next(stats);
    this.currentPoints.set(stats.totalPoints);
    this.saveData();
  }

  /**
   * Actualiza el nivel basado en puntos
   */
  private updateLevel(): void {
    const stats = this.statsSubject.value;
    
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const levelConfig = this.levels[i];
      if (stats.totalPoints >= levelConfig.minPoints) {
        stats.level = levelConfig.level;
        
        // Calcular puntos para el siguiente nivel
        if (i < this.levels.length - 1) {
          stats.pointsToNextLevel = this.levels[i + 1].minPoints - stats.totalPoints;
        } else {
          stats.pointsToNextLevel = 0; // Nivel máximo
        }
        
        break;
      }
    }
    
    this.currentLevel.set(stats.level);
  }

  /**
   * Desbloquea un logro
   */
  unlockAchievement(achievementId: string): boolean {
    const achievements = this.achievementsSubject.value;
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.isUnlocked) return false;
    
    achievement.isUnlocked = true;
    achievement.unlockedAt = new Date();
    
    // Actualizar estadísticas
    const stats = this.statsSubject.value;
    stats.achievementsUnlocked++;
    stats.totalPoints += achievement.points;
    
    // Crear evento
    const event: GamificationEvent = {
      id: `achievement_${achievementId}_${Date.now()}`,
      type: 'achievement_unlocked',
      timestamp: new Date(),
      data: { achievement, points: achievement.points },
      seen: false
    };
    
    const events = this.eventsSubject.value;
    events.unshift(event);
    this.eventsSubject.next(events);
    
    // Mostrar notificación
    this.showNotification({
      id: `notif_${achievementId}_${Date.now()}`,
      type: 'achievement',
      title: '¡Logro Desbloqueado!',
      message: `${achievement.name}: ${achievement.description}`,
      icon: achievement.icon,
      color: achievement.color,
      timestamp: new Date(),
      duration: 5000,
      showConfetti: ['rare', 'epic', 'legendary'].includes(achievement.rarity)
    });
    
    // Actualizar nivel
    this.updateLevel();
    
    this.achievementsSubject.next(achievements);
    this.statsSubject.next(stats);
    this.unlockedAchievementsCount.set(stats.achievementsUnlocked);
    this.saveData();
    
    return true;
  }

  /**
   * Actualiza el progreso de un logro
   */
  updateAchievementProgress(achievementId: string, increment: number = 1): void {
    const achievements = this.achievementsSubject.value;
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.isUnlocked || !achievement.maxProgress) return;
    
    achievement.progress = (achievement.progress || 0) + increment;
    
    if (achievement.progress >= achievement.maxProgress) {
      this.unlockAchievement(achievementId);
    } else {
      this.achievementsSubject.next(achievements);
      this.saveData();
    }
  }

  /**
   * Muestra una notificación de gamificación
   */
  private showNotification(notification: GamificationNotification): void {
    const notifications = this.notificationsSubject.value;
    notifications.push(notification);
    this.notificationsSubject.next(notifications);
    
    // Lanzar confetti si es necesario
    if (notification.showConfetti) {
      this.launchConfetti();
    }
    
    // Auto-remover después de duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
  }

  /**
   * Remueve una notificación
   */
  removeNotification(id: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(notifications);
  }

  /**
   * Lanza confetti
   */
  private launchConfetti(): void {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6495ed', '#87ceeb', '#fbbf24', '#f59e0b']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6495ed', '#87ceeb', '#fbbf24', '#f59e0b']
      });
    }, 100);
  }

  /**
   * Registra una acción del usuario
   */
  trackAction(action: string): void {
    const stats = this.statsSubject.value;
    
    switch (action) {
      case 'check_weather':
        stats.weatherChecks++;
        this.updateAchievementProgress('weather_checker');
        this.awardPoints(action);
        break;
      
      case 'use_map':
        stats.mapViewCount++;
        this.updateAchievementProgress('map_explorer');
        this.awardPoints(action);
        break;
      
      case 'use_timeline':
        stats.timelinePlaybacks++;
        this.updateAchievementProgress('timeline_master');
        this.awardPoints(action);
        break;
      
      case 'compare_cities':
        stats.citiesCompared++;
        this.updateAchievementProgress('comparison_guru');
        this.awardPoints(action);
        break;
      
      case 'switch_theme':
        this.updateAchievementProgress('theme_master');
        this.awardPoints(action);
        break;
    }
    
    // Verificar logro de analista (solo si no está desbloqueado)
    const dataAnalyst = this.achievementsSubject.value.find(a => a.id === 'data_analyst');
    if (dataAnalyst && !dataAnalyst.isUnlocked &&
        stats.mapViewCount > 0 && stats.timelinePlaybacks > 0 && stats.citiesCompared > 0) {
      this.unlockAchievement('data_analyst');
    }
    
    this.statsSubject.next(stats);
    this.saveData();
  }

  /**
   * Obtiene el título de un nivel
   */
  getLevelTitle(level: number): string {
    const config = this.levels.find(l => l.level === level);
    return config?.title || 'Desconocido';
  }

  /**
   * Obtiene la configuración de un nivel
   */
  getLevelConfig(level: number): LevelConfig | undefined {
    return this.levels.find(l => l.level === level);
  }

  /**
   * Obtiene todas las configuraciones de nivel
   */
  getAllLevels(): LevelConfig[] {
    return this.levels;
  }

  /**
   * Obtiene estadísticas actuales
   */
  getStats(): UserStats {
    return this.statsSubject.value;
  }

  /**
   * Obtiene logros actuales
   */
  getAchievements(): Achievement[] {
    return this.achievementsSubject.value;
  }

  /**
   * Reinicia todos los datos (para testing)
   */
  resetAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY_STATS);
    localStorage.removeItem(this.STORAGE_KEY_ACHIEVEMENTS);
    localStorage.removeItem(this.STORAGE_KEY_EVENTS);
    localStorage.removeItem(this.STORAGE_KEY_RATE_LIMITS);
    window.location.reload();
  }
}
