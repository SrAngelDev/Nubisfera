import { ApplicationRef } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PWA_RELOAD, PwaUpdateService } from './pwa-update.service';

describe('PWA automatic updates', () => {
  let service: PwaUpdateService;
  let stable: Subject<boolean>;
  let events: Subject<VersionEvent>;
  let worker: { isEnabled: boolean; versionUpdates: Subject<VersionEvent>; checkForUpdate: jasmine.Spy };
  let reload: jasmine.Spy;
  let visibility: jasmine.Spy;
  let online: jasmine.Spy;
  const ready: VersionEvent = { type: 'VERSION_READY', currentVersion: { hash: 'old' }, latestVersion: { hash: 'new' } };

  beforeEach(() => {
    stable = new Subject<boolean>(); events = new Subject<VersionEvent>(); reload = jasmine.createSpy('reload');
    worker = { isEnabled: true, versionUpdates: events, checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false) };
    visibility = spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    online = spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    TestBed.configureTestingModule({ providers: [
      { provide: SwUpdate, useValue: worker },
      { provide: PWA_RELOAD, useValue: reload }
    ] });
    Object.defineProperty(TestBed.inject(ApplicationRef), 'isStable', { value: stable, configurable: true });
    service = TestBed.inject(PwaUpdateService);
  });
  afterEach(() => service?.ngOnDestroy());
  function start(): void { service.start(); stable.next(true); }

  it('does nothing when the worker is disabled, including local development', () => {
    worker.isEnabled = false; start();
    window.dispatchEvent(new Event('online')); events.next(ready);
    expect(worker.checkForUpdate).not.toHaveBeenCalled(); expect(reload).not.toHaveBeenCalled();
  });

  it('waits until Angular is stable and starts just once', () => {
    service.start(); service.start(); stable.next(false);
    expect(worker.checkForUpdate).not.toHaveBeenCalled();
    stable.next(true); stable.next(true);
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('reloads only after a complete version is ready, and never clears saved places', () => {
    const clear = spyOn(Storage.prototype, 'clear'); start();
    events.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
    expect(reload).not.toHaveBeenCalled();
    events.next(ready); events.next(ready);
    expect(reload).toHaveBeenCalledTimes(1); expect(clear).not.toHaveBeenCalled();
  });

  it('defers a ready update until the app returns to the foreground', () => {
    start(); visibility.and.returnValue('hidden'); events.next(ready);
    expect(reload).not.toHaveBeenCalled();
    visibility.and.returnValue('visible'); document.dispatchEvent(new Event('visibilitychange'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps a ready update pending while offline and reloads on reconnection', () => {
    start(); online.and.returnValue(false); events.next(ready);
    expect(reload).not.toHaveBeenCalled();
    online.and.returnValue(true); window.dispatchEvent(new Event('online'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('checks again on return, reconnection and pageshow', async () => {
    start(); await Promise.resolve();
    document.dispatchEvent(new Event('visibilitychange')); await Promise.resolve();
    window.dispatchEvent(new Event('online')); await Promise.resolve();
    window.dispatchEvent(new Event('pageshow')); await Promise.resolve();
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(4);
  });

  it('does not duplicate an in-flight check', () => {
    worker.checkForUpdate.and.returnValue(new Promise<boolean>(() => {})); start();
    window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('pageshow'));
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('keeps the current app on network or installation failure and can retry', async () => {
    worker.checkForUpdate.and.rejectWith(new Error('network')); start(); await Promise.resolve();
    events.next({ type: 'VERSION_INSTALLATION_FAILED', version: { hash: 'new' }, error: 'incomplete download' });
    expect(reload).not.toHaveBeenCalled();
    worker.checkForUpdate.and.resolveTo(true); window.dispatchEvent(new Event('online')); await Promise.resolve();
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(2); expect(reload).toHaveBeenCalledTimes(1);
  });

  it('checks periodically only when visible and online', fakeAsync(() => {
    start(); flushMicrotasks(); visibility.and.returnValue('hidden');
    tick(15 * 60 * 1000); expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);
    visibility.and.returnValue('visible'); online.and.returnValue(false);
    tick(15 * 60 * 1000); expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);
    online.and.returnValue(true); tick(15 * 60 * 1000); flushMicrotasks();
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(2); service.ngOnDestroy();
  }));

  it('removes listeners and ignores a pending result after destruction', async () => {
    let resolve!: (value: boolean) => void;
    worker.checkForUpdate.and.returnValue(new Promise<boolean>(done => { resolve = done; })); start();
    service.ngOnDestroy(); resolve(true); await Promise.resolve();
    events.next(ready); window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange'));
    expect(reload).not.toHaveBeenCalled(); expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);
  });
});
