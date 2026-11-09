import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-glow" aria-hidden="true"></div>

      <div class="footer-container">
        <div class="footer-mast">
          <!-- Wordmark + tagline -->
          <a routerLink="/" class="footer-brand" aria-label="Nubisfera — inicio">
            <span class="brand-icon"><i class="fas fa-cloud-sun"></i></span>
            <span class="brand-copy">
              <span class="brand-name">Nubisfera<span class="version-tag">v2.0</span></span>
              <span class="brand-tagline">Tu ventana inteligente al cielo</span>
            </span>
          </a>

          <!-- Links esenciales -->
          <nav class="footer-nav" aria-label="Enlaces del pie de página">
            <a routerLink="/comparar" class="footer-link">Comparar</a>
            <a routerLink="/timeline" class="footer-link">Timeline</a>
            <a routerLink="/acerca-de" class="footer-link">Acerca de</a>
            <a href="https://github.com/SrAngelDev/Nubisfera" target="_blank" rel="noopener" class="footer-link">
              <i class="fab fa-github" aria-hidden="true"></i> GitHub
            </a>
          </nav>
        </div>

        <!-- Línea de créditos -->
        <div class="footer-bottom">
          <p class="copyright">
            © {{ currentYear }} Nubisfera · Datos de OpenMeteo · Hecho con
            <i class="fas fa-heart heart-icon" aria-hidden="true"></i> por
            <a href="https://github.com/SrAngelDev" target="_blank" rel="noopener">Angel Sanchez</a>
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* Hallmark · footer: Ft1 mast-headed */
    .footer {
      position: relative;
      background: var(--background-light);
      border-top: 1px solid var(--border-light);
      color: var(--text-secondary);
      padding: var(--space-10) 0 var(--space-6);
      margin-top: auto;
      overflow: hidden;
    }

    .footer-glow {
      position: absolute;
      top: -80px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 160px;
      background: radial-gradient(ellipse, var(--surface-overlay) 0%, transparent 70%);
      pointer-events: none;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      position: relative;
      z-index: 1;
    }

    .footer-mast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-6);
      padding-bottom: var(--space-8);
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: var(--radius-lg);
      background: var(--gradient-sky);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: var(--text-inverse);
      box-shadow: var(--shadow-sm);
    }

    .brand-copy {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .brand-name {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      display: inline-flex;
      align-items: baseline;
      gap: var(--space-2);
    }

    .version-tag {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--accent-cyan);
      background: var(--surface-overlay);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      letter-spacing: 0.03em;
    }

    .brand-tagline {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .footer-nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-6);
    }

    .footer-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--text-sm);
      transition: color var(--transition-fast);
    }

    .footer-link:hover {
      color: var(--accent-cyan);
    }

    .footer-bottom {
      border-top: 1px solid var(--border-light);
      padding-top: var(--space-5);
      text-align: center;
    }

    .copyright {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin: 0;
    }

    .copyright a {
      color: var(--text-secondary);
      font-weight: 600;
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .copyright a:hover {
      color: var(--accent-cyan);
    }

    .heart-icon {
      color: var(--error-red);
      font-size: 0.7rem;
    }

    /* Responsive */
    @media (max-width: 767px) {
      .footer-mast {
        flex-direction: column;
        align-items: flex-start;
      }

      .footer-nav {
        gap: var(--space-4);
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

