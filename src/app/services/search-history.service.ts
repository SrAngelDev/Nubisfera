import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Search History Service
 * Gestiona el historial de búsquedas del usuario
 * Usa localStorage para persistencia
 */

export interface SearchHistoryItem {
  id: string;
  nombre: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {
  private readonly STORAGE_KEY = 'nubisfera_search_history';
  private readonly MAX_ITEMS = 10;
  
  private historySubject = new BehaviorSubject<SearchHistoryItem[]>([]);
  public history$ = this.historySubject.asObservable();

  constructor() {
    this.loadHistory();
  }

  /**
   * Obtener historial actual
   */
  getHistory(): SearchHistoryItem[] {
    return this.historySubject.value;
  }

  /**
   * Agregar búsqueda al historial
   */
  addToHistory(municipioId: string, municipioNombre: string): void {
    let history = this.getHistory();
    
    // Eliminar si ya existe
    history = history.filter(item => item.id !== municipioId);
    
    // Agregar al inicio
    history.unshift({
      id: municipioId,
      nombre: municipioNombre,
      timestamp: Date.now()
    });
    
    // Limitar cantidad
    if (history.length > this.MAX_ITEMS) {
      history = history.slice(0, this.MAX_ITEMS);
    }
    
    this.saveHistory(history);
    this.historySubject.next(history);
  }

  /**
   * Limpiar historial completo
   */
  clearHistory(): void {
    this.saveHistory([]);
    this.historySubject.next([]);
  }

  /**
   * Eliminar item específico del historial
   */
  removeFromHistory(municipioId: string): void {
    let history = this.getHistory();
    history = history.filter(item => item.id !== municipioId);
    this.saveHistory(history);
    this.historySubject.next(history);
  }

  /**
   * Cargar historial desde localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        this.historySubject.next(history);
      }
    } catch (error) {
      console.error('Error cargando historial de búsqueda:', error);
      this.historySubject.next([]);
    }
  }

  /**
   * Guardar historial en localStorage
   * OPTIMIZACIÓN: Operación async para no bloquear el hilo
   */
  private saveHistory(history: SearchHistoryItem[]): void {
    // Usar setTimeout para mover la operación fuera del flujo crítico
    setTimeout(() => {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Error guardando historial de búsqueda:', error);
      }
    }, 0);
  }

  /**
   * Obtener sugerencias populares (predefinidas)
   */
  getPopularSuggestions(): string[] {
    return [
      'Madrid',
      'Barcelona',
      'Valencia',
      'Sevilla',
      'Zaragoza',
      'Málaga',
      'Bilbao',
      'Alicante'
    ];
  }
}
