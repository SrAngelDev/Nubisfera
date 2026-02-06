import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { GamificationNotification } from '../../models/gamification.model';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Componente de notificaciones de gamificación
 * Muestra toasts cuando ocurren eventos (logros, puntos, niveles)
 */
@Component({
  selector: 'app-gamification-notifications',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="notifications-container">
      @for (notification of notifications(); track notification.id) {
        <div 
          class="notification-toast"
          [class]="'notification-' + notification.type"
          [@slideIn]
          (click)="dismissNotification(notification.id)"
        >
          <div class="notification-icon" [style.background]="notification.color">
            <i [ngClass]="notification.icon"></i>
          </div>
          <div class="notification-content">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <p class="notification-message">{{ notification.message }}</p>
          </div>
          <button class="notification-close" (click)="dismissNotification(notification.id); $event.stopPropagation()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 1000;
      pointer-events: none;
    }

    .notification-toast {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      width: 380px;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: all 0.2s ease;
      pointer-events: auto;
    }

    .notification-toast:hover {
      transform: translateX(-8px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    }

    .notification-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .notification-message {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notification-close {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .notification-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .notification-achievement .notification-icon {
      animation: achievement-pulse 2s ease-in-out infinite;
    }

    @keyframes achievement-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .notification-level .notification-icon {
      animation: level-bounce 0.6s ease-out;
    }

    @keyframes level-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .notifications-container {
        right: 1rem;
        left: 1rem;
      }

      .notification-toast {
        width: auto;
      }
    }
  `]
})
export class GamificationNotificationsComponent implements OnInit, OnDestroy {
  notifications = signal<GamificationNotification[]>([]);
  
  private subscription?: Subscription;

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.subscription = this.gamificationService.notifications$.subscribe(notifications => {
      this.notifications.set(notifications);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Descarta una notificación
   */
  dismissNotification(id: string): void {
    this.gamificationService.removeNotification(id);
  }
}
