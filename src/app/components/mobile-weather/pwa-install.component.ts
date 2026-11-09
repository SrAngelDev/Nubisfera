import { Component, Input, inject } from '@angular/core';
import { PwaInstallService } from '../../services/pwa-install.service';
import { MobileIconComponent } from './mobile-icon.component';

let nextHelpId = 0;

@Component({
  selector: 'app-pwa-install', standalone: true, imports: [MobileIconComponent],
  template: `
    @if (!install.installed() || !compact) {
      <section class="installation" aria-label="Instalar Nubisfera">
        @if (!compact) { <app-mobile-icon name="download" /><h2>Siempre a mano</h2><p>Añade Nubisfera a tu pantalla de inicio.</p> }
        @if (install.installed()) {
          <p class="install-state" role="status"><app-mobile-icon name="check" /> Nubisfera ya está instalada.</p>
        } @else if (install.accepted()) {
          <p class="install-state" role="status"><app-mobile-icon name="check" /> Instalación solicitada. Sigue el aviso del navegador.</p>
        } @else {
          <button type="button" class="install-button" (click)="install.install()" [disabled]="install.prompting()" [attr.aria-busy]="install.prompting()" [attr.aria-expanded]="install.helpOpen()" [attr.aria-controls]="helpId">
            <app-mobile-icon name="download" /><span>{{ install.prompting() ? 'Abriendo…' : 'Instalar Nubisfera' }}</span>
          </button>
          @if (compact && !install.helpOpen()) { <p class="install-caption">{{ install.available() ? 'El navegador te pedirá confirmar la instalación.' : 'Tu previsión diaria, en la pantalla de inicio.' }}</p> }
        }
        <div [id]="helpId" [hidden]="!install.helpOpen()" class="install-help" role="status">
          @if (install.failed()) { <p>No se ha podido abrir la instalación.</p> }
          @if (install.isAppleMobile) {
            <p>En iPhone y iPad, la instalación se completa desde el menú del navegador:</p>
            <ol><li>Abre esta página en Safari.</li><li>Pulsa <strong>Compartir</strong>.</li><li>Elige <strong>Añadir a pantalla de inicio</strong> y confirma en <strong>Añadir</strong>.</li></ol>
          } @else {
            <p>Este navegador no ofrece la instalación directa en este momento.</p>
            <ol><li>Abre el menú del navegador.</li><li>Busca <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li><li>Si no aparece, abre Nubisfera en Chrome o Edge y vuelve a intentarlo.</li></ol>
          }
          <button type="button" class="close-help" (click)="install.helpOpen.set(false)">Entendido</button>
        </div>
      </section>
    }`,
  styles: [`
    /* Hallmark · component scope · P5 H5 E4 S5 R5 V4 · existing blue/cyan tokens */
    :host { display:block; min-width:0; }
    .installation { padding-top:var(--space-7); container-type:inline-size; }
    .installation > app-mobile-icon { color:var(--color-accent); margin-bottom:var(--space-3); }
    h2 { font-size:var(--text-xl); margin-bottom:var(--space-3); overflow-wrap:anywhere; }
    p { margin:0; font-size:var(--text-sm); line-height:1.6; }
    .install-button { display:flex; align-items:center; justify-content:center; gap:var(--space-2); width:100%; min-height:var(--mobile-touch); margin-top:var(--space-3); padding:var(--space-3) var(--space-2); border:1px solid var(--color-accent-2); border-radius:var(--radius-lg); background:var(--color-accent-2); color:var(--mobile-on-primary); font-family:var(--font-body); font-size:var(--text-sm); font-weight:500; cursor:pointer; white-space:nowrap; touch-action:manipulation; }
    .install-button:hover, .install-button:active { background:var(--primary-blue-dark); }
    .install-button:focus-visible, .close-help:focus-visible { outline:2px solid var(--color-focus); outline-offset:3px; }
    .install-button:disabled { opacity:.6; cursor:wait; }
    .install-caption { font-size:var(--text-xs); margin-top:var(--space-2); }
    .install-state { display:flex; align-items:center; gap:var(--space-2); color:var(--color-ink); padding-block:var(--space-3); }
    .install-state app-mobile-icon { color:var(--color-accent); }
    .install-help { margin-top:var(--space-4); padding:var(--space-4); background:var(--color-paper-2); border:1px solid var(--color-rule); border-radius:var(--radius-lg); overflow-wrap:anywhere; }
    .install-help ol { margin:var(--space-3) 0 0; padding-left:var(--space-5); font-size:var(--text-sm); color:var(--color-ink-2); }
    .install-help li + li { margin-top:var(--space-2); }
    .close-help { min-height:var(--mobile-touch); margin-top:var(--space-2); border:0; padding:var(--space-2) 0; font-family:var(--font-body); font-size:var(--text-sm); background:none; color:var(--color-accent); cursor:pointer; }
    .close-help:active { color:var(--color-ink); }
    @container (max-width:18rem) { .install-button app-mobile-icon { display:none; } }
  `]
})
export class PwaInstallComponent {
  @Input() compact = false;
  readonly install = inject(PwaInstallService);
  readonly helpId = 'pwa-install-help-' + ++nextHelpId;
}
