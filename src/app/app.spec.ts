import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { GamificationService } from './services/gamification.service';
import { ThemeService } from './services/theme.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: GamificationService, useValue: {} }, { provide: ThemeService, useValue: {} }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.mobile-brand')?.textContent).toContain('Nubisfera');
    expect(Array.from(compiled.querySelectorAll('.mobile-navigation a')).map(a => a.textContent?.trim())).toEqual(['Tiempo', 'Lugares', 'Más']);
    expect(compiled.querySelector('app-footer')).toBeNull();
  });
});
