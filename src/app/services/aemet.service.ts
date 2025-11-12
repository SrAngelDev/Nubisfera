import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Municipio, MunicipioResponse } from '../models/municipio.model';
import { PrediccionResponse, PrediccionDiaria } from '../models/prediccion.model';

@Injectable({
  providedIn: 'root'
})
export class AemetService {
  private readonly API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmdlbHNhbmdhczFAZ21haWwuY29tIiwianRpIjoiZDRmZmZmOTEtODk5OS00OTNiLTk5NmYtYzcyZDVlY2Q0YmMyIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NTc1NDQyODYsInVzZXJJZCI6ImQ0ZmZmZjkxLTg5OTktNDkzYi05OTZmLWM3MmQ1ZWNkNGJjMiIsInJvbGUiOiIifQ.wmp9WUL5ILsusgnnJqgNEWppAzpv8tiPH8CkiNtESgs';
  
  // Detectar si estamos en desarrollo o producción
  private readonly isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  private readonly AEMET_BASE_URL = 'https://opendata.aemet.es/opendata';
  private readonly PROD_PROXY_PREFIX = '/api/aemet';
  private readonly DEV_CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  constructor(private http: HttpClient) { }

  private buildUrl(endpoint: string): string {
    // La API key va en la URL como parámetro de consulta según la documentación de AEMET
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullEndpoint = `/api${endpoint}`;
    const urlWithKey = `${fullEndpoint}${separator}api_key=${this.API_KEY}`;
    
    // Siempre usar la URL directa de AEMET - no necesitamos proxy
    return this.AEMET_BASE_URL + urlWithKey;
  }

  private makeRequest<T>(endpoint: string): Observable<T> {
    const requestUrl = this.buildUrl(endpoint);
    
    return this.http.get<any>(requestUrl, { 
      responseType: 'json'
    }).pipe(
      switchMap(response => {
        if (response.datos) {
          // La URL de 'datos' es absoluta y ya incluye la API key
          // Ya viene completa desde AEMET, solo la usamos directamente
          return this.http.get<T>(response.datos, {
            responseType: 'json'
          });
        }
        return of(response as T);
      })
    );
  }

  /**
   * Obtiene la lista de todos los municipios de España
   */
  getMunicipios(): Observable<Municipio[]> {
    // Intentar cargar desde caché primero
    const cached = this.getCachedMunicipios();
    if (cached) {
      console.log('Cargando municipios desde caché local');
      return of(cached);
    }

    // Si no hay caché, llamar a la API
    console.log('Cargando municipios desde la API de AEMET');
    return this.makeRequest<Municipio[]>('/maestro/municipios').pipe(
      map(municipios => {
        console.log('Municipios recibidos de la API (raw):', municipios.slice(0, 3));
        
        // Limpiar nombres con caracteres corruptos
        const municipiosLimpios = municipios.map(m => ({
          ...m,
          nombre: this.decodeHtmlEntities(m.nombre)
        }));
        
        console.log('Municipios después de limpiar:', municipiosLimpios.slice(0, 3));
        
        // Guardar en caché
        this.cacheMunicipios(municipiosLimpios);
        return municipiosLimpios;
      })
    );
  }

