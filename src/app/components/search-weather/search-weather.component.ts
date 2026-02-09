import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

// Pipes
import { CountryFlagPipe } from '../../pipes/country-flag.pipe';

// Modelos
import { Municipio } from '../../models/municipio.model';

// Servicios
import { WeatherService } from '../../services/weather.service';
import { SearchHistoryService, SearchHistoryItem } from '../../services/search-history.service';
import { VoiceSearchService } from '../../services/voice-search.service';

@Component({
  selector: 'app-search-weather',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CountryFlagPipe
  ],
  templateUrl: './search-weather.component.html',
  styleUrl: './search-weather.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchWeatherComponent implements OnInit, OnDestroy {
  // Configuración opcional
  @Input() showHistory = true;
  @Input() showPopularSuggestions = true;
  @Input() showLocationButton = true;
  @Input() placeholder = 'Madrid, New York, Tokyo, París...';
  @Input() maxResults = 10;
  
  // Eventos de salida
  @Output() municipioSelected = new EventEmitter<Municipio>();
  @Output() locationRequest = new EventEmitter<void>();
  @Output() searchStateChange = new EventEmitter<boolean>();
  
  // Estado principal
  searchQuery = '';
  searchResults: Municipio[] = [];
  isSearching = false;
  showDropdown = false;
  
  // Búsqueda
  private searchInput$ = new Subject<string>();      // Para tecleo (con debounce)
  private searchDirect$ = new Subject<string>();     // Para clics/voz (sin debounce)
  
  // Historial y sugerencias
  searchHistory: SearchHistoryItem[] = [];
  popularSuggestions: string[] = [
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 
    'New York', 'Londres', 'París', 'Tokio'
  ];
  
  // Búsqueda por voz
  isVoiceSearchSupported = false;
  isListeningVoice = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private searchHistoryService: SearchHistoryService,
    private voiceSearchService: VoiceSearchService,
    private cdr: ChangeDetectorRef
  ) {
    // Configurar búsqueda por voz
    this.isVoiceSearchSupported = this.voiceSearchService.isSupported();
    
    this.voiceSearchService.result$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transcript => {
        if (transcript) {
          this.searchQuery = transcript;
          this.searchDirect$.next(transcript);
        }
        this.isListeningVoice = false;
        this.cdr.markForCheck();
      });

    // Cargar historial
    this.searchHistoryService.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.searchHistory = history.slice(0, 5);
        this.cdr.markForCheck();
      });
  }
  
  ngOnInit(): void {
    // Pipeline de búsqueda
    const inputSearch$ = this.searchInput$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    );
    
    merge(inputSearch$, this.searchDirect$).pipe(
      tap(() => {
        this.isSearching = true;
        this.showDropdown = true;
        this.searchStateChange.emit(true);
        this.cdr.markForCheck();
      }),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.weatherService.searchMunicipios(query, this.maxResults).pipe(
          catchError(error => {
            console.error('❌ Error en búsqueda:', error);
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      console.log(`✅ ${results.length} resultados encontrados`);
      this.searchResults = results;
      this.isSearching = false;
      this.searchStateChange.emit(false);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ========== TRACK BY FUNCTIONS ==========
  
  trackByMunicipioId(index: number, municipio: Municipio): string {
    return municipio.id;
  }
  
  trackByHistoryId(index: number, item: SearchHistoryItem): string {
    return item.id;
  }
  
  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }
  
  // ========== MÉTODOS DE BÚSQUEDA ==========
  
  onSearchInput(): void {
    const query = this.searchQuery.trim();
    
    if (!query) {
      this.searchResults = [];
      this.showDropdown = false;
      this.isSearching = false;
      return;
    }
    
    this.searchInput$.next(query);
  }
  
  selectMunicipio(municipio: Municipio): void {
    console.log('📍 Ciudad seleccionada:', municipio);
    this.searchQuery = municipio.nombre;
    this.showDropdown = false;
    this.searchResults = [];
    
    // Guardar en historial
    this.searchHistoryService.addToHistory(municipio.id, municipio.nombre);
    
    // Emitir evento a la página padre
    this.municipioSelected.emit(municipio);
    this.cdr.markForCheck();
  }
  
  onSearchBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
  
  onSearchFocus(): void {
    if (this.searchResults.length > 0) {
      this.showDropdown = true;
    }
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showDropdown = false;
    this.isSearching = false;
    this.cdr.markForCheck();
  }
  
  // ========== BÚSQUEDA POR VOZ ==========
  
  startVoiceSearch(): void {
    if (!this.isVoiceSearchSupported) {
      return;
    }

    if (this.isListeningVoice) {
      this.voiceSearchService.stopListening();
      this.isListeningVoice = false;
    } else {
      this.voiceSearchService.startListening();
      this.isListeningVoice = true;
    }
    this.cdr.markForCheck();
  }
  
  // ========== HISTORIAL Y SUGERENCIAS ==========
  
  selectFromHistory(item: SearchHistoryItem): void {
    this.searchQuery = item.nombre;
    this.searchDirect$.next(item.nombre);
    
    setTimeout(() => {
      if (this.searchResults.length > 0) {
        this.selectMunicipio(this.searchResults[0]);
      }
    }, 400);
  }
  
  clearSearchHistory(): void {
    this.searchHistoryService.clearHistory();
  }
  
  selectPopularSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.searchDirect$.next(suggestion);
    
    setTimeout(() => {
      if (this.searchResults.length > 0) {
        this.selectMunicipio(this.searchResults[0]);
      }
    }, 400);
  }
  
  // ========== MÉTODOS PÚBLICOS PARA ACCESO EXTERNO ==========
  
  public searchByName(nombre: string): void {
    this.searchQuery = nombre;
    this.searchDirect$.next(nombre);
    
    setTimeout(() => {
      if (this.searchResults.length > 0) {
        this.selectMunicipio(this.searchResults[0]);
      }
    }, 500);
  }
  
  public resetSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showDropdown = false;
    this.isSearching = false;
    this.cdr.markForCheck();
  }
  
  // ========== UTILIDADES ==========
  
  formatPopulation(population: number): string {
    if (!population || population < 1000) {
      return population?.toString() || '—';
    }
    
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    
    if (population >= 1000) {
      return `${Math.round(population / 1000)}K`;
    }
    
    return population.toString();
  }
  
  // ========== ACCIONES ESPECIALES ==========
  
  requestLocation(): void {
    this.locationRequest.emit();
  }
}
