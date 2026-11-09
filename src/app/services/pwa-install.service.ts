import { Injectable, OnDestroy, signal } from '@angular/core';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService implements OnDestroy {
  readonly installed = signal(window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);
  readonly available = signal(false);
  readonly prompting = signal(false);
  readonly accepted = signal(false);
  readonly helpOpen = signal(false);
  readonly failed = signal(false);
  readonly isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  private deferred: InstallPrompt | null = null;
  private destroyed = false;
  private capture = (event: Event) => {
    if (this.installed() || typeof (event as InstallPrompt).prompt !== 'function') return;
    event.preventDefault();
    this.deferred = event as InstallPrompt;
    this.available.set(true); this.accepted.set(false); this.failed.set(false); this.helpOpen.set(false);
  };
  private markInstalled = () => {
    this.installed.set(true); this.accepted.set(false); this.available.set(false);
    this.helpOpen.set(false); this.deferred = null;
  };

  constructor() {
    window.addEventListener('beforeinstallprompt', this.capture);
    window.addEventListener('appinstalled', this.markInstalled);
  }

  async install(): Promise<void> {
    if (this.destroyed || this.installed() || this.prompting()) return;
    this.failed.set(false);
    if (!this.deferred) { this.helpOpen.set(true); return; }
    const prompt = this.deferred;
    this.deferred = null; this.available.set(false); this.helpOpen.set(false); this.prompting.set(true);
    try {
      // Must run directly from the user's click, before any await loses activation.
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (!this.destroyed && !this.installed()) this.accepted.set(choice.outcome === 'accepted');
    } catch {
      if (!this.destroyed && !this.installed()) { this.failed.set(true); this.helpOpen.set(true); }
    } finally {
      if (!this.destroyed) this.prompting.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    window.removeEventListener('beforeinstallprompt', this.capture);
    window.removeEventListener('appinstalled', this.markInstalled);
    this.deferred = null;
  }
}
