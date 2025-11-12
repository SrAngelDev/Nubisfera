import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Municipio, MunicipioResponse } from '../models/municipio.model';
import { PrediccionResponse, PrediccionDiaria } from '../models/prediccion.model';

@Injectable({
  providedIn: 'root'
})
export class AemetService {
  private readonly API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmdlbHNhbmdhczFAZ21haWwuY29tIiwianRpIjoiZDRmZmZmOTEtODk5OS00OTNiLTk5NmYtYzcyZDVlY2Q0YmMyIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NTc1NDQyODYsInVzZXJJZCI6ImQ0ZmZmZjkxLTg5OTktNDkzYi05OTZmLWM3MmQ1ZWNkNGJjMiIsInJvbGUiOiIifQ.wmp9WUL5ILsusgnnJqgNEWppAzpv8tiPH8CkiNtESgs';
  private readonly BASE_URL = 'https://opendata.aemet.es/opendata';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api_key': this.API_KEY
    });
  }

  private makeRequest<T>(endpoint: string): Observable<T> {
    return this.http.get<any>(`${this.BASE_URL}${endpoint}`, { 
      headers: this.getHeaders(),
      responseType: 'json'
    }).pipe(
      switchMap(response => {
        if (response.datos) {
          // Segunda petición para obtener los datos reales
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
    
    // Primero intentar arreglar problemas de codificación UTF-8 mal interpretados
    try {
      // Detectar si hay caracteres mal codificados (como �)
      if (text.includes('�') || /[\x80-\xFF]/.test(text)) {
        // Intentar recodificar desde ISO-8859-1 a UTF-8
        const bytes = new Uint8Array(text.split('').map(c => c.charCodeAt(0)));
        text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } catch (e) {
      console.warn('Error al decodificar texto:', e);
    }
    
    // Luego decodificar entidades HTML si existen
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  /**
   * Obtiene la predicción diaria para un municipio
   */
  getPrediccionDiaria(municipioId: string): Observable<PrediccionDiaria> {
    // Limpiar el ID: remover el prefijo "id" si existe
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
    // Limpiar el ID: remover el prefijo "id" si existe
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
