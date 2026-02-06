import { Component, OnInit } from '@angular/core';

import { RouterOutlet } from '@angular/router';

// Importar componentes
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { GamificationNotificationsComponent } from './components/gamification-notifications/gamification-notifications.component';

// Importar servicios
import { GamificationService } from './services/gamification.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    GamificationNotificationsComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(
    private gamificationService: GamificationService
  ) {}

  ngOnInit(): void {
    // Los servicios se inicializan automáticamente
    // La gamificación rastrea la visita en su constructor
  }
}
