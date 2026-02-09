import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { GamificationService } from '../../services/gamification.service';
import { WeatherService } from '../../services/weather.service';
import { Municipio } from '../../models/municipio.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

/**
 * Interface para datos de ciudad en comparación
 */
interface CityWeatherData {
  id: string;
  name: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  pressure: number;
  uvIndex: number;
  condition: string;
  icon: string;
  hourlyTemps: number[];
  hourlyWind: number[];
  hourlyPrecipitation: number[];
  hourlyHumidity: number[];
  hourlyLabels: string[];
}

/**
 * Componente de Comparación de Ciudades
 * Permite comparar datos meteorológicos de múltiples ciudades
 */
@Component({
  selector: 'app-city-comparison',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comparison-container">
      <!-- Header -->
      <header class="comparison-header">
        <div class="title-section">
          <button class="back-btn" (click)="onClose()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 class="title">Comparación de Ciudades</h2>
            <p class="subtitle">Compara el tiempo de hasta 3 ciudades</p>
          </div>
        </div>

        <div class="city-selector">
          <div class="search-wrapper">
            <i class="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar ciudad..."
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (keyup.enter)="addCity()"
              (focus)="onSearchFocus()"
              (blur)="onSearchBlur()"
              class="search-input"
            />
            
            <!-- Dropdown de resultados -->
            @if (showSearchResults && municipiosFiltrados.length > 0) {
              <div class="search-results">
                @for (municipio of municipiosFiltrados; track municipio.id) {
                  <button
                    class="search-result-item"
                    (click)="seleccionarMunicipio(municipio)"
                  >
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="result-info">
                      <div class="result-name">{{ municipio.nombre }}</div>
                      <div class="result-provincia">{{ municipio.provincia }}</div>
                    </div>
                  </button>
                }
              </div>
            }
            
            <!-- Mensaje sin resultados -->
            @if (showSearchResults && searchQuery.length > 0 && municipiosFiltrados.length === 0 && !isLoadingMunicipios) {
              <div class="search-results">
                <div class="no-results">
                  <i class="fas fa-search"></i>
                  <span>No se encontraron ciudades</span>
                </div>
              </div>
            }
          </div>
          <button 
            class="add-btn"
            [disabled]="cities().length >= 3 || !searchQuery"
            (click)="addCity()"
          >
            <i class="fas fa-plus"></i>
            Agregar
          </button>
        </div>
      </header>

      <!-- Cities Grid -->
      @if (cities().length === 0) {
        <div class="empty-state">
          <i class="fas fa-city"></i>
          <h3>No hay ciudades seleccionadas</h3>
          <p>Agrega hasta 3 ciudades para comparar sus condiciones meteorológicas</p>
        </div>
      } @else {
        <div class="cities-grid">
          @for (city of cities(); track city.id) {
            <article class="city-card">
              <!-- Header de Ciudad -->
              <header class="city-header">
                <div class="city-info">
                  <h3 class="city-name">{{ city.name }}</h3>
                  <span class="country-badge">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ city.country }}
                  </span>
                </div>
                <button class="remove-btn" (click)="removeCity(city.id)">
                  <i class="fas fa-times"></i>
                </button>
              </header>

              <!-- Condición Principal -->
              <div class="main-condition">
                <div class="temp-display">
                  <span class="temp-value">{{ city.temperature }}°</span>
                  <div class="condition-info">
                    <i [ngClass]="city.icon"></i>
                    <span>{{ city.condition }}</span>
                  </div>
                </div>
                <div class="feels-like">
                  Sensación: {{ city.feelsLike }}°C
                </div>
              </div>

              <!-- Métricas -->
              <div class="metrics-grid">
                <div class="metric-item">
                  <i class="fas fa-tint"></i>
                  <div class="metric-content">
                    <span class="metric-label">Humedad</span>
                    <span class="metric-value">{{ city.humidity }}%</span>
                  </div>
                </div>

                <div class="metric-item">
                  <i class="fas fa-wind"></i>
                  <div class="metric-content">
                    <span class="metric-label">Viento</span>
                    <span class="metric-value">{{ city.windSpeed }} km/h</span>
                  </div>
                </div>

                <div class="metric-item">
                  <i class="fas fa-cloud-rain"></i>
                  <div class="metric-content">
                    <span class="metric-label">Precipitación</span>
                    <span class="metric-value">{{ city.precipitation }}%</span>
                  </div>
                </div>

                <div class="metric-item">
                  <i class="fas fa-compress-arrows-alt"></i>
                  <div class="metric-content">
                    <span class="metric-label">Presión</span>
                    <span class="metric-value">{{ city.pressure }} hPa</span>
                  </div>
                </div>
              </div>

              <!-- Mini gráfico de temperatura por hora -->
              <div class="hourly-preview">
                <h4 class="preview-title">Próximas 24 horas</h4>
                <canvas [id]="'chart-' + city.id" class="mini-chart"></canvas>
              </div>
            </article>
          }
        </div>

        <!-- Gráfico de Comparación Global -->
        <section class="comparison-charts">
          <div class="chart-controls">
            <h3 class="chart-title">Comparación Detallada</h3>
            <div class="metric-toggles">
              <button
                class="metric-toggle"
                [class.active]="activeMetric() === 'temperature'"
                (click)="setActiveMetric('temperature')"
              >
                <i class="fas fa-thermometer-half"></i>
                Temperatura
              </button>
              <button
                class="metric-toggle"
                [class.active]="activeMetric() === 'wind'"
                (click)="setActiveMetric('wind')"
              >
                <i class="fas fa-wind"></i>
                Viento
              </button>
              <button
                class="metric-toggle"
                [class.active]="activeMetric() === 'precipitation'"
                (click)="setActiveMetric('precipitation')"
              >
                <i class="fas fa-cloud-rain"></i>
                Precipitación
              </button>
              <button
                class="metric-toggle"
                [class.active]="activeMetric() === 'humidity'"
                (click)="setActiveMetric('humidity')"
              >
                <i class="fas fa-tint"></i>
                Humedad
              </button>
            </div>
          </div>

          <div class="main-chart-wrapper">
            <canvas id="comparison-chart"></canvas>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .comparison-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Header */
    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: var(--gradient-ethereal-alt);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-lg);
      flex-wrap: wrap;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(100, 149, 237, 0.1);
      border: 1px solid rgba(100, 149, 237, 0.2);
      border-radius: 12px;
      color: var(--primary-blue);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(100, 149, 237, 0.2);
      transform: translateX(-4px);
    }

    .back-btn i {
      font-size: 1.125rem;
    }

    .title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .city-selector {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-wrapper {
      position: relative;
    }

    .search-wrapper i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      opacity: 0.6;
    }

    .search-input {
      width: 300px;
      padding: 0.875rem 1rem 0.875rem 2.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-blue);
      background: rgba(255, 255, 255, 0.08);
    }

    .search-input::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
    }

    /* Dropdown de resultados de búsqueda */
    .search-results {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      right: 0;
      background: rgba(30, 30, 45, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      border-radius: 12px;
      box-shadow: var(--shadow-xl);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      animation: fadeInDown 0.3s ease;
    }

    .search-result-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .search-result-item:hover {
      background: rgba(100, 149, 237, 0.1);
    }

    .search-result-item i {
      color: var(--primary-blue);
      font-size: 0.875rem;
      opacity: 0.6;
    }

    .result-info {
      flex: 1;
    }

    .result-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .result-provincia {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }

    .no-results {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .no-results i {
      opacity: 0.4;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .add-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(100, 149, 237, 0.4);
    }

    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 24px;
      border: 2px dashed var(--border-light);
    }

    .empty-state i {
      font-size: 4rem;
      color: var(--primary-blue);
      opacity: 0.4;
      margin-bottom: 1.5rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 500px;
    }

    /* Cities Grid */
    .cities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .city-card {
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      padding: 1.5rem;
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease;
    }

    .city-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-xl);
      border-color: var(--border-glow);
    }

    .city-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-light);
    }

    .city-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .city-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .country-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(100, 149, 237, 0.1);
      border: 1px solid rgba(100, 149, 237, 0.2);
      border-radius: 8px;
      color: var(--primary-blue);
      font-size: 0.8rem;
      font-weight: 600;
      width: fit-content;
    }

    .remove-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      color: #ef4444;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .remove-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: rotate(90deg);
    }

    .main-condition {
      margin-bottom: 1.5rem;
    }

    .temp-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .temp-value {
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .condition-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .condition-info i {
      font-size: 2.5rem;
      color: var(--primary-blue);
    }

    .feels-like {
      font-size: 0.95rem;
      color: var(--text-secondary);
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      text-align: center;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid var(--border-light);
    }

    .metric-item i {
      font-size: 1.25rem;
      color: var(--primary-blue);
      opacity: 0.8;
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .metric-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .hourly-preview {
      padding-top: 1rem;
      border-top: 1px solid var(--border-light);
    }

    .preview-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mini-chart {
      height: 120px !important;
      max-height: 120px;
    }

    /* Comparison Charts */
    .comparison-charts {
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      padding: 2rem;
      animation: fadeInUp 0.6s ease 0.2s backwards;
    }

    .chart-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .chart-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .metric-toggles {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .metric-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .metric-toggle:hover {
      background: rgba(100, 149, 237, 0.1);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
    }

    .metric-toggle.active {
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
      border-color: var(--primary-blue);
      color: white;
      box-shadow: 0 4px 12px rgba(100, 149, 237, 0.3);
    }

    .main-chart-wrapper {
      height: 400px;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 16px;
    }

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

    @media (max-width: 1200px) {
      .comparison-header {
        flex-direction: column;
        align-items: stretch;
      }

      .title-section {
        width: 100%;
      }

      .city-selector {
        width: 100%;
        flex-direction: column;
      }

      .search-wrapper {
        width: 100%;
      }

      .search-input {
        width: 100%;
      }

      .add-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .cities-grid {
        grid-template-columns: 1fr;
      }

      .metric-toggles {
        width: 100%;
      }

      .metric-toggle {
        flex: 1;
        justify-content: center;
      }

      .main-chart-wrapper {
        height: 300px;
      }
    }
  `]
})
export class CityComparisonComponent implements OnInit, OnDestroy {
  cities = signal<CityWeatherData[]>([]);
  searchQuery = '';
  activeMetric = signal<'temperature' | 'wind' | 'precipitation' | 'humidity'>('temperature');
  
  // Propiedades de búsqueda
  showSearchResults = false;
  municipiosFiltrados: Municipio[] = [];
  todosLosMunicipios: Municipio[] = [];
  isLoadingMunicipios = true;
  
  private miniCharts: Map<string, Chart> = new Map();
  private comparisonChart?: Chart;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private gamificationService: GamificationService,
    private weatherService: WeatherService,
    private cdr: ChangeDetectorRef
  ) {
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filtrarMunicipios(query);
    });
  }

  ngOnInit(): void {
    // Cargar lista de municipios
    this.weatherService.getMunicipios().subscribe({
      next: (municipios) => {
        this.todosLosMunicipios = municipios;
        this.isLoadingMunicipios = false;
      },
      error: () => {
        this.isLoadingMunicipios = false;
      }
    });
  }

  createMiniCharts(): void {
    this.cities().forEach(city => {
      // Si ya existe un gráfico para esta ciudad, destruirlo primero
      const existingChart = this.miniCharts.get(city.id);
      if (existingChart) {
        existingChart.destroy();
        this.miniCharts.delete(city.id);
      }

      const canvas = document.getElementById(`chart-${city.id}`) as HTMLCanvasElement;
      if (!canvas) return;

      const gradient = canvas.getContext('2d')?.createLinearGradient(0, 0, 0, 120);
      if (gradient) {
        gradient.addColorStop(0, 'rgba(100, 149, 237, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 149, 237, 0.0)');
      }

      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: city.hourlyLabels,
          datasets: [{
            data: city.hourlyTemps,
            borderColor: '#2E4DEE',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.y}°C`
              }
            }
          },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      };

      const chart = new Chart(canvas, config);
      this.miniCharts.set(city.id, chart);
    });
  }

  createComparisonChart(): void {
    const canvas = document.getElementById('comparison-chart') as HTMLCanvasElement;
    if (!canvas) return;

    this.updateComparisonChart();
  }

  updateComparisonChart(): void {
    const canvas = document.getElementById('comparison-chart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.comparisonChart) {
      this.comparisonChart.destroy();
    }

    const citiesData = this.cities();
    if (citiesData.length === 0) return;

    const metric = this.activeMetric();
    const datasets = citiesData.map((city, index) => {
      const colors = ['#2E4DEE', '#FF6B6B', '#00E396'];
      let data: number[];

      switch (metric) {
        case 'temperature':
          data = city.hourlyTemps;
          break;
        case 'wind':
          data = city.hourlyWind;
          break;
        case 'precipitation':
          data = city.hourlyPrecipitation;
          break;
        case 'humidity':
          data = city.hourlyHumidity;
          break;
        default:
          data = city.hourlyTemps;
      }

      return {
        label: city.name,
        data: data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      };
    });

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.cities()[0]?.hourlyLabels || [],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#e0e0e0',
              font: { size: 14, weight: 'bold' },
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value === null || value === undefined) return label;
                const unit = metric === 'temperature' ? '°C' : 
                           metric === 'wind' ? ' km/h' :
                           metric === 'precipitation' ? '%' : '%';
                return `${label}: ${value.toFixed(1)}${unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#a0a0a0' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#a0a0a0' }
          }
        }
      }
    };

    this.comparisonChart = new Chart(canvas, config);
  }

  addCity(): void {
    if (!this.searchQuery || this.cities().length >= 3) return;

    // Buscar el primer municipio filtrado
    if (this.municipiosFiltrados.length > 0) {
      this.seleccionarMunicipio(this.municipiosFiltrados[0]);
    }
  }

  /**
   * Maneja el input de búsqueda con debounce
   */
  onSearchInput(): void {
    this.showSearchResults = this.searchQuery.length > 0;
    if (this.searchQuery.length > 0) {
      this.searchSubject.next(this.searchQuery);
    } else {
      this.municipiosFiltrados = [];
    }
  }

  /**
   * Normaliza texto removiendo acentos para mejor búsqueda
   */
  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Filtra municipios localmente o mediante API
   */
  private filtrarMunicipios(query: string): void {
    if (!query || query.length < 2) {
      this.municipiosFiltrados = [];
      return;
    }

    const queryNormalizada = this.normalizeText(query);

    // Primero buscar en lista local
    const resultadosLocales = this.todosLosMunicipios
      .filter(m => {
        const nombreNormalizado = this.normalizeText(m.nombre);
        return nombreNormalizado.includes(queryNormalizada);
      })
      .sort((a, b) => {
        const aNorm = this.normalizeText(a.nombre);
        const bNorm = this.normalizeText(b.nombre);
        const aStartsWith = aNorm.startsWith(queryNormalizada);
        const bStartsWith = bNorm.startsWith(queryNormalizada);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return aNorm.localeCompare(bNorm);
      })
      .slice(0, 10);

    if (resultadosLocales.length > 0) {
      this.municipiosFiltrados = resultadosLocales;
    } else {
      // Si no hay resultados locales, buscar en API
      this.weatherService.searchMunicipios(query).subscribe({
        next: (municipios) => {
          this.municipiosFiltrados = municipios.slice(0, 10);
        },
        error: () => {
          this.municipiosFiltrados = [];
        }
      });
    }
  }

  /**
   * Selecciona un municipio y busca su clima
   */
  seleccionarMunicipio(municipio: Municipio): void {
    if (this.cities().length >= 3) return;

    // Trackear acción para gamificación
    this.gamificationService.trackAction('compare_cities');

    // Cerrar dropdown
    this.showSearchResults = false;
    this.searchQuery = '';
    this.municipiosFiltrados = [];

    // Obtener datos reales del clima
    this.weatherService.getWeatherForecast(municipio).subscribe({
      next: (weatherData: any) => {
        const hourlyData = weatherData.hourly.slice(0, 24);
        const currentUV = hourlyData[0]?.uvIndex || 0;

        const newCity: CityWeatherData = {
          id: Date.now().toString(),
          name: municipio.nombre,
          country: 'España',
          temperature: Math.round(weatherData.current.temperature),
          feelsLike: Math.round(weatherData.current.apparentTemperature),
          humidity: weatherData.current.humidity,
          windSpeed: Math.round(weatherData.current.windSpeed),
          precipitation: hourlyData[0]?.precipitationProbability || 0,
          pressure: Math.round(weatherData.current.pressureMsl || weatherData.current.surfacePressure || 1013),
          uvIndex: currentUV,
          condition: this.getConditionFromWeatherCode(weatherData.current.weatherCode, weatherData.current.isDay),
          icon: this.getIconFromWeatherCode(weatherData.current.weatherCode, weatherData.current.isDay),
          hourlyTemps: hourlyData.map((h: any) => Math.round(h.temperature)),
          hourlyWind: hourlyData.map((h: any) => Math.round(h.windSpeed)),
          hourlyPrecipitation: hourlyData.map((h: any) => h.precipitationProbability || 0),
          hourlyHumidity: hourlyData.map((h: any) => h.humidity),
          hourlyLabels: hourlyData.map((h: any) => new Date(h.time).getHours().toString().padStart(2, '0'))
        };

        this.cities.update(cities => [...cities, newCity]);
        this.cdr.detectChanges(); // Forzar render del DOM antes de crear charts

        setTimeout(() => {
          this.createMiniCharts();
          this.updateComparisonChart();
        }, 200);
      },
      error: (err: any) => {
        console.error('Error cargando datos del clima:', err);
        // En caso de error, mostrar mensaje al usuario
        alert('No se pudo cargar el clima para ' + municipio.nombre);
      }
    });
  }

  /**
   * Maneja el blur del input de búsqueda
   */
  onSearchBlur(): void {
    // Pequeño delay para permitir clicks en resultados
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  /**
   * Maneja el focus del input de búsqueda
   */
  onSearchFocus(): void {
    if (this.searchQuery.length > 0 && this.municipiosFiltrados.length > 0) {
      this.showSearchResults = true;
    }
  }


  removeCity(id: string): void {
    const chart = this.miniCharts.get(id);
    if (chart) {
      chart.destroy();
      this.miniCharts.delete(id);
    }

    this.cities.update(cities => cities.filter(c => c.id !== id));
    
    setTimeout(() => {
      this.updateComparisonChart();
    }, 100);
  }

  setActiveMetric(metric: 'temperature' | 'wind' | 'precipitation' | 'humidity'): void {
    this.activeMetric.set(metric);
    setTimeout(() => {
      this.updateComparisonChart();
    }, 100);
  }

  onClose(): void {
    console.log('Closing city comparison');
    // TODO: Implementar navegación o cerrar modal
  }

  /**
   * Convierte weather code WMO a condición legible
   */
  private getConditionFromWeatherCode(code: number, isDay?: number): string {
    const hour = isDay ? 12 : 0; // Simulamos hora diurna o nocturna
    if (code === 0) return hour >= 6 && hour <= 20 ? 'Despejado' : 'Noche despejada';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 48) return 'Niebla';
    if (code <= 57) return 'Llovizna';
    if (code <= 67) return 'Lluvia';
    if (code <= 77) return 'Nieve';
    if (code <= 82) return 'Chubascos';
    if (code <= 86) return 'Nieve intensa';
    if (code >= 95) return 'Tormenta';
    return 'Nublado';
  }

  /**
   * Convierte weather code WMO a icono FontAwesome
   */
  private getIconFromWeatherCode(code: number, isDay?: number): string {
    const hour = isDay ? 12 : 0;
    if (code === 0) return hour >= 6 && hour <= 20 ? 'fas fa-sun' : 'fas fa-moon';
    if (code <= 3) return hour >= 6 && hour <= 20 ? 'fas fa-cloud-sun' : 'fas fa-cloud-moon';
    if (code <= 48) return 'fas fa-smog';
    if (code <= 57) return 'fas fa-cloud-rain';
    if (code <= 67) return 'fas fa-cloud-showers-heavy';
    if (code <= 77) return 'fas fa-snowflake';
    if (code <= 82) return 'fas fa-cloud-showers-heavy';
    if (code <= 86) return 'fas fa-snowflake';
    if (code >= 95) return 'fas fa-bolt';
    return 'fas fa-cloud';
  }

  ngOnDestroy(): void {
    // Completar Subject para cancelar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar todos los gráficos
    this.miniCharts.forEach(chart => chart.destroy());
    if (this.comparisonChart) {
      this.comparisonChart.destroy();
    }
  }
}
