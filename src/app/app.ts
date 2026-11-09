import { Component, OnInit, inject } from '@angular/core';

import { RouterOutlet, Router } from '@angular/router';

// Importar componentes
import { MobileShellComponent } from './components/mobile-weather/mobile-shell.component';
import { FooterComponent } from './components/footer/footer.component';
import { GamificationNotificationsComponent } from './components/gamification-notifications/gamification-notifications.component';

// Importar servicios
import { GamificationService } from './services/gamification.service';
import { ThemeService } from './services/theme.service';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MobileShellComponent,
    FooterComponent,
    GamificationNotificationsComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private pwaUpdates = inject(PwaUpdateService);
  get isPrimary(): boolean { return this.router.url.split('?')[0] === '/'; }
  constructor(
    private gamificationService: GamificationService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.pwaUpdates.start();
    // Los servicios se inicializan automáticamente
    // La gamificación rastrea la visita en su constructor
  }
}
