import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchWeatherComponent } from '../search-weather/search-weather.component';
import { TimelineService } from '../../services/timeline.service';
import { WeatherService } from '../../services/weather.service';
import { GamificationService } from '../../services/gamification.service';
import { TimelineDataPoint, TimelineEvent, TimelineMetric, PlaybackState } from '../../models/timeline.model';
import { Municipio } from '../../models/municipio.model';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { gsap } from 'gsap';
import * as d3 from 'd3';

/**
 * Componente de Timeline Meteorológico Interactivo
 * Visualiza predicciones temporales con controles de reproducción
 */
@Component({
  selector: 'app-weather-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SearchWeatherComponent],
  template: `
    <!-- Pantalla de búsqueda de municipio -->
    @if (!selectedMunicipio()) {
      <div class="timeline-search-screen">
        <div class="search-hero">
          <div class="search-icon-wrapper">
            <i class="fas fa-clock"></i>
          </div>
          <h1 class="search-title">Timeline Meteorológico</h1>
          <p class="search-subtitle">Busca un municipio para ver su evolución meteorológica en tiempo real</p>

          <app-search-weather
            [showHistory]="true"
            [showPopularSuggestions]="true"
            [showLocationButton]="false"
            [placeholder]="'Escribe el nombre de un municipio...'"
            (municipioSelected)="onMunicipioSelected($event)"
          ></app-search-weather>

          @if (isLoadingTimeline()) {
            <div class="search-loading">
              <div class="spinner"></div>
              <span>Cargando timeline...</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Timeline completo (visible tras selección) -->
    @if (selectedMunicipio()) {
    <div class="timeline-container">
      <!-- Header con controles principales -->
      <header class="timeline-header">
        <div class="title-section">
          <button class="back-btn" (click)="goBack()" title="Cambiar municipio">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 class="title">
              <i class="fas fa-clock"></i>
              {{ selectedMunicipio()!.nombre }}
            </h2>
            <p class="subtitle">Timeline meteorológico · {{ selectedMunicipio()!.provincia }}</p>
          </div>
        </div>

        <!-- Mode Selector -->
        <div class="mode-selector">
          <button
            class="mode-btn"
            [class.active]="mode() === 'hourly'"
            (click)="setMode('hourly')"
          >
            <i class="fas fa-hourglass-half"></i>
            Por Horas
          </button>
          <button
            class="mode-btn"
            [class.active]="mode() === 'daily'"
            (click)="setMode('daily')"
          >
            <i class="fas fa-calendar-day"></i>
            Por Días
          </button>
          <button
            class="mode-btn"
            [class.active]="mode() === 'weekly'"
            (click)="setMode('weekly')"
          >
            <i class="fas fa-calendar-week"></i>
            Semanal
          </button>
        </div>
      </header>

      <!-- Visualización principal -->
      <div class="timeline-visualization">
        <!-- Canvas SVG para D3 -->
        <svg #timelineSvg class="timeline-svg"></svg>

        <!-- Overlay con cursor y datos actuales -->
        @if (currentData()) {
          <div class="current-data-overlay" [style.left.%]="cursorPosition()">
            <div class="data-card">
              <div class="data-time">
                {{ formatTime(currentData()!.timestamp) }}
              </div>
              <div class="data-metrics">
                <div class="metric">
                  <i class="fas fa-thermometer-half"></i>
                  <span>{{ currentData()!.temperature }}°C</span>
                </div>
                <div class="metric">
                  <i class="fas fa-cloud-rain"></i>
                  <span>{{ currentData()!.precipitation }}%</span>
                </div>
                <div class="metric">
                  <i class="fas fa-wind"></i>
                  <span>{{ currentData()!.windSpeed }} km/h</span>
                </div>
              </div>
              <div class="data-condition">
                <i [ngClass]="currentData()!.icon"></i>
                {{ currentData()!.condition }}
              </div>
            </div>
          </div>
        }

        <!-- Marcadores de eventos -->
        <div class="events-layer">
          @for (event of visibleEvents(); track event.id) {
            <div
              class="event-marker"
              [class]="'event-' + event.type"
              [style.left.%]="getEventPosition(event)"
              [style.background]="event.color"
              [title]="event.title"
              (click)="selectEvent(event)"
            >
              <i [ngClass]="event.icon"></i>
            </div>
          }
        </div>
      </div>

      <!-- Metrics Toggles -->
      <div class="metrics-panel">
        <h4 class="panel-title">Métricas Visibles</h4>
        <div class="metrics-toggles">
          <button
            class="metric-toggle"
            [class.active]="isMetricSelected('temperature')"
            (click)="toggleMetric('temperature')"
          >
            <i class="fas fa-thermometer-half"></i>
            Temperatura
            <span class="metric-color" style="background: #5DDFFF;"></span>
          </button>
          <button
            class="metric-toggle"
            [class.active]="isMetricSelected('precipitation')"
            (click)="toggleMetric('precipitation')"
          >
            <i class="fas fa-cloud-rain"></i>
            Precipitación
            <span class="metric-color" style="background: #2E4DEE;"></span>
          </button>
          <button
            class="metric-toggle"
            [class.active]="isMetricSelected('wind')"
            (click)="toggleMetric('wind')"
          >
            <i class="fas fa-wind"></i>
            Viento
            <span class="metric-color" style="background: #87CEEB;"></span>
          </button>
          <button
            class="metric-toggle"
            [class.active]="isMetricSelected('humidity')"
            (click)="toggleMetric('humidity')"
          >
            <i class="fas fa-tint"></i>
            Humedad
            <span class="metric-color" style="background: #4DD4E8;"></span>
          </button>
          <button
            class="metric-toggle"
            [class.active]="isMetricSelected('uvIndex')"
            (click)="toggleMetric('uvIndex')"
          >
            <i class="fas fa-sun"></i>
            UV Index
            <span class="metric-color" style="background: #dc2626;"></span>
          </button>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls">
        <div class="control-buttons">
          <button
            class="control-btn stop"
            (click)="stop()"
            title="Detener"
          >
            <i class="fas fa-stop"></i>
          </button>

          <button
            class="control-btn play-pause"
            (click)="togglePlayPause()"
            [title]="isPlaying() ? 'Pausar' : 'Reproducir'"
          >
            <i [ngClass]="isPlaying() ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>

          <button
            class="control-btn loop"
            [class.active]="isLooping()"
            (click)="toggleLoop()"
            title="Repetir"
          >
            <i class="fas fa-redo"></i>
          </button>
        </div>

        <!-- Speed Control -->
        <div class="speed-control">
          <label class="speed-label">
            <i class="fas fa-tachometer-alt"></i>
            Velocidad: {{ playbackSpeed() }}x
          </label>
          <div class="speed-buttons">
            <button
              class="speed-btn"
              [class.active]="playbackSpeed() === 0.5"
              (click)="setSpeed(0.5)"
            >0.5x</button>
            <button
              class="speed-btn"
              [class.active]="playbackSpeed() === 1"
              (click)="setSpeed(1)"
            >1x</button>
            <button
              class="speed-btn"
              [class.active]="playbackSpeed() === 2"
              (click)="setSpeed(2)"
            >2x</button>
            <button
              class="speed-btn"
              [class.active]="playbackSpeed() === 4"
              (click)="setSpeed(4)"
            >4x</button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <input
            type="range"
            class="progress-bar"
            min="0"
            max="100"
            [value]="progress()"
            (input)="onProgressChange($event)"
          />
          <div class="time-labels">
            <span class="time-start">{{ formatTime(timeRange().start) }}</span>
            <span class="time-current">{{ formatTime(currentTime()) }}</span>
            <span class="time-end">{{ formatTime(timeRange().end) }}</span>
          </div>
        </div>
      </div>

      <!-- Selected Event Details -->
      @if (selectedEvent()) {
        <div class="event-details-card">
          <button class="close-btn" (click)="closeEventDetails()">
            <i class="fas fa-times"></i>
          </button>
          <div class="event-header">
            <i [ngClass]="selectedEvent()!.icon" [style.color]="selectedEvent()!.color"></i>
            <h3>{{ selectedEvent()!.title }}</h3>
          </div>
          @if (selectedEvent()!.description) {
            <p class="event-description">{{ selectedEvent()!.description }}</p>
          }
          <div class="event-meta">
            <span class="event-time">
              <i class="fas fa-clock"></i>
              {{ formatTime(selectedEvent()!.timestamp) }}
            </span>
            @if (selectedEvent()!.severity) {
              <span class="event-severity" [class]="'severity-' + selectedEvent()!.severity">
                {{ getSeverityLabel(selectedEvent()!.severity!) }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Loading overlay -->
      @if (isLoadingTimeline()) {
        <div class="timeline-loading-overlay">
          <div class="spinner large"></div>
          <p>Cargando datos meteorológicos...</p>
        </div>
      }
    </div>
    }
  `,
  styles: [`
    /* ===== PANTALLA DE BÚSQUEDA ===== */
    .timeline-search-screen {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .search-hero {
      text-align: center;
      max-width: 600px;
      width: 100%;
    }

    .search-icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15));
      border: 1px solid rgba(59, 130, 246, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: #3b82f6;
    }

    .search-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary, #fff);
      margin: 0 0 0.5rem;
    }

    .search-subtitle {
      font-size: 1rem;
      color: var(--text-secondary, rgba(255,255,255,0.6));
      margin: 0 0 2rem;
      line-height: 1.5;
    }

    .search-box-wrapper {
      position: relative;
      width: 100%;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 0 1.25rem;
      transition: all 0.3s ease;
    }

    .search-box:focus-within {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-icon {
      color: rgba(255, 255, 255, 0.4);
      font-size: 1rem;
      margin-right: 0.75rem;
    }

    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text-primary, #fff);
      font-size: 1.1rem;
      font-family: inherit;
      padding: 1rem 0;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .search-clear {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.5);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .search-clear:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .search-results-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.97);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      z-index: 100;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      max-height: 400px;
      overflow-y: auto;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-primary, #fff);
      font-family: inherit;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .search-result-item:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .result-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .result-info i {
      color: #3b82f6;
      font-size: 0.85rem;
      opacity: 0.7;
    }

    .result-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .result-name {
      font-weight: 600;
    }

    .result-province {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .result-arrow {
      color: rgba(255, 255, 255, 0.2);
      font-size: 0.75rem;
    }

    .search-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner.large {
      width: 40px;
      height: 40px;
      border-width: 3px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Back button */
    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.25s ease;
      flex-shrink: 0;
    }

    .back-btn:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }

    /* Timeline loading overlay */
    .timeline-loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 12, 21, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      z-index: 1000;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
    }

    /* ===== TIMELINE ===== */
    .timeline-container {
      padding: 2rem;
      max-width: 1800px;
      margin: 0 auto;
    }

    /* Header */
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: var(--gradient-ethereal-alt);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-lg);
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .title i {
      color: var(--primary-blue);
    }

    .subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .mode-selector {
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem;
      border-radius: 12px;
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: 1px solid var(--border-light);
      border-radius: 10px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .mode-btn:hover {
      background: rgba(100, 149, 237, 0.1);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
    }

    .mode-btn.active {
      background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
      border-color: var(--primary-blue);
      color: white;
      box-shadow: 0 4px 12px rgba(100, 149, 237, 0.3);
    }

    /* Visualization */
    .timeline-visualization {
      position: relative;
      width: 100%;
      height: 500px;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      padding: 2rem;
      margin-bottom: 2rem;
      overflow: hidden;
    }

    .timeline-svg {
      width: 100%;
      height: 100%;
    }

    .current-data-overlay {
      position: absolute;
      top: 1rem;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
    }

    .data-card {
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: var(--shadow-xl);
      min-width: 220px;
      pointer-events: auto;
    }

    .data-time {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
      text-align: center;
    }

    .data-metrics {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-light);
    }

    .metric {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .metric i {
      width: 20px;
      color: var(--primary-blue);
    }

    .data-condition {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(100, 149, 237, 0.1);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .data-condition i {
      color: var(--primary-blue);
    }

    /* Events Layer */
    .events-layer {
      position: absolute;
      bottom: 2rem;
      left: 2rem;
      right: 2rem;
      height: 40px;
      pointer-events: none;
    }

    .event-marker {
      position: absolute;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      pointer-events: auto;
      transform: translateX(-50%);
    }

    .event-marker:hover {
      transform: translateX(-50%) scale(1.2);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }

    .event-marker.event-sunrise,
    .event-marker.event-sunset {
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .event-marker.event-alert {
      animation: pulse-alert 2s ease-in-out infinite;
    }

    @keyframes pulse-alert {
      0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
      50% { box-shadow: 0 4px 20px rgba(255, 0, 0, 0.6); }
    }

    /* Metrics Panel */
    .metrics-panel {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid var(--border-medium);
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metrics-toggles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .metric-toggle {
      display: flex;
      align-items: center;
      gap: 0.625rem;
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
      transform: translateY(-2px);
    }

    .metric-toggle.active {
      background: rgba(100, 149, 237, 0.15);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
    }

    .metric-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Playback Controls */
    .playback-controls {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 2rem;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-lg);
    }

    .control-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .control-btn {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 50%;
      color: var(--text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .control-btn:hover {
      background: rgba(100, 149, 237, 0.2);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
      transform: scale(1.1);
    }

    .control-btn.play-pause {
      width: 72px;
      height: 72px;
      font-size: 1.5rem;
      background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
      border-color: var(--primary-blue);
      color: white;
      box-shadow: 0 8px 20px rgba(100, 149, 237, 0.4);
    }

    .control-btn.play-pause:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 28px rgba(100, 149, 237, 0.5);
    }

    .control-btn.loop.active {
      background: rgba(100, 149, 237, 0.2);
      color: var(--primary-blue);
      border-color: var(--primary-blue);
    }

    .speed-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .speed-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .speed-label i {
      color: var(--primary-blue);
    }

    .speed-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .speed-btn {
      padding: 0.5rem 0.875rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .speed-btn:hover {
      background: rgba(100, 149, 237, 0.1);
      border-color: var(--primary-blue);
      color: var(--primary-blue);
    }

    .speed-btn.active {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
    }

    .progress-bar-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    .progress-bar::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-blue);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(100, 149, 237, 0.6);
      transition: all 0.2s ease;
    }

    .progress-bar::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(100, 149, 237, 0.8);
    }

    .progress-bar::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-blue);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(100, 149, 237, 0.6);
    }

    .time-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .time-current {
      font-weight: 700;
      color: var(--primary-blue);
    }

    /* Event Details Card */
    .event-details-card {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 340px;
      background: var(--gradient-glass);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-xl);
      padding: 1.5rem;
      z-index: 100;
      animation: slideInUp 0.4s ease;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      color: #f87171;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: rotate(90deg);
    }

    .event-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .event-header i {
      font-size: 2rem;
    }

    .event-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .event-description {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }

    .event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border-light);
    }

    .event-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .event-severity {
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .event-severity.severity-low {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    .event-severity.severity-medium {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .event-severity.severity-high {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .timeline-visualization {
        height: 400px;
      }

      .event-details-card {
        width: calc(100% - 4rem);
        left: 2rem;
        right: 2rem;
      }
    }

    @media (max-width: 768px) {
      .timeline-header {
        flex-direction: column;
        align-items: stretch;
      }

      .mode-selector {
        flex-direction: column;
      }

      .metrics-toggles {
        flex-direction: column;
      }

      .control-buttons {
        gap: 0.5rem;
      }

      .control-btn {
        width: 48px;
        height: 48px;
        font-size: 1rem;
      }

      .control-btn.play-pause {
        width: 64px;
        height: 64px;
        font-size: 1.25rem;
      }
    }
  `]
})
export class WeatherTimelineComponent implements OnInit, OnDestroy {
  @ViewChild('timelineSvg', { static: false }) svgElement!: ElementRef<SVGElement>;

