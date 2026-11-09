import { TestBed } from '@angular/core/testing';
import { PwaInstallService } from './pwa-install.service';
import { PwaInstallComponent } from '../components/mobile-weather/pwa-install.component';

describe('In-page PWA installation', () => {
  let service: PwaInstallService | undefined;
  beforeEach(() => {
    service = undefined;
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    TestBed.configureTestingModule({ imports: [PwaInstallComponent] });
  });
  afterEach(() => service?.ngOnDestroy());
  function create(): PwaInstallService { service = TestBed.inject(PwaInstallService); return service; }
  function nativePrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    const prompt = jasmine.createSpy('prompt').and.resolveTo();
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
    window.dispatchEvent(event);
    return { event, prompt };
  }

  it('offers an installation button before native support is announced and opens help on demand', async () => {
    const s = create(); const fixture = TestBed.createComponent(PwaInstallComponent); fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.install-button') as HTMLButtonElement;
    expect(button.textContent).toContain('Instalar Nubisfera');
    expect(s.helpOpen()).toBeFalse(); button.click(); fixture.detectChanges();
    expect(s.helpOpen()).toBeTrue(); expect(button.getAttribute('aria-expanded')).toBe('true');
    fixture.destroy();
  });

  it('opens the browser prompt synchronously from the click, without pretending the app is installed', async () => {
    const s = create(); const { event, prompt } = nativePrompt();
    expect(event.defaultPrevented).toBeTrue();
    const result = s.install(); expect(prompt).toHaveBeenCalledTimes(1); expect(s.prompting()).toBeTrue();
    await result; expect(s.accepted()).toBeTrue(); expect(s.installed()).toBeFalse();
    expect(s.prompting()).toBeFalse(); expect(s.available()).toBeFalse();
  });

  it('does not invoke a one-shot browser prompt twice', async () => {
    const s = create(); const { prompt } = nativePrompt('dismissed');
    await Promise.all([s.install(), s.install()]); expect(prompt).toHaveBeenCalledTimes(1);
    expect(s.accepted()).toBeFalse(); await s.install(); expect(s.helpOpen()).toBeTrue();
  });

  it('keeps the pending native prompt when installation UI is destroyed and recreated', async () => {
    const s = create(); const { prompt } = nativePrompt();
    const first = TestBed.createComponent(PwaInstallComponent); first.detectChanges(); first.destroy();
    const second = TestBed.createComponent(PwaInstallComponent); second.detectChanges();
    (second.nativeElement.querySelector('.install-button') as HTMLButtonElement).click();
    expect(prompt).toHaveBeenCalledTimes(1); await Promise.resolve(); await Promise.resolve(); second.destroy();
    expect(s.available()).toBeFalse();
  });

  it('replaces the button with installed status after appinstalled', () => {
    const s = create(); const fixture = TestBed.createComponent(PwaInstallComponent); fixture.detectChanges();
    window.dispatchEvent(new Event('appinstalled')); fixture.detectChanges();
    expect(s.installed()).toBeTrue(); expect(fixture.nativeElement.querySelector('.install-button')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ya está instalada'); fixture.destroy();
  });

  it('does not offer installation when launched in standalone mode', async () => {
    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true } as MediaQueryList);
    const s = create(); const { prompt } = nativePrompt(); await s.install();
    expect(s.installed()).toBeTrue(); expect(prompt).not.toHaveBeenCalled();
  });

  it('shows the iPhone steps only when its button is used', async () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    const s = create(); const fixture = TestBed.createComponent(PwaInstallComponent); fixture.detectChanges();
    expect(s.isAppleMobile).toBeTrue(); expect(s.helpOpen()).toBeFalse();
    await s.install(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.install-help').textContent).toContain('Compartir'); fixture.destroy();
  });

  it('recovers with help when the native dialog fails', async () => {
    const s = create(); const { prompt } = nativePrompt(); prompt.and.rejectWith(new Error('unavailable'));
    await s.install(); expect(s.failed()).toBeTrue(); expect(s.helpOpen()).toBeTrue(); expect(s.prompting()).toBeFalse();
  });
});
