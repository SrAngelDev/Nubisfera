import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-glow"></div>
      
      <div class="footer-container">
        <!-- Línea separadora con gradiente -->
        <div class="footer-divider">
          <div class="divider-line"></div>
          <div class="divider-icon">
            <i class="fas fa-cloud-sun"></i>
          </div>
          <div class="divider-line"></div>
        </div>

        <!-- Contenido principal -->
        <div class="footer-content">
          <!-- Brand -->
          <div class="footer-brand">
            <div class="brand-logo">
              <div class="logo-icon">
                <i class="fas fa-cloud-sun"></i>
              </div>
              <div class="logo-text">
                <h3>Nubisfera</h3>
                <span class="version-tag">v2.0</span>
              </div>
            </div>
            <p class="brand-tagline">Tu ventana inteligente al cielo</p>
          </div>

          <!-- Links -->
          <div class="footer-links">
            <div class="links-group">
              <h4>Navegación</h4>
              <a routerLink="/" class="footer-link">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
              </a>
              <a routerLink="/comparar" class="footer-link">
                <i class="fas fa-columns"></i>
                <span>Comparar</span>
              </a>
              <a routerLink="/timeline" class="footer-link">
                <i class="fas fa-stream"></i>
                <span>Timeline</span>
              </a>
              <a routerLink="/acerca-de" class="footer-link">
                <i class="fas fa-info-circle"></i>
                <span>Acerca de</span>
              </a>
            </div>

            <div class="links-group">
              <h4>Recursos</h4>
              <a href="https://github.com/SrAngelDev/Nubisfera" target="_blank" rel="noopener" class="footer-link">
                <i class="fab fa-github"></i>
                <span>GitHub</span>
              </a>
            </div>
          </div>

          <!-- Tech & Credits -->
          <div class="footer-credits">
            <h4>Desarrollado con</h4>
            <div class="tech-pills">
              <span class="tech-pill">
                <i class="fab fa-angular"></i> Angular
              </span>
              <span class="tech-pill">
                <i class="fas fa-code"></i> TypeScript
              </span>
              <span class="tech-pill">
                <i class="fas fa-stream"></i> RxJS
              </span>
            </div>
            <p class="credits-author">
              Hecho con <i class="fas fa-heart heart-icon"></i> por
              <a href="https://github.com/SrAngelDev" target="_blank" rel="noopener">Angel Sanchez</a>
            </p>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="footer-bottom">
          <p class="copyright">© {{ currentYear }} Nubisfera • Datos proporcionados por OpenMeteo</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      position: relative;
      background: linear-gradient(180deg, transparent 0%, rgba(8, 12, 21, 0.95) 15%, #080c15 100%);
      color: rgba(255, 255, 255, 0.85);
      padding: 0 0 1.5rem;
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
      background: radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      position: relative;
      z-index: 1;
    }

    /* Divider */
    .footer-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem 0 2.5rem;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
    }

    .divider-icon {
      color: rgba(59, 130, 246, 0.5);
      font-size: 0.9rem;
    }

    /* Content grid */
    .footer-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.5rem;
      padding-bottom: 2.5rem;
    }

    @media (min-width: 768px) {
      .footer-content {
        grid-template-columns: 1.2fr 1.5fr 1fr;
        gap: 3rem;
      }
    }

    /* Brand */
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .logo-text h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .version-tag {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(99, 102, 241, 0.9);
      background: rgba(99, 102, 241, 0.12);
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }

    .brand-tagline {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.45);
      margin: 0;
      line-height: 1.4;
    }

    /* Links */
    .footer-links {
      display: flex;
      gap: 3rem;
    }

    .links-group h4 {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.35);
      margin: 0 0 0.75rem;
    }

    .footer-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.85rem;
      padding: 0.35rem 0;
      transition: all 0.2s ease;
    }

    .footer-link i {
      font-size: 0.75rem;
      width: 16px;
      text-align: center;
      opacity: 0.7;
      transition: all 0.2s ease;
    }

    .footer-link:hover {
      color: rgba(255, 255, 255, 0.95);
      transform: translateX(3px);
    }

    .footer-link:hover i {
      color: #3b82f6;
      opacity: 1;
    }

    /* Credits */
    .footer-credits {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-credits h4 {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.35);
      margin: 0;
    }

    .tech-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .tech-pill {
      font-size: 0.72rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s ease;
    }

    .tech-pill:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
      color: rgba(255, 255, 255, 0.85);
    }

    .credits-author {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      margin: 0.25rem 0 0;
    }

    .credits-author a {
      color: rgba(59, 130, 246, 0.8);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .credits-author a:hover {
      color: #3b82f6;
    }

    .heart-icon {
      color: #ef4444;
      font-size: 0.7rem;
      animation: heartbeat 2s ease-in-out infinite;
    }

    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    /* Bottom bar */
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 1.25rem;
      text-align: center;
    }

    .copyright {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.3);
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 767px) {
      .footer-content {
        text-align: center;
      }

      .footer-brand {
        align-items: center;
      }

      .footer-links {
        justify-content: center;
        gap: 2.5rem;
      }

      .footer-credits {
        align-items: center;
      }

      .tech-pills {
        justify-content: center;
      }

      .footer-link:hover {
        transform: none;
      }
    }

    @media (max-width: 480px) {
      .footer-links {
        flex-direction: column;
        gap: 1.5rem;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
