/**
 * Modelos para el Sistema de Gamificación
 */

/**
 * Tipos de logros/achievements
 */
export type AchievementType = 
  | 'first_visit'
  | 'weather_check'
  | 'map_explorer'
  | 'timeline_master'
  | 'comparison_guru'
  | 'streak_keeper'
  | 'night_owl'
  | 'early_bird'
  | 'data_analyst'
  | 'theme_switcher';

/**
 * Categorías de logros
 */
export type AchievementCategory = 
  | 'general'
  | 'exploration'
  | 'analysis'
  | 'social'
  | 'special';

/**
 * Rareza de logros
 */
export type AchievementRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

/**
 * Definición de un logro
 */
export interface Achievement {
  id: string;
  type: AchievementType;
  category: AchievementCategory;
  rarity: AchievementRarity;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  progress?: number; // 0-100
  maxProgress?: number;
  color: string;
  hint?: string; // Pista para desbloquear
}

/**
 * Estadísticas del usuario
 */
export interface UserStats {
  // Visitas
  totalVisits: number;
  firstVisitDate: Date;
  lastVisitDate: Date;
  
  // Rachas
  currentStreak: number;
  longestStreak: number;
  lastCheckDate?: Date;
  
  // Interacciones
  weatherChecks: number;
  mapViewCount: number;
  timelinePlaybacks: number;
  citiesCompared: number;
  
  // Tiempo
  totalTimeSpent: number; // minutos
  avgSessionDuration: number; // minutos
  
  // Puntos y nivel
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  
  // Logros
  achievementsUnlocked: number;
  achievementsTotal: number;
}

/**
 * Evento de gamificación
 */
export interface GamificationEvent {
  id: string;
  type: 'achievement_unlocked' | 'points_earned' | 'level_up' | 'streak_milestone';
  timestamp: Date;
  data: {
    achievement?: Achievement;
    points?: number;
    level?: number;
    streak?: number;
  };
  seen: boolean;
}

/**
 * Entrada de leaderboard
 */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  points: number;
  level: number;
  achievementsCount: number;
  rank: number;
  streak: number;
}

/**
 * Configuración de nivel
 */
export interface LevelConfig {
  level: number;
  minPoints: number;
  maxPoints: number;
  title: string;
  icon: string;
  color: string;
}

/**
 * Recompensa por acción
 */
export interface ActionReward {
  action: string;
  points: number;
  description: string;
  cooldown?: number; // minutos
  maxDaily?: number;
}

/**
 * Notificación de gamificación
 */
export interface GamificationNotification {
  id: string;
  type: 'achievement' | 'points' | 'level' | 'streak';
  title: string;
  message: string;
  icon: string;
  color: string;
  timestamp: Date;
  duration: number; // ms
  showConfetti: boolean;
}
