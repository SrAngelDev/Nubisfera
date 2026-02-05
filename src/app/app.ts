import { Component, OnInit, ApplicationRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval } from 'rxjs';

// Importar componentes
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  ngOnInit() {
    // Solo ejecutar si el Service Worker está habilitado
    if (this.swUpdate.isEnabled) {
      // Verificar actualizaciones cada 6 horas
      const everySixHours$ = interval(6 * 60 * 60 * 1000);
      everySixHours$.subscribe(() => this.swUpdate.checkForUpdate());

      // Detectar cuando hay una nueva versión disponible
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
        )
        .subscribe(() => {
          if (confirm('🌦️ ¡Nueva versión de Nubisfera disponible!\n\n¿Deseas actualizar ahora para obtener las últimas mejoras?')) {
            window.location.reload();
          }
        });

      // Detectar errores del Service Worker
      this.swUpdate.unrecoverable.subscribe(event => {
        console.error('Error irrecuperable del Service Worker:', event.reason);
        if (confirm('La aplicación necesita recargarse debido a un error.\n\n¿Recargar ahora?')) {
          window.location.reload();
        }
      });
    }
  }
}
