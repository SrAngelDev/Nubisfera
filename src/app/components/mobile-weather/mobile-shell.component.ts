import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MobileIconComponent } from './mobile-icon.component';

@Component({
  selector: 'app-mobile-shell', standalone: true, imports: [RouterLink, MobileIconComponent],
  template: `
    <a class="skip-link" href="#route-content">Saltar al contenido</a>
    <header class="mobile-brand">
      <a routerLink="/" aria-label="Nubisfera, inicio"><app-mobile-icon name="cloud" /><span>Nubisfera</span></a>
      <span class="brand-caption">EL TIEMPO, A MANO</span>
    </header>
    <nav class="mobile-navigation" aria-label="Navegación principal">
      <a routerLink="/" [class.selected]="active === 'weather'" [attr.aria-current]="active === 'weather' ? 'page' : null"><app-mobile-icon name="sun" /><span>Tiempo</span></a>
      <a routerLink="/" [queryParams]="{view:'places'}" [class.selected]="active === 'places'" [attr.aria-current]="active === 'places' ? 'page' : null"><app-mobile-icon name="pin" /><span>Lugares</span></a>
      <a routerLink="/" [queryParams]="{view:'more'}" [class.selected]="active === 'more'" [attr.aria-current]="active === 'more' ? 'page' : null"><app-mobile-icon name="more" /><span>Más</span></a>
    </nav>`,
  styleUrl: './mobile-shell.component.css'
})
export class MobileShellComponent {
  private router = inject(Router);
  get active(): string {
    const tree = this.router.parseUrl(this.router.url);
    if (tree.queryParams['view'] === 'places') return 'places';
    if (tree.queryParams['view'] === 'more' || this.router.url.split('?')[0] !== '/') return 'more';
    return 'weather';
  }
}
