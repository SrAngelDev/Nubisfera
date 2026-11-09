import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Injectable, InjectionToken, NgZone, OnDestroy, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, filter, take } from 'rxjs';

export const PWA_RELOAD = new InjectionToken<() => void>('PWA reload', {
  providedIn: 'root', factory: () => () => window.location.reload()
});

/** Download a complete Angular version before reloading; never clear user storage. */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService implements OnDestroy {
  private updates = inject(SwUpdate);
  private app = inject(ApplicationRef);
  private zone = inject(NgZone);
  private document = inject(DOCUMENT);
  private reload = inject(PWA_RELOAD);
  private subscriptions = new Subscription();
  private interval?: ReturnType<typeof setInterval>;
  private started = false;
  private destroyed = false;
  private checking = false;
  private ready = false;
  private reloading = false;
  private readonly resume = () => {
    if (!this.foregroundOnline) return;
    if (this.ready) this.reloadReadyVersion();
    else void this.check();
  };

  start(): void {
    if (this.started || !this.updates.isEnabled) return;
    this.started = true;
    this.subscriptions.add(this.updates.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        this.ready = true;
        this.reloadReadyVersion();
      }
      // A failed download must leave the current, usable version in place.
    }));
    this.subscriptions.add(this.app.isStable.pipe(filter(Boolean), take(1)).subscribe(() => {
      if (this.destroyed) return;
      // Starting timers before stability can delay Angular's worker registration.
      this.zone.runOutsideAngular(() => {
        this.document.addEventListener('visibilitychange', this.resume);
        window.addEventListener('online', this.resume);
        window.addEventListener('pageshow', this.resume);
        this.interval = setInterval(this.resume, 15 * 60 * 1000);
        this.resume();
      });
    }));
  }

  private get foregroundOnline(): boolean {
    return this.document.visibilityState === 'visible' && navigator.onLine;
  }

  private async check(): Promise<void> {
    if (this.checking || this.destroyed || this.reloading || !this.foregroundOnline) return;
    this.checking = true;
    try {
      // Resolves only once a newly detected version is fully installed.
      if (await this.updates.checkForUpdate()) {
        this.ready = true;
        this.reloadReadyVersion();
      }
    } catch {
      // Offline, transient failure or an incomplete deploy: retry on the next trigger.
    } finally {
      this.checking = false;
    }
  }

  private reloadReadyVersion(): void {
    if (this.destroyed || this.reloading || !this.ready || !this.foregroundOnline) return;
    this.reloading = true;
    // Reload instead of activateUpdate(): never mix old code with new lazy chunks.
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.subscriptions.unsubscribe();
    if (this.interval) clearInterval(this.interval);
    this.document.removeEventListener('visibilitychange', this.resume);
    window.removeEventListener('online', this.resume);
    window.removeEventListener('pageshow', this.resume);
  }
}
