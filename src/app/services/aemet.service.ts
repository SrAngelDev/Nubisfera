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
    const urlWithKey = `${endpoint}${separator}api_key=${this.API_KEY}`;
    
    if (this.isDevelopment) {
      const fullUrl = this.AEMET_BASE_URL + urlWithKey;
      return `${this.DEV_CORS_PROXY}${encodeURIComponent(fullUrl)}`;
    }
    // En producción, añadimos el prefijo del proxy de Netlify a la ruta.
    return this.PROD_PROXY_PREFIX + urlWithKey;
  }

  private makeRequest<T>(endpoint: string): Observable<T> {
    const requestUrl = this.buildUrl(endpoint);
    
    return this.http.get<any>(requestUrl, { 
      responseType: 'json'
    }).pipe(
      switchMap(response => {
        if (response.datos) {
          // La URL de 'datos' es absoluta y ya incluye la API key
          let datosUrl = response.datos;
          if (this.isDevelopment) {
            // En desarrollo, la envolvemos en el proxy CORS.
            datosUrl = `${this.DEV_CORS_PROXY}${encodeURIComponent(datosUrl)}`;
          } else {
            // En producción, reemplazamos la base de AEMET por la ruta de nuestro proxy.
            datosUrl = datosUrl.replace(this.AEMET_BASE_URL, this.PROD_PROXY_PREFIX);
          }
            
          return this.http.get<T>(datosUrl, {
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
    // La API de AEMET necesita el prefijo /api/
    return this.makeRequest<Municipio[]>('/api/maestro/municipios').pipe(
      map(municipios => {
        // Asegurar que los nombres estén correctamente decodificados
        return municipios.map(m => ({
          ...m,
          nombre: this.decodeHtmlEntities(m.nombre || ''),
          capital: m.capital ? this.decodeHtmlEntities(m.capital) : m.capital
        }));
      })
    );
  }

  /**
   * Decodifica entidades HTML y arregla problemas de codificación UTF-8
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;
    
    try {
      // Este bloque a veces puede causar más problemas de los que soluciona
      // si la codificación de origen no es la esperada.
      if (text.includes('') || /[\x80-\xFF]/.test(text)) {
        const bytes = new Uint8Array(text.split('').map(c => c.charCodeAt(0)));
        text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } catch (e) {
      console.warn('Error al decodificar texto:', e);
    }
    
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  /**
   * Obtiene la predicción diaria para un municipio
   */
  getPrediccionDiaria(municipioId: string): Observable<PrediccionDiaria> {
    const cleanId = municipioId.replace(/^id/, '');
    return this.makeRequest<PrediccionDiaria[]>(`/api/prediccion/especifica/municipio/diaria/${cleanId}`)
      .pipe(
        map(response => {
          if (Array.isArray(response) && response.length > 0) {
            return response[0];
          }
          throw new Error('No se encontraron datos de predicción diaria');
        })
      );
  }

  /**
   * Obtiene la predicción horaria para un municipio
   */
  getPrediccionHoraria(municipioId: string): Observable<PrediccionDiaria> {
    const cleanId = municipioId.replace(/^id/, '');
    return this.makeRequest<PrediccionDiaria[]>(`/api/prediccion/especifica/municipio/horaria/${cleanId}`)
      .pipe(
        map(response => {
          if (Array.isArray(response) && response.length > 0) {
            return response[0];
          }
          throw new Error('No se encontraron datos de predicción horaria');
        })
      );
  }

  /**
   * Obtiene datos de observación actual
   */
  getObservacionActual(): Observable<any[]> {
    return this.makeRequest<any[]>('/api/observacion/convencional/todas');
  }

  /**
   * Obtiene predicción de radiación UV
   */
  getRadiacionUV(dia: number = 0): Observable<any[]> {
    return this.makeRequest<any[]>(`/api/prediccion/especifica/uvi/${dia}`);
  }
}
