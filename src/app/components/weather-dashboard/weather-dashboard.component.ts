import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TemperatureWidgetComponent } from '../widgets/temperature-widget/temperature-widget.component';
import { PrecipitationWidgetComponent } from '../widgets/precipitation-widget/precipitation-widget.component';
import { WindWidgetComponent } from '../widgets/wind-widget/wind-widget.component';
import { UvIndexWidgetComponent } from '../widgets/uv-index-widget/uv-index-widget.component';
import { SunriseSunsetWidgetComponent } from '../widgets/sunrise-sunset-widget/sunrise-sunset-widget.component';
import { AlertsWidgetComponent } from '../widgets/alerts-widget/alerts-widget.component';
import { WidgetConfig } from '../../models/widget.model';
import { Municipio } from '../../models/municipio.model';
import { WeatherService } from '../../services/weather.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * Dashboard Multi-Panel con búsqueda de municipio
 * Primero permite buscar y seleccionar un municipio, luego muestra todos los widgets
 */
@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TemperatureWidgetComponent,
    PrecipitationWidgetComponent,
    WindWidgetComponent,
    UvIndexWidgetComponent,
    SunriseSunsetWidgetComponent,
    AlertsWidgetComponent
  ],
  template: `
    <div class="dashboard-container">
      
      @if (!municipioSeleccionado()) {
        <!-- Estado inicial: Búsqueda de Municipio -->
        <div class="search-state">
          <div class="search-panel">
            <div class="search-header">
              <h2 class="search-title">
                <i class="fas fa-search-location"></i>
                Buscar Ciudad
              </h2>
              <p class="search-subtitle">Selecciona cualquier ciudad del mundo para ver el panel meteorológico completo</p>
            </div>
            
            <div class="search-input-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                class="search-input"
                placeholder="Madrid, Paris, Tokyo, New York..."
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                [attr.aria-label]="'Buscar ciudad'"
              />
              @if (searchQuery()) {
                <button class="clear-btn" (click)="clearSearch()">
                  <i class="fas fa-times"></i>
                </button>
              }
            </div>
            
            @if (isSearching()) {
              <div class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Buscando ciudades...</span>
              </div>
            }
            
            @if (municipiosFiltrados().length > 0 && searchQuery()) {
              <div class="search-results">
                <p class="results-count">{{ municipiosFiltrados().length }} resultados encontrados</p>
                <ul class="results-list">
                  @for (municipio of municipiosFiltrados(); track municipio.id) {
                    <li class="result-item" (click)="seleccionarMunicipio(municipio)">
                      <div class="result-info">
                        <i class="fas fa-map-marker-alt result-icon"></i>
                        <div class="result-text">
                          <span class="result-name">{{ municipio.nombre }}</span>
                          <span class="result-meta">
                            @if (municipio.provincia && municipio.ccaa) {
                              {{ municipio.provincia }}, {{ municipio.ccaa }}
                            } @else if (municipio.ccaa) {
                              {{ municipio.ccaa }}
                            } @else if (municipio.provincia) {
                              {{ municipio.provincia }}
                            } @else {
                              Ciudad
                            }
                          </span>
                        </div>
                      </div>
                      <i class="fas fa-chevron-right result-arrow"></i>
                    </li>
                  }
                </ul>
              </div>
            }
            
            @if (searchQuery() && municipiosFiltrados().length === 0 && !isSearching()) {
              <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No se encontraron ciudades con ese nombre</p>
                <small>Intenta con otro nombre o verifica la ortografía</small>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Dashboard con Widgets (cuando hay municipio seleccionado) -->
        <div class="dashboard-content">
          <!-- Dashboard Header -->
          <header class="dashboard-header">
            <div class="location-info">
              <button class="back-btn" (click)="volverABusqueda()" title="Cambiar municipio">
                <i class="fas fa-arrow-left"></i>
              </button>
              <div class="location-details">
                <h2 class="location-name">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ municipioSeleccionado()!.nombre }}
                </h2>
                <p class="location-meta">
                  @if (municipioSeleccionado()!.provincia && municipioSeleccionado()!.ccaa) {
                    {{ municipioSeleccionado()!.provincia }}, {{ municipioSeleccionado()!.ccaa }}
                  } @else if (municipioSeleccionado()!.ccaa) {
                    {{ municipioSeleccionado()!.ccaa }}
                  } @else if (municipioSeleccionado()!.provincia) {
                    {{ municipioSeleccionado()!.provincia }}
                  }
                </p>
              </div>
            </div>
            
            <div class="header-actions">
              <button 
                class="action-button" 
                (click)="refreshAllWidgets()"
                [disabled]="isRefreshing()"
              >
                <i class="fas fa-sync-alt" [class.spinning]="isRefreshing()"></i>
                <span>Actualizar</span>
              </button>
              
              <button 
                class="action-button secondary"
                (click)="toggleLayoutMode()"
              >
                <i class="fas" [ngClass]="layoutMode() === 'grid' ? 'fa-list' : 'fa-th'"></i>
                <span>{{ layoutMode() === 'grid' ? 'Lista' : 'Grid' }}</span>
              </button>
            </div>
          </header>

          <!-- Widgets Grid -->
          <div 
            class="widgets-grid"
            [class.layout-grid]="layoutMode() === 'grid'"
            [class.layout-list]="layoutMode() === 'list'"
          >
            <!-- Temperature Widget -->
            @if (isWidgetEnabled('temperature')) {
              <div class="widget-wrapper" [style.grid-area]="'temp'">
                <app-temperature-widget
                  [size]="'large'"
                ></app-temperature-widget>
              </div>
            }

            <!-- Precipitation Widget -->
            @if (isWidgetEnabled('precipitation')) {
              <div class="widget-wrapper" [style.grid-area]="'precip'">
                <app-precipitation-widget
                  [size]="'medium'"
                ></app-precipitation-widget>
              </div>
            }

            <!-- Wind Widget -->
            @if (isWidgetEnabled('wind')) {
              <div class="widget-wrapper" [style.grid-area]="'wind'">
                <app-wind-widget
                  [size]="'medium'"
                ></app-wind-widget>
              </div>
            }

            <!-- UV Index Widget -->
            @if (isWidgetEnabled('uv')) {
              <div class="widget-wrapper" [style.grid-area]="'uv'">
                <app-uv-index-widget
                  [size]="'medium'"
                ></app-uv-index-widget>
              </div>
            }

            <!-- Sunrise/Sunset Widget -->
            @if (isWidgetEnabled('sunrise')) {
              <div class="widget-wrapper" [style.grid-area]="'sunrise'">
                <app-sunrise-sunset-widget
                  [size]="'medium'"
                ></app-sunrise-sunset-widget>
              </div>
            }

            <!-- Alerts Widget -->
            @if (isWidgetEnabled('alerts')) {
              <div class="widget-wrapper" [style.grid-area]="'alerts'">
                <app-alerts-widget
                  [size]="'large'"
                ></app-alerts-widget>
              </div>
            }
          </div>

          <!-- Dashboard Footer -->
          <footer class="dashboard-footer">
            <p class="footer-text">
              <i class="fas fa-info-circle"></i>
              Panel personalizable con widgets meteorológicos especializados
            </p>
            <button class="customize-btn" (click)="openCustomization()">
              <i class="fas fa-sliders-h"></i>
              Personalizar Dashboard
            </button>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 80vh;
    }

    /* ===== ESTADO DE BÚSQUEDA ===== */
    .search-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 2rem;
    }

    .search-panel {
      width: 100%;
      max-width: 600px;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border-radius: 24px;
      padding: 3rem;
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--glass-border);
      animation: fadeInUp 0.5s ease;
    }

    .search-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .search-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .search-title i {
      color: var(--accent-cyan);
      font-size: 1.75rem;
    }

    .search-subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .search-input-wrapper {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .search-icon {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 1.125rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 1.125rem 1.25rem 1.125rem 3.25rem;
      font-size: 1rem;
      border: 2px solid var(--border-medium);
      border-radius: 16px;
      background: var(--surface-dark);
      color: var(--text-primary);
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent-cyan);
      box-shadow: 0 0 0 4px rgba(93, 223, 255, 0.15);
    }

    .search-input::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
    }

    .clear-btn {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: var(--surface-light);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--text-secondary);
    }

    .clear-btn:hover {
      background: var(--accent-cyan);
      color: var(--background-dark);
      transform: translateY(-50%) scale(1.1);
    }

    .search-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .search-results {
      margin-top: 1rem;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.75rem 0;
      font-weight: 600;
    }

    .results-list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 400px;
      overflow-y: auto;
      border-radius: 12px;
      border: 1px solid var(--border-light);
    }

    .result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 1px solid var(--border-light);
      background: var(--surface-dark);
    }

    .result-item:last-child {
      border-bottom: none;
    }

    .result-item:hover {
      background: var(--surface-light);
      padding-left: 1.5rem;
    }

    .result-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .result-icon {
      color: var(--accent-cyan);
      font-size: 1.125rem;
    }

    .result-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .result-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .result-meta {
      font-size: 0.825rem;
      color: var(--text-secondary);
    }

    .result-arrow {
      color: var(--text-secondary);
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .result-item:hover .result-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    .no-results {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--text-secondary);
    }

    .no-results i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .no-results p {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .no-results small {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    /* ===== DASHBOARD CON WIDGETS ===== */
    .dashboard-content {
      animation: fadeIn 0.5s ease;
    }

    /* Dashboard Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border-radius: 24px;
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-xl);
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      background: var(--surface-light);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--accent-cyan);
      font-size: 1rem;
    }

    .back-btn:hover {
      background: var(--accent-cyan);
      color: var(--background-dark);
      transform: translateX(-4px);
    }

    .location-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .location-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .location-name i {
      color: var(--accent-cyan);
    }

    .location-meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(120deg, var(--accent-cyan) 0%, var(--primary-blue) 100%);
      border: none;
      border-radius: 12px;
      color: var(--background-dark);
      font-size: 0.925rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(93, 223, 255, 0.3);
    }

    .action-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(93, 223, 255, 0.4);
    }

    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-button.secondary {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: var(--text-primary);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }

    .action-button.secondary:hover {
      background: var(--surface-elevated);
      border-color: var(--accent-cyan);
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    /* Widgets Grid Layout */
    .widgets-grid {
      display: grid;
      gap: 1.75rem;
      margin-bottom: 2rem;
    }

    .widgets-grid.layout-grid {
      grid-template-columns: repeat(12, 1fr);
      grid-template-areas:
        "temp temp temp temp temp temp precip precip precip precip precip precip"
        "wind wind wind wind uv uv uv uv sunrise sunrise sunrise sunrise"
        "alerts alerts alerts alerts alerts alerts alerts alerts alerts alerts alerts alerts";
    }

    .widgets-grid.layout-list {
      grid-template-columns: 1fr;
      grid-template-areas:
        "temp"
        "precip"
        "wind"
        "uv"
        "sunrise"
        "alerts";
    }

    .widget-wrapper {
      animation: fadeInUp 0.5s ease-out backwards;
    }

    .widget-wrapper:nth-child(1) { animation-delay: 0.1s; }
    .widget-wrapper:nth-child(2) { animation-delay: 0.2s; }
    .widget-wrapper:nth-child(3) { animation-delay: 0.3s; }
    .widget-wrapper:nth-child(4) { animation-delay: 0.4s; }
    .widget-wrapper:nth-child(5) { animation-delay: 0.5s; }
    .widget-wrapper:nth-child(6) { animation-delay: 0.6s; }

    /* Dashboard Footer */
    .dashboard-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .footer-text i {
      color: var(--accent-cyan);
    }

    .customize-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .customize-btn:hover {
      background: var(--surface-elevated);
      border-color: var(--accent-cyan);
      transform: translateY(-2px);
    }

    /* ===== ANIMACIONES ===== */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .widgets-grid.layout-grid {
        grid-template-columns: repeat(6, 1fr);
        grid-template-areas:
          "temp temp temp temp temp temp"
          "precip precip precip wind wind wind"
          "uv uv uv sunrise sunrise sunrise"
          "alerts alerts alerts alerts alerts alerts";
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .search-panel {
        padding: 2rem 1.5rem;
      }

      .search-title {
        font-size: 1.5rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem;
      }

      .header-actions {
        width: 100%;
      }

      .action-button {
        flex: 1;
        justify-content: center;
      }

      .widgets-grid.layout-grid {
        grid-template-columns: 1fr;
        grid-template-areas:
          "temp"
          "precip"
          "wind"
          "uv"
          "sunrise"
          "alerts";
      }

      .dashboard-footer {
        flex-direction: column;
        align-items: flex-start;
      }

      .customize-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Scrollbar personalizado */
    .results-list::-webkit-scrollbar {
      width: 6px;
    }

    .results-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .results-list::-webkit-scrollbar-thumb {
      background: rgba(46, 77, 238, 0.3);
      border-radius: 3px;
    }

    .results-list::-webkit-scrollbar-thumb:hover {
      background: rgba(46, 77, 238, 0.5);
    }
  `]
})
export class WeatherDashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private weatherService = inject(WeatherService);
  
  // Signals para estado
  municipioSeleccionado = signal<Municipio | null>(null);
  searchQuery = signal('');
  municipiosFiltrados = signal<Municipio[]>([]);
  isSearching = signal(false);
  layoutMode = signal<'grid' | 'list'>('grid');
  isRefreshing = signal(false);
  
  // Datos
  private todosLosMunicipios: Municipio[] = [];
  
  // Subjects para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  enabledWidgets: Set<string> = new Set([
    'temperature',
    'precipitation',
    'wind',
    'uv',
    'sunrise',
    'alerts'
  ]);

  constructor() {
    // Configurar búsqueda con debounce igual que home y comparison
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filtrarMunicipios(query);
      this.isSearching.set(false);
    });
  }

  ngOnInit(): void {
    this.cargarMunicipios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarMunicipios(): void {
    this.weatherService.getMunicipios().subscribe({
      next: (data) => {
        this.todosLosMunicipios = data;
        console.log(`${data.length} municipios cargados para dashboard`);
      },
      error: (error) => {
        console.error('Error cargando municipios:', error);
      }
    });
  }

  onSearchInput(): void {
    const query = this.searchQuery().trim();
    
    if (!query) {
      this.municipiosFiltrados.set([]);
      this.isSearching.set(false);
      return;
    }

    if (query.length < 2) {
      return;
    }

    this.isSearching.set(true);
    this.searchSubject.next(query);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private filtrarMunicipios(query: string): void {
    if (!query || query.length < 2) {
      this.municipiosFiltrados.set([]);
      return;
    }
    
    const normalizedQuery = this.normalizeText(query);
    
    // Primero buscar en lista local
    const municipiosLocales = this.todosLosMunicipios
      .filter(m => {
        if (!m || !m.nombre) return false;
        const normalizedNombre = this.normalizeText(m.nombre);
        const normalizedProvincia = m.provincia ? this.normalizeText(m.provincia) : '';
        const normalizedCapital = m.capital ? this.normalizeText(m.capital) : '';
        
        return normalizedNombre.includes(normalizedQuery) ||
               normalizedProvincia.includes(normalizedQuery) ||
               normalizedCapital.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const normalizedA = this.normalizeText(a.nombre);
        const normalizedB = this.normalizeText(b.nombre);
        const aStartsWith = normalizedA.startsWith(normalizedQuery);
        const bStartsWith = normalizedB.startsWith(normalizedQuery);
        
        // Priorizar los que empiezan con el query
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Orden alfabético
        return a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 10);
    
    if (municipiosLocales.length > 0) {
      this.municipiosFiltrados.set(municipiosLocales);
    } else {
      // Si no hay resultados locales, buscar en API
      this.weatherService.searchMunicipios(query).subscribe({
        next: (municipios) => {
          this.municipiosFiltrados.set(municipios.slice(0, 10));
        },
        error: (error) => {
          console.error('Error buscando municipios:', error);
          this.municipiosFiltrados.set([]);
        }
      });
    }
  }

  onSearchFocus(): void {
    const query = this.searchQuery().trim();
    if (query && query.length >= 2 && this.municipiosFiltrados().length === 0) {
      this.onSearchInput();
    }
  }

  onSearchBlur(): void {
    // Pequeño delay para permitir clicks en resultados
    setTimeout(() => {
      // No limpiar resultados aquí, solo si se selecciona un municipio
    }, 200);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.municipiosFiltrados.set([]);
  }

  seleccionarMunicipio(municipio: Municipio): void {
    this.municipioSeleccionado.set(municipio);
    this.searchQuery.set('');
    this.municipiosFiltrados.set([]);
    console.log('Municipio seleccionado:', municipio.nombre);
  }

  volverABusqueda(): void {
    this.municipioSeleccionado.set(null);
    this.searchQuery.set('');
    this.municipiosFiltrados.set([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isWidgetEnabled(widgetId: string): boolean {
    return this.enabledWidgets.has(widgetId);
  }

  toggleLayoutMode(): void {
    this.layoutMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  refreshAllWidgets(): void {
    this.isRefreshing.set(true);
    console.log('Refreshing all widgets...');
    
    setTimeout(() => {
      this.isRefreshing.set(false);
      console.log('All widgets refreshed');
    }, 1500);
  }

  openCustomization(): void {
    console.log('Opening dashboard customization...');
    // TODO: Implementar modal de personalización
  }
}