  // Estado de búsqueda
  selectedMunicipio = signal<Municipio | null>(null);
  isLoadingTimeline = signal(false);
  private destroy$ = new Subject<void>();

  // Señales de estado del timeline
  mode = signal<'hourly' | 'daily' | 'weekly'>('hourly');
  isPlaying = signal(false);
  isLooping = signal(false);
  playbackSpeed = signal(1);
  currentTime = signal(new Date());
  progress = signal(0);
  cursorPosition = signal(50);
  currentData = signal<TimelineDataPoint | undefined>(undefined);
  selectedEvent = signal<TimelineEvent | null>(null);
  
  // Datos
  timelineData: TimelineDataPoint[] = [];
  visibleEvents = signal<TimelineEvent[]>([]);
  timeRange = signal({ start: new Date(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  selectedMetrics: TimelineMetric[] = ['temperature', 'precipitation', 'wind'];

  // D3 elements
  private svg: any;
  private xScale: any;
  private yScale: any;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private timelineService: TimelineService,
    private weatherService: WeatherService,
    private gamificationService: GamificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===== BÚSQUEDA =====

  onMunicipioSelected(municipio: Municipio): void {
    this.selectedMunicipio.set(municipio);
    this.isLoadingTimeline.set(true);
    this.cdr.markForCheck();

    this.timelineService.loadDataForMunicipio(municipio).subscribe({
      next: (success) => {
        this.isLoadingTimeline.set(false);
        if (success) {
          this.gamificationService.trackAction('use_timeline');
          // Inicializar D3 después de que el DOM del timeline se renderice
          setTimeout(() => {
            this.initializeData();
            this.initializeD3Visualization();
            this.subscribeToChanges();
            this.cdr.markForCheck();
          }, 100);
        }
      },
      error: () => {
        this.isLoadingTimeline.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.selectedMunicipio.set(null);
    this.timelineService.stop();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.svg = null;
    this.cdr.markForCheck();
  }

  /**
   * Inicializa los datos del timeline
   */
  private initializeData(): void {
    const dataSub = this.timelineService.data$.subscribe(data => {
      this.timelineData = data;
      this.updateVisualization();
    });

    const eventsSub = this.timelineService.events$.subscribe(events => {
      this.visibleEvents.set(events);
    });

    const rangeSub = this.timelineService.timeRange$.subscribe(range => {
      this.timeRange.set(range);
    });

    this.subscriptions.push(dataSub, eventsSub, rangeSub);
  }

  /**
   * Se suscribe a cambios de reproducción
   */
  private subscribeToChanges(): void {
    const playbackSub = this.timelineService.playback$.subscribe(state => {
      this.isPlaying.set(state.isPlaying);
      this.isLooping.set(state.loop);
      this.playbackSpeed.set(state.speed);
      this.currentTime.set(state.currentTime);
      
      // Actualizar progreso
      const range = this.timeRange();
      const duration = range.end.getTime() - range.start.getTime();
      const elapsed = state.currentTime.getTime() - range.start.getTime();
      this.progress.set((elapsed / duration) * 100);
      
      // Actualizar datos actuales
      const data = this.timelineService.getDataAtTime(state.currentTime);
      this.currentData.set(data);
      this.cursorPosition.set(this.progress());
      
      // Animar cursor con GSAP
      this.animateCursor();
    });

    this.subscriptions.push(playbackSub);
  }

  /**
   * Inicializa la visualización D3
   */
  private initializeD3Visualization(): void {
    const element = this.svgElement.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;

    this.svg = d3.select(element);
    this.svg.selectAll('*').remove(); // Limpiar

    // Escalas
    const range = this.timeRange();
    this.xScale = d3.scaleTime()
      .domain([range.start, range.end])
      .range([60, width - 60]);

    this.yScale = d3.scaleLinear()
      .domain([0, 40]) // Temperatura 0-40°C
      .range([height - 100, 60]);

    // Ejes
    const xAxis = d3.axisBottom(this.xScale)
      .ticks(8)
      .tickFormat((d: any) => d3.timeFormat('%d/%m %H:%M')(d));

    const yAxis = d3.axisLeft(this.yScale)
      .ticks(6);

    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - 100})`)
      .call(xAxis)
      .style('color', '#9ca3af')
      .style('font-size', '12px');

    this.svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', 'translate(60, 0)')
      .call(yAxis)
      .style('color', '#9ca3af')
      .style('font-size', '12px');

    // Grid
    this.svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${height - 100})`)
      .call(d3.axisBottom(this.xScale).ticks(12).tickSize(-height + 160).tickFormat(() => ''))
      .style('stroke', 'rgba(255,255,255,0.05)')
      .style('stroke-dasharray', '2,2');

    this.updateVisualization();
  }

  /**
   * Actualiza la visualización con los datos actuales
   */
  private updateVisualization(): void {
    if (!this.svg || this.timelineData.length === 0) return;

    const element = this.svgElement.nativeElement;
    const height = element.clientHeight;

    // Línea de temperatura
    const temperatureLine = d3.line<TimelineDataPoint>()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    this.svg.select('.temperature-line').remove();
    const tempPath = this.svg.append('path')
      .datum(this.timelineData)
      .attr('class', 'temperature-line')
      .attr('d', temperatureLine)
      .style('fill', 'none')
      .style('stroke', '#5DDFFF')
      .style('stroke-width', 3)
      .style('opacity', 0);

    // Animar entrada con GSAP
    gsap.to(tempPath.node(), {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Área de temperatura
    const tempArea = d3.area<TimelineDataPoint>()
      .x(d => this.xScale(d.timestamp))
      .y0(height - 100)
      .y1(d => this.yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    this.svg.select('.temperature-area').remove();
    this.svg.append('path')
      .datum(this.timelineData)
      .attr('class', 'temperature-area')
      .attr('d', tempArea)
      .style('fill', 'url(#temp-gradient)')
      .style('opacity', 0.3);

    // Definir gradient
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'temp-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#5DDFFF')
      .attr('stop-opacity', 0.6);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#5DDFFF')
      .attr('stop-opacity', 0);
  }

  /**
   * Anima el cursor con GSAP
   */
  private animateCursor(): void {
    gsap.to('.current-data-overlay', {
      left: `${this.cursorPosition()}%`,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  /**
   * Formatea un tiempo para display
   */
  formatTime(date: Date): string {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene la posición de un evento en el timeline
   */
  getEventPosition(event: TimelineEvent): number {
    const range = this.timeRange();
    const duration = range.end.getTime() - range.start.getTime();
    const elapsed = event.timestamp.getTime() - range.start.getTime();
    return (elapsed / duration) * 100;
  }

  /**
   * Cambia el modo del timeline
   */
  setMode(mode: 'hourly' | 'daily' | 'weekly'): void {
    this.mode.set(mode);
    this.timelineService.setMode(mode);
  }

  /**
   * Alterna play/pause
   */
  togglePlayPause(): void {
    if (this.isPlaying()) {
      this.timelineService.pause();
    } else {
      this.timelineService.play();
      // Trackear acción para gamificación
      this.gamificationService.trackAction('use_timeline');
    }
  }

  /**
   * Detiene la reproducción
   */
  stop(): void {
    this.timelineService.stop();
  }

  /**
   * Alterna loop
   */
  toggleLoop(): void {
    this.timelineService.toggleLoop();
  }

  /**
   * Establece la velocidad
   */
  setSpeed(speed: number): void {
    this.timelineService.setSpeed(speed);
  }

  /**
   * Maneja el cambio de progreso
   */
  onProgressChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const percent = parseFloat(input.value);
    
    const range = this.timeRange();
    const duration = range.end.getTime() - range.start.getTime();
    const newTime = new Date(range.start.getTime() + (duration * percent / 100));
    
    this.timelineService.setCurrentTime(newTime);
  }

  /**
   * Verifica si una métrica está seleccionada
   */
  isMetricSelected(metric: TimelineMetric): boolean {
    const config = this.timelineService.getConfig();
    return config.selectedMetrics.includes(metric);
  }

  /**
   * Alterna una métrica
   */
  toggleMetric(metric: TimelineMetric): void {
    this.timelineService.toggleMetric(metric);
  }

  /**
   * Selecciona un evento
   */
  selectEvent(event: TimelineEvent): void {
    this.selectedEvent.set(event);
    
    // Animar el card con GSAP
    gsap.fromTo('.event-details-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'back.out' }
    );
  }

  /**
   * Cierra los detalles del evento
   */
  closeEventDetails(): void {
    gsap.to('.event-details-card', {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => this.selectedEvent.set(null)
    });
  }

  /**
   * Obtiene la etiqueta de severidad
   */
  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta'
    };
    return labels[severity] || severity;
  }
}
