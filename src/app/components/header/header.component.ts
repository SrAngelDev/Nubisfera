import { Component, HostBinding, HostListener, signal, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @HostBinding('class.scrolled') isScrolled = false;
  isMobileMenuOpen = false;
  currentLevel = signal(1);

  /** PWA Install */
  canInstall = signal(false);
  showMobileBanner = signal(true);
  private deferredPrompt: any = null;
  private beforeInstallHandler = (e: Event) => {
    e.preventDefault();
    this.deferredPrompt = e;
    this.ngZone.run(() => this.canInstall.set(true));
  };
  private appInstalledHandler = () => {
    this.ngZone.run(() => {
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  };

  constructor(
    private gamificationService: GamificationService,
    private ngZone: NgZone
  ) {
    this.gamificationService.stats$.subscribe(stats => {
      this.currentLevel.set(stats.level);
    });
  }

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.beforeInstallHandler);
    window.addEventListener('appinstalled', this.appInstalledHandler);

    // Si la app ya está instalada (standalone), no mostrar botón
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.canInstall.set(false);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler);
    window.removeEventListener('appinstalled', this.appInstalledHandler);
  }

  async installPwa(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }
    this.deferredPrompt = null;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 10;
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevenir scroll del body cuando el menú está abierto
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  dismissMobileInstall() {
    this.showMobileBanner.set(false);
  }
}