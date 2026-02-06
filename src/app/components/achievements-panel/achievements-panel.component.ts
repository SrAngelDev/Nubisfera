import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { Achievement, UserStats, LevelConfig } from '../../models/gamification.model';
import { Subscription } from 'rxjs';

/**
 * Componente de panel de logros y estadísticas
 * Muestra progreso del usuario, logros desbloqueados y estadísticas
 */
@Component({
  selector: 'app-achievements-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="achievements-container">
      <!-- Header con estadísticas generales -->
      <header class="achievements-header">
        <div class="header-content">
          <h2 class="title">
            <i class="fas fa-trophy"></i>
            Mis Logros
          </h2>
          <div class="stats-summary">
            <div class="stat-badge">
              <i class="fas fa-star"></i>
              <span>Nivel {{ currentLevel() }}</span>
            </div>
            <div class="stat-badge">
              <i class="fas fa-coins"></i>
              <span>{{ stats()?.totalPoints || 0 }} pts</span>
            </div>
            <div class="stat-badge">
              <i class="fas fa-fire"></i>
              <span>{{ stats()?.currentStreak || 0 }} días</span>
            </div>
          </div>
        </div>

        <!-- Barra de progreso de nivel -->
        @if (levelConfig()) {
          <div class="level-progress">
            <div class="progress-info">
              <span class="level-title">{{ levelConfig()!.title }}</span>
              <span class="points-needed">{{ stats()?.pointsToNextLevel || 0 }} pts para siguiente nivel</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="getLevelProgress()"
                [style.background]="levelConfig()!.color"
              ></div>
            </div>
          </div>
        }
      </header>

      <!-- Filtros de logros -->
      <div class="achievement-filters">
        <button
          class="filter-btn"
          [class.active]="filter() === 'all'"
          (click)="setFilter('all')"
        >
          Todos ({{ achievements().length }})
        </button>
        <button
          class="filter-btn"
          [class.active]="filter() === 'unlocked'"
          (click)="setFilter('unlocked')"
        >
          Desbloqueados ({{ unlockedCount() }})
        </button>
        <button
          class="filter-btn"
          [class.active]="filter() === 'locked'"
          (click)="setFilter('locked')"
        >
          Bloqueados ({{ lockedCount() }})
        </button>
      </div>

      <!-- Grid de logros -->
      <div class="achievements-grid">
        @for (achievement of filteredAchievements(); track achievement.id) {
          <article 
            class="achievement-card"
            [class.unlocked]="achievement.isUnlocked"
            [class.locked]="!achievement.isUnlocked"
            [class]="'rarity-' + achievement.rarity"
          >
            <!-- Badge del logro -->
            <div class="achievement-badge">
              <div 
                class="badge-icon"
                [style.background]="achievement.color"
              >
                <i [ngClass]="achievement.icon"></i>
              </div>
              
              @if (!achievement.isUnlocked && achievement.maxProgress) {
                <div class="progress-ring">
                  <svg viewBox="0 0 100 100">
                    <circle class="progress-ring-bg" cx="50" cy="50" r="45"></circle>
                    <circle 
                      class="progress-ring-fill" 
                      cx="50" 
                      cy="50" 
                      r="45"
                      [style.stroke-dasharray]="getCircleProgress(achievement)"
                      [style.stroke]="achievement.color"
                    ></circle>
                  </svg>
                  <span class="progress-text">{{ getProgressPercent(achievement) }}%</span>
                </div>
              }

              <!-- Indicador de rareza -->
              <span 
                class="rarity-badge"
                [style.background]="getRarityColor(achievement.rarity)"
              >
                {{ getRarityLabel(achievement.rarity) }}
              </span>
            </div>

            <!-- Información del logro -->
            <div class="achievement-info">
              <h3 class="achievement-name">{{ achievement.name }}</h3>
              <p class="achievement-description">{{ achievement.description }}</p>
              
              @if (!achievement.isUnlocked && achievement.hint) {
                <p class="achievement-hint">
                  <i class="fas fa-lightbulb"></i>
                  {{ achievement.hint }}
                </p>
              }

              <div class="achievement-footer">
                <span class="points-badge">
                  <i class="fas fa-star"></i>
                  {{ achievement.points }} pts
                </span>
                
                @if (achievement.isUnlocked && achievement.unlockedAt) {
                  <span class="unlocked-date">
                    {{ formatDate(achievement.unlockedAt) }}
                  </span>
                }
              </div>

              <!-- Barra de progreso -->
              @if (!achievement.isUnlocked && achievement.maxProgress) {
                <div class="achievement-progress">
                  <div class="progress-bar-small">
                    <div 
                      class="progress-fill-small"
                      [style.width.%]="getProgressPercent(achievement)"
                      [style.background]="achievement.color"
                    ></div>
                  </div>
                  <span class="progress-label">
{{ (achievement.progress || 0) }} / {{ achievement.maxProgress }}
                  </span>
                </div>
              }
            </div>
          </article>
        }
      </div>

      <!-- Estadísticas detalladas -->
      <section class="detailed-stats">
        <h3 class="section-title">Estadísticas</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <i class="fas fa-calendar-check"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalVisits || 0 }}</span>
              <span class="stat-label">Visitas totales</span>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-cloud-sun"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.weatherChecks || 0 }}</span>
              <span class="stat-label">Consultas del tiempo</span>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-map"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.mapViewCount || 0 }}</span>
              <span class="stat-label">Vistas del mapa</span>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-clock"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.timelinePlaybacks || 0 }}</span>
              <span class="stat-label">Reproducciones timeline</span>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-city"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.citiesCompared || 0 }}</span>
              <span class="stat-label">Ciudades comparadas</span>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-fire-alt"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.longestStreak || 0 }}</span>
              <span class="stat-label">Racha más larga</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .achievements-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .achievements-header {
      padding: 2rem;
      background: var(--gradient-ethereal-alt);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-lg);
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .title i {
      color: #fbbf24;
    }

    .stats-summary {
      display: flex;
      gap: 1rem;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: rgba(100, 149, 237, 0.1);
      border: 1px solid rgba(100, 149, 237, 0.2);
      border-radius: 12px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-badge i {
      color: var(--primary-blue);
    }

    .level-progress {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .level-title {
      font-weight: 700;
      color: var(--text-primary);
    }

    .points-needed {
      color: var(--text-secondary);
    }

    .progress-bar {
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-blue);
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    /* Filtros */
    .achievement-filters {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-btn:hover {
      background: rgba(100, 149, 237, 0.1);
      border-color: var(--primary-blue);
    }

    .filter-btn.active {
      background: rgba(100, 149, 237, 0.2);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
    }

    /* Grid de logros */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .achievement-card {
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      border-radius: 20px;
      transition: all 0.3s ease;
    }

    .achievement-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
    }

    .achievement-card.locked {
      opacity: 0.6;
    }

    .achievement-card.locked .badge-icon {
      filter: grayscale(1);
    }

    .achievement-badge {
      position: relative;
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .badge-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      font-size: 2rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .progress-ring {
      position: absolute;
      width: 96px;
      height: 96px;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
    }

    .progress-ring svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3;
    }

    .progress-ring-fill {
      fill: none;
      stroke-width: 3;
      transition: stroke-dasharray 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: -2px;
      right: -2px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .rarity-badge {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .achievement-info {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .achievement-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      text-align: center;
    }

    .achievement-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
      text-align: center;
    }

    .achievement-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(251, 191, 36, 0.1);
      border-radius: 8px;
      font-size: 0.8rem;
      color: #fbbf24;
      margin: 0;
    }

    .achievement-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }

    .points-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(251, 191, 36, 0.15);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      color: #fbbf24;
    }

    .unlocked-date {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .achievement-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-bar-small {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill-small {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* Estadísticas detalladas */
    .detailed-stats {
      padding: 2rem;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      background: rgba(100, 149, 237, 0.1);
      border-color: var(--primary-blue);
      transform: scale(1.02);
    }

    .stat-card i {
      font-size: 2rem;
      color: var(--primary-blue);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .stats-summary {
        flex-wrap: wrap;
      }
    }
  `]
})
export class AchievementsPanelComponent implements OnInit, OnDestroy {
  achievements = signal<Achievement[]>([]);
  stats = signal<UserStats | null>(null);
  levelConfig = signal<LevelConfig | null>(null);
  filter = signal<'all' | 'unlocked' | 'locked'>('all');
  
  filteredAchievements = signal<Achievement[]>([]);
  unlockedCount = signal(0);
  lockedCount = signal(0);
  currentLevel = signal(1);

  private subscriptions: Subscription[] = [];

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    const achievementsSub = this.gamificationService.achievements$.subscribe(achievements => {
      this.achievements.set(achievements);
      this.updateFilteredAchievements();
      this.updateCounts();
    });

    const statsSub = this.gamificationService.stats$.subscribe(stats => {
      this.stats.set(stats);
      this.currentLevel.set(stats.level);
      const config = this.gamificationService.getLevelConfig(stats.level);
      this.levelConfig.set(config || null);
    });

    this.subscriptions.push(achievementsSub, statsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Actualiza la lista filtrada de logros
   */
  private updateFilteredAchievements(): void {
    const all = this.achievements();
    const currentFilter = this.filter();

    let filtered: Achievement[];
    
    if (currentFilter === 'unlocked') {
      filtered = all.filter(a => a.isUnlocked);
    } else if (currentFilter === 'locked') {
      filtered = all.filter(a => !a.isUnlocked);
    } else {
      filtered = all;
    }

    this.filteredAchievements.set(filtered);
  }

  /**
   * Actualiza los contadores
   */
  private updateCounts(): void {
    const all = this.achievements();
    this.unlockedCount.set(all.filter(a => a.isUnlocked).length);
    this.lockedCount.set(all.filter(a => !a.isUnlocked).length);
  }

  /**
   * Establece el filtro
   */
  setFilter(filter: 'all' | 'unlocked' | 'locked'): void {
    this.filter.set(filter);
    this.updateFilteredAchievements();
  }

  /**
   * Obtiene el progreso del nivel actual
   */
  getLevelProgress(): number {
    const stats = this.stats();
    const config = this.levelConfig();
    
    if (!stats || !config) return 0;
    
    const currentPoints = stats.totalPoints - config.minPoints;
    const maxPoints = config.maxPoints - config.minPoints;
    
    return Math.min((currentPoints / maxPoints) * 100, 100);
  }

  /**
   * Obtiene el porcentaje de progreso de un logro
   */
  getProgressPercent(achievement: Achievement): number {
    if (!achievement.maxProgress) return 0;
    return Math.floor(((achievement.progress || 0) / achievement.maxProgress) * 100);
  }

  /**
   * Obtiene el progreso circular (para SVG)
   */
  getCircleProgress(achievement: Achievement): string {
    const percent = this.getProgressPercent(achievement);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percent / 100) * circumference;
    return `${circumference} ${offset}`;
  }

  /**
   * Obtiene el color de rareza
   */
  getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      'common': '#94a3b8',
      'uncommon': '#10b981',
      'rare': '#3b82f6',
      'epic': '#a855f7',
      'legendary': '#f59e0b'
    };
    return colors[rarity] || '#6b7280';
  }

  /**
   * Obtiene la etiqueta de rareza
   */
  getRarityLabel(rarity: string): string {
    const labels: Record<string, string> = {
      'common': 'Común',
      'uncommon': 'Poco común',
      'rare': 'Raro',
      'epic': 'Épico',
      'legendary': 'Legendario'
    };
    return labels[rarity] || rarity;
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