  private getCachedMunicipios(): Municipio[] | null {
    try {
      const CACHE_VERSION = 'v2'; // Incrementar para invalidar caché antiguo
      const cached = localStorage.getItem('aemet_municipios');
      const timestamp = localStorage.getItem('aemet_municipios_timestamp');
      const version = localStorage.getItem('aemet_municipios_version');
      
      // Si no hay caché o la versión es antigua, invalidar
      if (!cached || !timestamp || version !== CACHE_VERSION) {
        if (version !== CACHE_VERSION) {
          console.log('Versión de caché antigua, invalidando...');
          localStorage.removeItem('aemet_municipios');
          localStorage.removeItem('aemet_municipios_timestamp');
          localStorage.removeItem('aemet_municipios_version');
        }
        return null;
      }

      // Verificar si el caché tiene menos de 24 horas
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
      
      if (cacheAge > CACHE_DURATION) {
        console.log('Caché expirado, se necesita actualizar');
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error al leer caché:', error);
      return null;
    }
  }

  private cacheMunicipios(municipios: Municipio[]): void {
    try {
      const CACHE_VERSION = 'v2';
      localStorage.setItem('aemet_municipios', JSON.stringify(municipios));
      localStorage.setItem('aemet_municipios_timestamp', Date.now().toString());
      localStorage.setItem('aemet_municipios_version', CACHE_VERSION);
      console.log('Municipios guardados en caché (versión ' + CACHE_VERSION + ')');
    } catch (error) {
      console.error('Error al guardar caché:', error);
    }
  }

  /**
   * Decodifica entidades HTML y normaliza el texto eliminando tildes si hay caracteres corruptos
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;
    
    // Si hay caracteres corruptos (�), normalizar
    if (text.includes('�')) {
      console.log('Caracter corrupto detectado en:', text);
      
      // Patrones comunes de municipios con caracteres corruptos
      const patterns: { [key: string]: string } = {
        'Legan�s': 'Leganes',
        'M�laga': 'Malaga',
        'C�diz': 'Cadiz',
        'C�rdoba': 'Cordoba',
        'Almer�a': 'Almeria',
        'Le�n': 'Leon',
        'Logro�o': 'Logrono',
        '�vila': 'Avila',
        'Castell�n': 'Castellon',
        'Gij�n': 'Gijon',
        'M�stoles': 'Mostoles',
        'Alcorc�n': 'Alcorcon',
        'Alcal�': 'Alcala',
        'San Sebasti�n': 'San Sebastian',
        'Ja�n': 'Jaen',
        '�rense': 'Orense',
        'C�ceres': 'Caceres',
        'M�rida': 'Merida',
        'Santander': 'Santander',
        'Pamplona': 'Pamplona',
        'Vitoria': 'Vitoria',
        'Gasteiz': 'Gasteiz'
      };
      
      // Intentar reemplazar patrones conocidos primero
      for (const [corrupted, clean] of Object.entries(patterns)) {
        if (text === corrupted || text.includes(corrupted)) {
          console.log(`Reemplazando "${text}" por "${clean}"`);
          return clean;
        }
      }
      
      // Si no coincide, normalizar eliminando acentos de forma general
      const normalized = text
        .replace(/�/g, 'n')  // ñ
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòô]/g, 'o')
        .replace(/[úùû]/g, 'u')
        .replace(/[ÁÀÂÃ]/g, 'A')
        .replace(/[ÉÈÊ]/g, 'E')
        .replace(/[ÍÌÎ]/g, 'I')
        .replace(/[ÓÒÔ]/g, 'O')
        .replace(/[ÚÙÛ]/g, 'U')
        .replace(/Ñ/g, 'N');
      
      console.log(`Normalizado de "${text}" a "${normalized}"`);
      return normalized;
    }
    
    // Si no hay caracteres corruptos, devolver tal cual
    return text;
  }

  /**
   * Obtiene la predicción diaria para un municipio
   */
  getPrediccionDiaria(municipioId: string): Observable<PrediccionDiaria> {
    const cleanId = municipioId.replace(/^id/, '');
    
    // Intentar cargar desde caché primero
    const cached = this.getCachedPrediccion(cleanId);
    if (cached) {
      console.log(`Cargando predicción diaria de ${cleanId} desde caché local`);
      return of(cached);
    }

    // Si no hay caché, llamar a la API
    console.log(`Cargando predicción diaria de ${cleanId} desde la API de AEMET`);
    return this.makeRequest<PrediccionDiaria[]>(`/prediccion/especifica/municipio/diaria/${cleanId}`)
      .pipe(
        map(response => {
          if (Array.isArray(response) && response.length > 0) {
            const prediccion = response[0];
            // Guardar en caché
            this.cachePrediccion(cleanId, prediccion);
            return prediccion;
          }
          throw new Error('No se encontraron datos de predicción diaria');
        })
      );
  }

  private getCachedPrediccion(municipioId: string): PrediccionDiaria | null {
    try {
      const cached = localStorage.getItem(`aemet_prediccion_${municipioId}`);
      const timestamp = localStorage.getItem(`aemet_prediccion_${municipioId}_timestamp`);
      
      if (!cached || !timestamp) {
        return null;
      }

      // Verificar si el caché tiene menos de 3 horas (las predicciones cambian más frecuentemente)
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 horas
      
      if (cacheAge > CACHE_DURATION) {
        console.log(`Caché de predicción para ${municipioId} expirado`);
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error al leer caché de predicción:', error);
      return null;
    }
  }

  private cachePrediccion(municipioId: string, prediccion: PrediccionDiaria): void {
    try {
      localStorage.setItem(`aemet_prediccion_${municipioId}`, JSON.stringify(prediccion));
      localStorage.setItem(`aemet_prediccion_${municipioId}_timestamp`, Date.now().toString());
      console.log(`Predicción para ${municipioId} guardada en caché`);
    } catch (error) {
      console.error('Error al guardar caché de predicción:', error);
    }
  }

  /**
   * Obtiene la predicción horaria para un municipio
   */
  getPrediccionHoraria(municipioId: string): Observable<PrediccionDiaria> {
    const cleanId = municipioId.replace(/^id/, '');
    
    // Intentar cargar desde caché primero
    const cachedHoraria = this.getCachedPrediccionHoraria(cleanId);
    if (cachedHoraria) {
      console.log(`Cargando predicción horaria de ${cleanId} desde caché local`);
      return of(cachedHoraria);
    }

    // Si no hay caché, llamar a la API
    console.log(`Cargando predicción horaria de ${cleanId} desde la API de AEMET`);
    return this.makeRequest<PrediccionDiaria[]>(`/prediccion/especifica/municipio/horaria/${cleanId}`)
      .pipe(
        map(response => {
          if (Array.isArray(response) && response.length > 0) {
            const prediccion = response[0];
            // Guardar en caché
            this.cachePrediccionHoraria(cleanId, prediccion);
            return prediccion;
          }
          throw new Error('No se encontraron datos de predicción horaria');
        })
      );
  }

  private getCachedPrediccionHoraria(municipioId: string): PrediccionDiaria | null {
    try {
      const cached = localStorage.getItem(`aemet_prediccion_horaria_${municipioId}`);
      const timestamp = localStorage.getItem(`aemet_prediccion_horaria_${municipioId}_timestamp`);
      
      if (!cached || !timestamp) {
        return null;
      }

      // Verificar si el caché tiene menos de 1 hora (las predicciones horarias se actualizan más frecuentemente)
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hora
      
      if (cacheAge > CACHE_DURATION) {
        console.log(`Caché de predicción horaria para ${municipioId} expirado`);
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error al leer caché de predicción horaria:', error);
      return null;
    }
  }

  private cachePrediccionHoraria(municipioId: string, prediccion: PrediccionDiaria): void {
    try {
      localStorage.setItem(`aemet_prediccion_horaria_${municipioId}`, JSON.stringify(prediccion));
      localStorage.setItem(`aemet_prediccion_horaria_${municipioId}_timestamp`, Date.now().toString());
      console.log(`Predicción horaria para ${municipioId} guardada en caché`);
    } catch (error) {
      console.error('Error al guardar caché de predicción horaria:', error);
    }
  }

  /**
   * Obtiene datos de observación actual
   */
  getObservacionActual(): Observable<any[]> {
    return this.makeRequest<any[]>('/observacion/convencional/todas');
  }

  /**
   * Obtiene predicción de radiación UV
   */
  getRadiacionUV(dia: number = 0): Observable<any[]> {
    return this.makeRequest<any[]>(`/prediccion/especifica/uvi/${dia}`);
  }
}
