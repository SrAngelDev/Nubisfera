import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { fetchWeatherApi } from 'openmeteo';
import { Municipio } from '../models/municipio.model';
import { WeatherData, DailyForecast, HourlyForecast } from '../models/weather.model';

export interface WeatherAlert {
  id: string;
  tipo: string;
  nivel: 'amarilla' | 'naranja' | 'roja';
  nivelTexto: string;
  zona: string;
  icono: string;
  descripcion: string;
  valor: number;
  umbral: number;
  categoria?: 'meteorologica' | 'calidad_aire' | 'inundacion' | 'polen';
}

export interface AirQualityData {
  current: {
    pm10?: number;
    pm2_5?: number;
    european_aqi?: number;
    us_aqi?: number;
    ozone?: number;
    nitrogen_dioxide?: number;
    carbon_monoxide?: number;
    sulphur_dioxide?: number;
    dust?: number;
    uv_index?: number;
    ammonia?: number;
    alder_pollen?: number;
    birch_pollen?: number;
    grass_pollen?: number;
    mugwort_pollen?: number;
    olive_pollen?: number;
    ragweed_pollen?: number;
  };
  hourly?: {
    time: string[];
    pm10?: number[];
    pm2_5?: number[];
    european_aqi?: number[];
    ozone?: number[];
    nitrogen_dioxide?: number[];
  };
}

export interface FloodData {
  daily: {
    time: string[];
    river_discharge: number[];
    river_discharge_max?: number[];
    river_discharge_mean?: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly API_URL = 'https://api.open-meteo.com/v1/forecast';
  private readonly GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  private readonly FLOOD_URL = 'https://flood-api.open-meteo.com/v1/flood';
  
  constructor() {}

  /**
   * Obtiene la predicción del tiempo para un municipio usando coordenadas
   */
  getWeatherForecast(municipio: Municipio): Observable<WeatherData> {
    if (!municipio.latitud_dec || !municipio.longitud_dec) {
      console.error('El municipio no tiene coordenadas:', municipio);
      return of(this.getEmptyWeatherData(municipio));
    }

    const latitude = parseFloat(municipio.latitud_dec);
    const longitude = parseFloat(municipio.longitud_dec);

    const params = {
      latitude,
      longitude,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m'
      ],
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'dew_point_2m',
        'apparent_temperature',
        'precipitation_probability',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'surface_pressure',
        'visibility',
        'evapotranspiration',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
        'is_day'
      ],
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'daylight_duration',
        'sunshine_duration',
        'uv_index_max',
        'uv_index_clear_sky_max',
        'precipitation_sum',
        'rain_sum',
        'showers_sum',
        'snowfall_sum',
        'precipitation_hours',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'wind_direction_10m_dominant',
        'shortwave_radiation_sum'
      ],
      timezone: 'auto',
      forecast_days: 16
    };

    // Convertir Promise a Observable
    return from(fetchWeatherApi(this.API_URL, params)).pipe(
      map(responses => {
        console.log('📡 Respuesta de Open-Meteo recibida:', responses);
        
        if (!responses || responses.length === 0) {
          console.error('❌ No se recibieron respuestas de la API');
          throw new Error('No se recibieron datos de la API');
        }
        
        const response = responses[0];
        console.log('📍 Procesando respuesta para:', {
          lat: response.latitude(),
          lon: response.longitude(),
          elevation: response.elevation()
        });
        
        // Obtener datos actuales
        const current = response.current();
        if (!current) {
          console.error('❌ No hay datos actuales en la respuesta');
          throw new Error('No hay datos actuales disponibles');
        }
        
        console.log('🌡️ Procesando datos actuales...');
        const currentData = {
          time: new Date(), // Usar la hora actual del sistema
          temperature: current.variables(0)?.value() ?? 0,
          humidity: current.variables(1)?.value() ?? 0,
          apparentTemperature: current.variables(2)?.value() ?? 0,
          isDay: current.variables(3)?.value() ?? 1,
          precipitation: current.variables(4)?.value() ?? 0,
          rain: current.variables(5)?.value() ?? 0,
          showers: current.variables(6)?.value() ?? 0,
          snowfall: current.variables(7)?.value() ?? 0,
          weatherCode: current.variables(8)?.value() ?? 0,
          cloudCover: current.variables(9)?.value() ?? 0,
          pressureMsl: current.variables(10)?.value() ?? 0,
          surfacePressure: current.variables(11)?.value() ?? 0,
          windSpeed: current.variables(12)?.value() ?? 0,
          windDirection: current.variables(13)?.value() ?? 0,
          windGusts: current.variables(14)?.value() ?? 0
        };
        console.log('✅ Datos actuales:', currentData);

        // Procesar datos horarios
        const hourly = response.hourly();
        if (!hourly) {
          console.error('❌ No hay datos horarios en la respuesta');
          throw new Error('No hay datos horarios disponibles');
        }
        
        console.log('⏰ Procesando datos horarios...');
        const utcOffsetSeconds = Number(response.utcOffsetSeconds());
        const hourlyData: HourlyForecast[] = [];
        
        const hourlyTimeStart = Number(hourly.time());
        const hourlyTimeEnd = Number(hourly.timeEnd());
        const hourlyInterval = hourly.interval();
        const hourlyLength = (hourlyTimeEnd - hourlyTimeStart) / hourlyInterval;

        // Scope block to avoid variable name collisions and keep memory clean
        {
          // Obtener arrays una sola vez para mejor rendimiento y seguridad
          const tempArray = hourly.variables(0)?.valuesArray();
          const humidityArray = hourly.variables(1)?.valuesArray();
          const dewPointArray = hourly.variables(2)?.valuesArray();
          const appTempArray = hourly.variables(3)?.valuesArray();
          const precipProbArray = hourly.variables(4)?.valuesArray();
          const precipArray = hourly.variables(5)?.valuesArray();
          const rainArray = hourly.variables(6)?.valuesArray();
          const showersArray = hourly.variables(7)?.valuesArray();
          const snowfallArray = hourly.variables(8)?.valuesArray();
          const weatherCodeArray = hourly.variables(9)?.valuesArray();
          const cloudCoverArray = hourly.variables(10)?.valuesArray();
          const pressureMslArray = hourly.variables(11)?.valuesArray();
          const surfacePressureArray = hourly.variables(12)?.valuesArray();
          const visibilityArray = hourly.variables(13)?.valuesArray();
          const evapotranspirationArray = hourly.variables(14)?.valuesArray();
          const windSpeedArray = hourly.variables(15)?.valuesArray();
          const windDirArray = hourly.variables(16)?.valuesArray();
          const windGustsArray = hourly.variables(17)?.valuesArray();
          const uvIndexArray = hourly.variables(18)?.valuesArray();
          const isDayArray = hourly.variables(19)?.valuesArray();

          for (let i = 0; i < hourlyLength; i++) {
            const time = new Date((hourlyTimeStart + i * hourlyInterval + utcOffsetSeconds) * 1000);
            
            hourlyData.push({
              time,
              temperature: tempArray?.[i] ?? 0,
              humidity: humidityArray?.[i] ?? 0,
              dewPoint: dewPointArray?.[i],
              apparentTemperature: appTempArray?.[i] ?? 0,
              precipitationProbability: precipProbArray?.[i] ?? 0,
              precipitation: precipArray?.[i] ?? 0,
              rain: rainArray?.[i],
              showers: showersArray?.[i],
              snowfall: snowfallArray?.[i],
              weatherCode: weatherCodeArray?.[i] ?? 0,
              cloudCover: cloudCoverArray?.[i],
              pressureMsl: pressureMslArray?.[i],
              surfacePressure: surfacePressureArray?.[i],
              visibility: visibilityArray?.[i],
              evapotranspiration: evapotranspirationArray?.[i],
              windSpeed: windSpeedArray?.[i] ?? 0,
              windDirection: windDirArray?.[i] ?? 0,
              windGusts: windGustsArray?.[i],
              uvIndex: uvIndexArray?.[i],
              isDay: isDayArray?.[i]
            });
          }
        }
        console.log(`✅ ${hourlyData.length} registros horarios procesados`);

        // Procesar datos diarios
        const daily = response.daily();
        if (!daily) {
          console.error('❌ No hay datos diarios en la respuesta');
          throw new Error('No hay datos diarios disponibles');
        }
        
        console.log('📅 Procesando datos diarios...');
        const dailyData: DailyForecast[] = [];
        
        const dailyTimeStart = Number(daily.time());
        const dailyTimeEnd = Number(daily.timeEnd());
        const dailyInterval = daily.interval();
        const dailyLength = (dailyTimeEnd - dailyTimeStart) / dailyInterval;

        // Scope block to avoid variable name collisions and keep memory clean
        {
          // Obtener arrays una sola vez
          const weatherCodeArray = daily.variables(0)?.valuesArray();
          const tempMaxArray = daily.variables(1)?.valuesArray();
          const tempMinArray = daily.variables(2)?.valuesArray();
          const appTempMaxArray = daily.variables(3)?.valuesArray();
          const appTempMinArray = daily.variables(4)?.valuesArray();
          const sunriseArray = daily.variables(5)?.valuesArray();
          const sunsetArray = daily.variables(6)?.valuesArray();
          const daylightDurationArray = daily.variables(7)?.valuesArray();
          const sunshineDurationArray = daily.variables(8)?.valuesArray();
          const uvIndexMaxArray = daily.variables(9)?.valuesArray();
          const uvIndexClearSkyMaxArray = daily.variables(10)?.valuesArray();
          const precipSumArray = daily.variables(11)?.valuesArray();
          const rainSumArray = daily.variables(12)?.valuesArray();
          const showersSumArray = daily.variables(13)?.valuesArray();
          const snowfallSumArray = daily.variables(14)?.valuesArray();
          const precipHoursArray = daily.variables(15)?.valuesArray();
          const precipProbArray = daily.variables(16)?.valuesArray();
          const windSpeedArray = daily.variables(17)?.valuesArray();
          const windGustsArray = daily.variables(18)?.valuesArray();
          const windDirArray = daily.variables(19)?.valuesArray();
          const shortwaveRadiationArray = daily.variables(20)?.valuesArray();
          
          for (let i = 0; i < dailyLength; i++) {
            const time = new Date((dailyTimeStart + i * dailyInterval + utcOffsetSeconds) * 1000);
            
            dailyData.push({
              date: time,
              weatherCode: weatherCodeArray?.[i] ?? 0,
              temperatureMax: tempMaxArray?.[i] ?? 0,
              temperatureMin: tempMinArray?.[i] ?? 0,
              apparentTemperatureMax: appTempMaxArray?.[i] ?? 0,
              apparentTemperatureMin: appTempMinArray?.[i] ?? 0,
              sunrise: sunriseArray?.[i] ? new Date((Number(sunriseArray[i]) + utcOffsetSeconds) * 1000) : time,
              sunset: sunsetArray?.[i] ? new Date((Number(sunsetArray[i]) + utcOffsetSeconds) * 1000) : time,
              daylightDuration: daylightDurationArray?.[i],
              sunshineDuration: sunshineDurationArray?.[i],
              uvIndexMax: uvIndexMaxArray?.[i],
              uvIndexClearSkyMax: uvIndexClearSkyMaxArray?.[i],
              precipitationSum: precipSumArray?.[i] ?? 0,
              rainSum: rainSumArray?.[i],
              showersSum: showersSumArray?.[i],
              snowfallSum: snowfallSumArray?.[i],
              precipitationHours: precipHoursArray?.[i],
              precipitationProbabilityMax: precipProbArray?.[i] ?? 0,
              windSpeedMax: windSpeedArray?.[i] ?? 0,
              windGustsMax: windGustsArray?.[i],
              windDirectionDominant: windDirArray?.[i] ?? 0,
              shortwaveRadiationSum: shortwaveRadiationArray?.[i]
            });
          }
        }
        console.log(`✅ ${dailyData.length} días de pronóstico procesados`);

        const weatherData = {
          municipio,
          latitude: response.latitude(),
          longitude: response.longitude(),
          elevation: response.elevation(),
          timezone: 'Europe/Madrid',
          current: currentData,
          hourly: hourlyData,
          daily: dailyData
        };
        
        console.log('✅ Datos del tiempo procesados completamente:', {
          municipio: municipio.nombre,
          current: weatherData.current,
          hourlyRecords: weatherData.hourly.length,
          dailyRecords: weatherData.daily.length
        });
        
        return weatherData;
      }),
      catchError(error => {
        console.error('Error obteniendo datos del tiempo:', error);
        return of(this.getEmptyWeatherData(municipio));
      })
    );
  }

  private getEmptyWeatherData(municipio: Municipio): WeatherData {
    return {
      municipio,
      latitude: 0,
      longitude: 0,
      elevation: 0,
      timezone: 'Europe/Madrid',
      current: {
        time: new Date(),
        temperature: 0,
        humidity: 0,
        apparentTemperature: 0,
        weatherCode: 0,
        windSpeed: 0,
        windDirection: 0
      },
      hourly: [],
      daily: []
    };
  }

  /**
   * Obtiene una lista de municipios (para compatibilidad con dataset local español)
   * Descarga un dataset JSON completo desde una fuente pública
   */
  getMunicipios(): Observable<Municipio[]> {
    // Cargar desde caché
    const cached = this.getCachedMunicipios();
    if (cached && cached.length > 5000) {
      console.log(`📦 Cargando ${cached.length} municipios desde caché`);
      return of(cached);
    }

    // Cargar desde JSON local pre-generado
    console.log('📂 Cargando municipios desde JSON local...');
    return this.cargarMunicipiosDesdeJSON();
  }

  /**
   * Carga los municipios desde el JSON local pre-generado
   * Este JSON se genera ejecutando: node scripts/generar-municipios.js
   */
  private cargarMunicipiosDesdeJSON(): Observable<Municipio[]> {
    // Ruta al JSON local generado (en public/ porque Angular usa esa carpeta para assets)
    const JSON_PATH = '/municipios-espana.json';
    
    console.log('📥 Cargando JSON local de municipios...');
    
    return from(
      fetch(JSON_PATH)
        .then(response => {
          if (!response.ok) {
            throw new Error(`No se pudo cargar ${JSON_PATH}: ${response.status}`);
          }
          return response.json();
        })
    ).pipe(
      switchMap((data: any) => {
        console.log('✅ JSON cargado correctamente');
        
        // El JSON generado tiene estructura: { municipios: [...] }
        const municipios: Municipio[] = data.municipios || [];
        
        if (municipios.length === 0) {
          console.error('❌ JSON vacío o con formato incorrecto');
          console.log('💡 Ejecuta: node scripts/generar-municipios.js');
          return of(this.getMunicipiosEstaticos());
        }
        
        console.log(`✅ ${municipios.length} municipios cargados`);
        console.log(`📊 Versión: ${data.version || 'N/A'}`);
        console.log(`📅 Fecha: ${data.fecha_generacion || 'N/A'}`);
        console.log(`📈 Cobertura: ${((municipios.length / 8131) * 100).toFixed(1)}% del dataset local`);
        
        // Guardar en caché
        this.cacheMunicipios(municipios);
        return of(municipios);
      }),
      catchError(error => {
        console.error('❌ Error cargando JSON local:', error);
        console.log('💡 Solución: Ejecuta "node scripts/generar-municipios.js"');
        console.log('🔄 Usando lista estática mínima como fallback...');
        return of(this.getMunicipiosEstaticos());
      })
    );
  }

  /**
   * Obtiene datos de calidad del aire para un municipio
   */
  getAirQuality(municipio: Municipio): Observable<AirQualityData> {
    if (!municipio.latitud_dec || !municipio.longitud_dec) {
      console.error('El municipio no tiene coordenadas para Air Quality:', municipio);
      return of({ current: {} });
    }

    const latitude = parseFloat(municipio.latitud_dec);
    const longitude = parseFloat(municipio.longitud_dec);

    const params = {
      latitude,
      longitude,
      current: [
        'pm10',
        'pm2_5',
        'european_aqi',
        'us_aqi',
        'ozone',
        'nitrogen_dioxide',
        'carbon_monoxide',
        'sulphur_dioxide',
        'dust',
        'uv_index',
        'ammonia',
        'alder_pollen',
        'birch_pollen',
        'grass_pollen',
        'mugwort_pollen',
        'olive_pollen',
        'ragweed_pollen'
      ],
      hourly: [
        'pm10',
        'pm2_5',
        'european_aqi',
        'ozone',
        'nitrogen_dioxide'
      ],
      forecast_days: 3,
      timezone: 'auto'
    };

    return from(fetchWeatherApi(this.AIR_QUALITY_URL, params)).pipe(
      map(responses => {
        const response = responses[0];
        const current = response.current();
        const hourly = response.hourly();
        const utcOffsetSeconds = Number(response.utcOffsetSeconds());

        let hourlyData = undefined;
        if (hourly) {
          const start = Number(hourly.time());
          const end = Number(hourly.timeEnd());
          const interval = hourly.interval();
          const length = (end - start) / interval;

          const timeArray: string[] = [];
          for (let i = 0; i < length; i++) {
            timeArray.push(new Date((start + i * interval + utcOffsetSeconds) * 1000).toISOString());
          }
          
          hourlyData = {
            time: timeArray,
            pm10: Array.from(hourly.variables(0)?.valuesArray() || []),
            pm2_5: Array.from(hourly.variables(1)?.valuesArray() || []),
            european_aqi: Array.from(hourly.variables(2)?.valuesArray() || []),
            ozone: Array.from(hourly.variables(3)?.valuesArray() || []),
            nitrogen_dioxide: Array.from(hourly.variables(4)?.valuesArray() || [])
          };
        }

        return {
          current: {
            pm10: current?.variables(0)?.value() || undefined,
            pm2_5: current?.variables(1)?.value() || undefined,
            european_aqi: current?.variables(2)?.value() || undefined,
            us_aqi: current?.variables(3)?.value() || undefined,
            ozone: current?.variables(4)?.value() || undefined,
            nitrogen_dioxide: current?.variables(5)?.value() || undefined,
            carbon_monoxide: current?.variables(6)?.value() || undefined,
            sulphur_dioxide: current?.variables(7)?.value() || undefined,
            dust: current?.variables(8)?.value() || undefined,
            uv_index: current?.variables(9)?.value() || undefined,
            ammonia: current?.variables(10)?.value() || undefined,
            alder_pollen: current?.variables(11)?.value() || undefined,
            birch_pollen: current?.variables(12)?.value() || undefined,
            grass_pollen: current?.variables(13)?.value() || undefined,
            mugwort_pollen: current?.variables(14)?.value() || undefined,
            olive_pollen: current?.variables(15)?.value() || undefined,
            ragweed_pollen: current?.variables(16)?.value() || undefined
          },
          hourly: hourlyData
        } as AirQualityData;
      }),
      catchError(error => {
        console.error('Error obteniendo datos de calidad del aire:', error);
        return of({ current: {} } as AirQualityData);
      })
    );
  }

  /**
   * Obtiene datos de riesgo de inundación para un municipio
   */
  getFloodData(municipio: Municipio): Observable<FloodData> {
    if (!municipio.latitud_dec || !municipio.longitud_dec) {
      console.error('El municipio no tiene coordenadas para Flood Data:', municipio);
      return of({ daily: { time: [], river_discharge: [] } });
    }

    const latitude = parseFloat(municipio.latitud_dec);
    const longitude = parseFloat(municipio.longitud_dec);

    const params = {
      latitude,
      longitude,
      daily: [
        'river_discharge',
        'river_discharge_max',
        'river_discharge_mean'
      ],
      forecast_days: 30,
      past_days: 7
    };

    return from(fetchWeatherApi(this.FLOOD_URL, params)).pipe(
      map(responses => {
        const response = responses[0];
        const daily = response.daily();

        return {
          daily: {
            time: Array.from({ length: Number(daily?.time() || 0) }, (_, i) => 
              new Date((Number(daily?.time()) + i * 86400) * 1000).toISOString().split('T')[0]
            ),
            river_discharge: Array.from({ length: daily?.variablesLength() || 0 }, (_, i) => 
              daily?.variables(0)?.valuesArray()?.[i] || 0
            ),
            river_discharge_max: Array.from({ length: daily?.variablesLength() || 0 }, (_, i) => 
              daily?.variables(1)?.valuesArray()?.[i] || 0
            ),
            river_discharge_mean: Array.from({ length: daily?.variablesLength() || 0 }, (_, i) => 
              daily?.variables(2)?.valuesArray()?.[i] || 0
            )
          }
        } as FloodData;
      }),
      catchError(error => {
        console.error('Error obteniendo datos de inundación:', error);
        return of({ daily: { time: [], river_discharge: [] } } as FloodData);
      })
    );
  }

  /**
   * Busca municipios por nombre usando la API de geocoding de Open-Meteo
   * BÚSQUEDA GLOBAL: Busca ciudades en todo el mundo
   */
  searchMunicipios(query: string, count: number = 100): Observable<Municipio[]> {
    if (!query || query.trim().length < 1) {
      return of([]);
    }

    // Usar el máximo permitido por la API (100)
    const params = new URLSearchParams({
      name: query,
      count: Math.min(count, 100).toString(),
      language: 'es',
      format: 'json'
    });

    return from(
      fetch(`${this.GEOCODING_URL}?${params}`)
        .then(response => response.json())
    ).pipe(
      map((data: any) => {
        if (!data.results || !Array.isArray(data.results)) {
          return [];
        }

        // Convertir todos los resultados globales al formato Municipio
        return data.results
          .filter((result: any) => {
            // Excluir resultados sin coordenadas válidas
            return result.latitude && result.longitude;
          })
          .map((result: any, index: number) => {
            // Crear un nombre descriptivo con ciudad, región y país
            const nombreCompleto = result.name;
            const paisInfo = result.country || '';
            const regionInfo = result.admin1 || result.admin2 || '';
            
            return {
              id: `geo-${result.id || `${result.latitude}-${result.longitude}`}`,
              nombre: nombreCompleto,
              provincia: regionInfo,
              ccaa: paisInfo, // Usamos ccaa para almacenar el país
              capital: paisInfo, // También en capital para compatibilidad
              latitud_dec: result.latitude.toFixed(4),
              longitud_dec: result.longitude.toFixed(4),
              num_hab: result.population ? result.population.toString() : undefined,
              poblacion: result.population
            } as Municipio;
          });
      }),
      catchError(error => {
        console.error('Error buscando ciudades:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca ciudades solo en España (para compatibilidad)
   */
  searchMunicipiosEspana(query: string, count: number = 100): Observable<Municipio[]> {
    return this.searchMunicipios(query, count).pipe(
      map(results => results.filter(m => 
        m.ccaa === 'Spain' || 
        m.ccaa === 'España' || 
        m.capital === 'Spain' || 
        m.capital === 'España'
      ))
    );
  }

  private getMunicipiosEstaticos(): Municipio[] {
    return [
      // Capitales de provincia y ciudades principales
      { id: '28079', nombre: 'Madrid', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.4168', longitud_dec: '-3.7038' },
      { id: '08019', nombre: 'Barcelona', provincia: 'Barcelona', ccaa: 'Cataluña', latitud_dec: '41.3851', longitud_dec: '2.1734' },
      { id: '46250', nombre: 'Valencia', provincia: 'Valencia', ccaa: 'Comunidad Valenciana', latitud_dec: '39.4699', longitud_dec: '-0.3763' },
      { id: '41091', nombre: 'Sevilla', provincia: 'Sevilla', ccaa: 'Andalucía', latitud_dec: '37.3891', longitud_dec: '-5.9845' },
      { id: '50297', nombre: 'Zaragoza', provincia: 'Zaragoza', ccaa: 'Aragón', latitud_dec: '41.6488', longitud_dec: '-0.8891' },
      { id: '29067', nombre: 'Málaga', provincia: 'Málaga', ccaa: 'Andalucía', latitud_dec: '36.7213', longitud_dec: '-4.4214' },
      { id: '07040', nombre: 'Palma', provincia: 'Baleares', ccaa: 'Islas Baleares', latitud_dec: '39.5696', longitud_dec: '2.6502' },
      { id: '30030', nombre: 'Murcia', provincia: 'Murcia', ccaa: 'Región de Murcia', latitud_dec: '37.9922', longitud_dec: '-1.1307' },
      { id: '03014', nombre: 'Alicante', provincia: 'Alicante', ccaa: 'Comunidad Valenciana', latitud_dec: '38.3452', longitud_dec: '-0.4810' },
      { id: '35016', nombre: 'Las Palmas', provincia: 'Las Palmas', ccaa: 'Canarias', latitud_dec: '28.1248', longitud_dec: '-15.4300' },
      { id: '48020', nombre: 'Bilbao', provincia: 'Vizcaya', ccaa: 'País Vasco', latitud_dec: '43.2630', longitud_dec: '-2.9350' },
      { id: '11012', nombre: 'Cádiz', provincia: 'Cádiz', ccaa: 'Andalucía', latitud_dec: '36.5297', longitud_dec: '-6.2929' },
      { id: '15030', nombre: 'A Coruña', provincia: 'A Coruña', ccaa: 'Galicia', latitud_dec: '43.3713', longitud_dec: '-8.3960' },
      { id: '14021', nombre: 'Córdoba', provincia: 'Córdoba', ccaa: 'Andalucía', latitud_dec: '37.8882', longitud_dec: '-4.7794' },
      { id: '47186', nombre: 'Valladolid', provincia: 'Valladolid', ccaa: 'Castilla y León', latitud_dec: '41.6523', longitud_dec: '-4.7245' },
      { id: '36038', nombre: 'Vigo', provincia: 'Pontevedra', ccaa: 'Galicia', latitud_dec: '42.2406', longitud_dec: '-8.7207' },
      { id: '33044', nombre: 'Gijón', provincia: 'Asturias', ccaa: 'Principado de Asturias', latitud_dec: '43.5322', longitud_dec: '-5.6611' },
      { id: '20069', nombre: 'San Sebastián', provincia: 'Guipúzcoa', ccaa: 'País Vasco', latitud_dec: '43.3183', longitud_dec: '-1.9812' },
      { id: '18087', nombre: 'Granada', provincia: 'Granada', ccaa: 'Andalucía', latitud_dec: '37.1773', longitud_dec: '-3.5986' },
      { id: '38038', nombre: 'Santa Cruz de Tenerife', provincia: 'Santa Cruz de Tenerife', ccaa: 'Canarias', latitud_dec: '28.4636', longitud_dec: '-16.2518' },
      { id: '01059', nombre: 'Vitoria-Gasteiz', provincia: 'Álava', ccaa: 'País Vasco', latitud_dec: '42.8467', longitud_dec: '-2.6716' },
      { id: '45168', nombre: 'Toledo', provincia: 'Toledo', ccaa: 'Castilla-La Mancha', latitud_dec: '39.8628', longitud_dec: '-4.0273' },
      { id: '37274', nombre: 'Salamanca', provincia: 'Salamanca', ccaa: 'Castilla y León', latitud_dec: '40.9701', longitud_dec: '-5.6635' },
      { id: '26089', nombre: 'Logroño', provincia: 'La Rioja', ccaa: 'La Rioja', latitud_dec: '42.4650', longitud_dec: '-2.4450' },
      { id: '04013', nombre: 'Almería', provincia: 'Almería', ccaa: 'Andalucía', latitud_dec: '36.8381', longitud_dec: '-2.4597' },
      { id: '21041', nombre: 'Huelva', provincia: 'Huelva', ccaa: 'Andalucía', latitud_dec: '37.2614', longitud_dec: '-6.9447' },
      { id: '23050', nombre: 'Jaén', provincia: 'Jaén', ccaa: 'Andalucía', latitud_dec: '37.7796', longitud_dec: '-3.7849' },
      { id: '10037', nombre: 'Cáceres', provincia: 'Cáceres', ccaa: 'Extremadura', latitud_dec: '39.4753', longitud_dec: '-6.3724' },
      { id: '06015', nombre: 'Badajoz', provincia: 'Badajoz', ccaa: 'Extremadura', latitud_dec: '38.8794', longitud_dec: '-6.9707' },
      { id: '39075', nombre: 'Santander', provincia: 'Cantabria', ccaa: 'Cantabria', latitud_dec: '43.4623', longitud_dec: '-3.8100' },
      { id: '31201', nombre: 'Pamplona', provincia: 'Navarra', ccaa: 'Navarra', latitud_dec: '42.8125', longitud_dec: '-1.6458' },
      { id: '02003', nombre: 'Albacete', provincia: 'Albacete', ccaa: 'Castilla-La Mancha', latitud_dec: '38.9943', longitud_dec: '-1.8585' },
      { id: '13034', nombre: 'Ciudad Real', provincia: 'Ciudad Real', ccaa: 'Castilla-La Mancha', latitud_dec: '38.9848', longitud_dec: '-3.9278' },
      { id: '24089', nombre: 'León', provincia: 'León', ccaa: 'Castilla y León', latitud_dec: '42.5987', longitud_dec: '-5.5671' },
      { id: '09059', nombre: 'Burgos', provincia: 'Burgos', ccaa: 'Castilla y León', latitud_dec: '42.3439', longitud_dec: '-3.6969' },
      { id: '16078', nombre: 'Cuenca', provincia: 'Cuenca', ccaa: 'Castilla-La Mancha', latitud_dec: '40.0704', longitud_dec: '-2.1374' },
      { id: '19130', nombre: 'Guadalajara', provincia: 'Guadalajara', ccaa: 'Castilla-La Mancha', latitud_dec: '40.6331', longitud_dec: '-3.1672' },
      { id: '40194', nombre: 'Segovia', provincia: 'Segovia', ccaa: 'Castilla y León', latitud_dec: '40.9429', longitud_dec: '-4.1088' },
      { id: '05019', nombre: 'Ávila', provincia: 'Ávila', ccaa: 'Castilla y León', latitud_dec: '40.6561', longitud_dec: '-4.6991' },
      { id: '49275', nombre: 'Zamora', provincia: 'Zamora', ccaa: 'Castilla y León', latitud_dec: '41.5034', longitud_dec: '-5.7467' },
      { id: '34120', nombre: 'Palencia', provincia: 'Palencia', ccaa: 'Castilla y León', latitud_dec: '42.0096', longitud_dec: '-4.5287' },
      { id: '42173', nombre: 'Soria', provincia: 'Soria', ccaa: 'Castilla y León', latitud_dec: '41.7665', longitud_dec: '-2.4790' },
      { id: '22125', nombre: 'Huesca', provincia: 'Huesca', ccaa: 'Aragón', latitud_dec: '42.1401', longitud_dec: '-0.4078' },
      { id: '44216', nombre: 'Teruel', provincia: 'Teruel', ccaa: 'Aragón', latitud_dec: '40.3456', longitud_dec: '-1.1065' },
      { id: '25120', nombre: 'Lleida', provincia: 'Lleida', ccaa: 'Cataluña', latitud_dec: '41.6147', longitud_dec: '0.6267' },
      { id: '43148', nombre: 'Tarragona', provincia: 'Tarragona', ccaa: 'Cataluña', latitud_dec: '41.1189', longitud_dec: '1.2445' },
      { id: '17079', nombre: 'Girona', provincia: 'Girona', ccaa: 'Cataluña', latitud_dec: '41.9794', longitud_dec: '2.8214' },
      { id: '12040', nombre: 'Castellón', provincia: 'Castellón', ccaa: 'Comunidad Valenciana', latitud_dec: '39.9864', longitud_dec: '-0.0513' },
      { id: '27028', nombre: 'Lugo', provincia: 'Lugo', ccaa: 'Galicia', latitud_dec: '43.0097', longitud_dec: '-7.5567' },
      { id: '32054', nombre: 'Ourense', provincia: 'Ourense', ccaa: 'Galicia', latitud_dec: '42.3363', longitud_dec: '-7.8639' },
      { id: '51001', nombre: 'Ceuta', provincia: 'Ceuta', ccaa: 'Ceuta', latitud_dec: '35.8894', longitud_dec: '-5.3213' },
      { id: '52001', nombre: 'Melilla', provincia: 'Melilla', ccaa: 'Melilla', latitud_dec: '35.2923', longitud_dec: '-2.9381' },
      
      // Ciudades y municipios importantes adicionales
      { id: '28014', nombre: 'Alcalá de Henares', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.4818', longitud_dec: '-3.3636' },
      { id: '28074', nombre: 'Leganés', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.3272', longitud_dec: '-3.7644' },
      { id: '28065', nombre: 'Getafe', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.3056', longitud_dec: '-3.7322' },
      { id: '28148', nombre: 'Alcorcón', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.3458', longitud_dec: '-3.8242' },
      { id: '28092', nombre: 'Móstoles', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.3233', longitud_dec: '-3.8644' },
      { id: '28058', nombre: 'Fuenlabrada', provincia: 'Madrid', ccaa: 'Madrid', latitud_dec: '40.2842', longitud_dec: '-3.7942' },
      { id: '08101', nombre: 'Hospitalet de Llobregat', provincia: 'Barcelona', ccaa: 'Cataluña', latitud_dec: '41.3599', longitud_dec: '2.0994' },
      { id: '08015', nombre: 'Badalona', provincia: 'Barcelona', ccaa: 'Cataluña', latitud_dec: '41.4501', longitud_dec: '2.2466' },
      { id: '08187', nombre: 'Sabadell', provincia: 'Barcelona', ccaa: 'Cataluña', latitud_dec: '41.5431', longitud_dec: '2.1083' },
      { id: '08217', nombre: 'Terrassa', provincia: 'Barcelona', ccaa: 'Cataluña', latitud_dec: '41.5633', longitud_dec: '2.0089' },
      { id: '46131', nombre: 'Elche', provincia: 'Alicante', ccaa: 'Comunidad Valenciana', latitud_dec: '38.2622', longitud_dec: '-0.6983' },
      { id: '03054', nombre: 'Elda', provincia: 'Alicante', ccaa: 'Comunidad Valenciana', latitud_dec: '38.4767', longitud_dec: '-0.7967' },
      { id: '03065', nombre: 'Torrevieja', provincia: 'Alicante', ccaa: 'Comunidad Valenciana', latitud_dec: '37.9789', longitud_dec: '-0.6825' },
      { id: '30016', nombre: 'Cartagena', provincia: 'Murcia', ccaa: 'Región de Murcia', latitud_dec: '37.6256', longitud_dec: '-0.9931' },
      { id: '30024', nombre: 'Lorca', provincia: 'Murcia', ccaa: 'Región de Murcia', latitud_dec: '37.6772', longitud_dec: '-1.6947' },
      { id: '29054', nombre: 'Marbella', provincia: 'Málaga', ccaa: 'Andalucía', latitud_dec: '36.5097', longitud_dec: '-4.8850' },
      { id: '11020', nombre: 'Jerez de la Frontera', provincia: 'Cádiz', ccaa: 'Andalucía', latitud_dec: '36.6864', longitud_dec: '-6.1367' },
      { id: '11002', nombre: 'Algeciras', provincia: 'Cádiz', ccaa: 'Andalucía', latitud_dec: '36.1272', longitud_dec: '-5.4508' },
      { id: '41004', nombre: 'Dos Hermanas', provincia: 'Sevilla', ccaa: 'Andalucía', latitud_dec: '37.2825', longitud_dec: '-5.9214' },
      { id: '35019', nombre: 'Telde', provincia: 'Las Palmas', ccaa: 'Canarias', latitud_dec: '27.9922', longitud_dec: '-15.4189' },
      { id: '38023', nombre: 'La Laguna', provincia: 'Santa Cruz de Tenerife', ccaa: 'Canarias', latitud_dec: '28.4853', longitud_dec: '-16.3206' },
      { id: '33033', nombre: 'Oviedo', provincia: 'Asturias', ccaa: 'Principado de Asturias', latitud_dec: '43.3614', longitud_dec: '-5.8593' },
      { id: '36054', nombre: 'Pontevedra', provincia: 'Pontevedra', ccaa: 'Galicia', latitud_dec: '42.4330', longitud_dec: '-8.6482' },
      { id: '15036', nombre: 'Santiago de Compostela', provincia: 'A Coruña', ccaa: 'Galicia', latitud_dec: '42.8782', longitud_dec: '-8.5448' },
      { id: '15037', nombre: 'Ferrol', provincia: 'A Coruña', ccaa: 'Galicia', latitud_dec: '43.4833', longitud_dec: '-8.2333' }
    ];
  }

  private getCachedMunicipios(): Municipio[] | null {
    try {
      const CACHE_VERSION = 'v8-dataset-local'; // JSON local generado con script
      const cached = localStorage.getItem('weather_municipios');
      const version = localStorage.getItem('weather_municipios_version');
      
      if (!cached || version !== CACHE_VERSION) {
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
      const CACHE_VERSION = 'v8-dataset-local'; // JSON local generado con script
      localStorage.setItem('weather_municipios', JSON.stringify(municipios));
      localStorage.setItem('weather_municipios_version', CACHE_VERSION);
      console.log(`💾 ${municipios.length} municipios guardados en caché`);
    } catch (error) {
      console.error('Error guardando municipios en caché:', error);
    }
  }

  /**
   * Genera alertas completas combinando datos meteorológicos, calidad del aire e inundación
   */
  generateComprehensiveAlerts(municipio: Municipio): Observable<WeatherAlert[]> {
    return this.getWeatherForecast(municipio).pipe(
      switchMap(weatherData => {
        // Obtener datos de calidad del aire y riesgo de inundación en paralelo
        const airQuality$ = this.getAirQuality(municipio);
        const flood$ = this.getFloodData(municipio);

        return airQuality$.pipe(
          switchMap(airQuality => 
            flood$.pipe(
              map(flood => {
                const alerts: WeatherAlert[] = [];
                
                // Generar alertas meteorológicas tradicionales
                const weatherAlerts = this.generateWeatherAlerts(weatherData);
                alerts.push(...weatherAlerts);
                
                // Generar alertas de calidad del aire
                const airQualityAlerts = this.generateAirQualityAlerts(airQuality, municipio.nombre);
                alerts.push(...airQualityAlerts);
                
                // Generar alertas de riesgo de inundación
                const floodAlerts = this.generateFloodAlerts(flood, municipio.nombre);
                alerts.push(...floodAlerts);

                return alerts;
              })
            )
          )
        );
      }),
      catchError(error => {
        console.error('Error generando alertas completas:', error);
        // Fallback: solo generar alertas meteorológicas básicas
        return this.getWeatherForecast(municipio).pipe(
          map(weatherData => this.generateWeatherAlerts(weatherData)),
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Genera alertas de calidad del aire
   */
  private generateAirQualityAlerts(airQualityData: AirQualityData, locationName: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const { current } = airQualityData;
    
    if (!current) return alerts;

    // Alerta de Índice de Calidad del Aire Europeo
    if (current.european_aqi && current.european_aqi > 40) {
      alerts.push({
        id: `aqi-eur-${Date.now()}`,
        tipo: 'Calidad del Aire',
        nivel: current.european_aqi >= 80 ? 'roja' : current.european_aqi >= 60 ? 'naranja' : 'amarilla',
        nivelTexto: current.european_aqi >= 80 ? 'Muy Mala' : current.european_aqi >= 60 ? 'Mala' : 'Moderada',
        zona: locationName,
        icono: 'smog',
        descripcion: `ICA Europeo: ${Math.round(current.european_aqi)} (${this.getAQIDescription(current.european_aqi)})`,
        valor: current.european_aqi,
        umbral: 40,
        categoria: 'calidad_aire'
      });
    }

    // Alertas de PM2.5
    if (current.pm2_5 && current.pm2_5 > 15) {
      alerts.push({
        id: `pm25-${Date.now()}`,
        tipo: 'Partículas PM2.5',
        nivel: current.pm2_5 >= 35 ? 'roja' : current.pm2_5 >= 25 ? 'naranja' : 'amarilla',
        nivelTexto: current.pm2_5 >= 35 ? 'Muy Alto' : current.pm2_5 >= 25 ? 'Alto' : 'Moderado',
        zona: locationName,
        icono: 'lungs',
        descripcion: `PM2.5: ${Math.round(current.pm2_5)} μg/m³`,
        valor: current.pm2_5,
        umbral: 15,
        categoria: 'calidad_aire'
      });
    }

    // Alertas de PM10
    if (current.pm10 && current.pm10 > 25) {
      alerts.push({
        id: `pm10-${Date.now()}`,
        tipo: 'Partículas PM10',
        nivel: current.pm10 >= 75 ? 'roja' : current.pm10 >= 50 ? 'naranja' : 'amarilla',
        nivelTexto: current.pm10 >= 75 ? 'Muy Alto' : current.pm10 >= 50 ? 'Alto' : 'Moderado',
        zona: locationName,
        icono: 'industry',
        descripcion: `PM10: ${Math.round(current.pm10)} μg/m³`,
        valor: current.pm10,
        umbral: 25,
        categoria: 'calidad_aire'
      });
    }

    // Alertas de Ozono
    if (current.ozone && current.ozone > 120) {
      alerts.push({
        id: `ozone-${Date.now()}`,
        tipo: 'Ozono Troposférico',
        nivel: current.ozone >= 240 ? 'roja' : current.ozone >= 180 ? 'naranja' : 'amarilla',
        nivelTexto: current.ozone >= 240 ? 'Muy Alto' : current.ozone >= 180 ? 'Alto' : 'Moderado',
        zona: locationName,
        icono: 'atom',
        descripcion: `Ozono: ${Math.round(current.ozone)} μg/m³`,
        valor: current.ozone,
        umbral: 120,
        categoria: 'calidad_aire'
      });
    }

    // Alertas de Polen (solo en temporada)
    const pollenTypes = [
      { value: current.olive_pollen, name: 'Olivo', icon: 'leaf' },
      { value: current.grass_pollen, name: 'Gramíneas', icon: 'seedling' },
      { value: current.birch_pollen, name: 'Abedul', icon: 'tree' },
      { value: current.ragweed_pollen, name: 'Ambrosía', icon: 'pagelines' }
    ];

    pollenTypes.forEach(pollen => {
      if (pollen.value && pollen.value > 10) {
        alerts.push({
          id: `pollen-${pollen.name.toLowerCase()}-${Date.now()}`,
          tipo: `Polen ${pollen.name}`,
          nivel: pollen.value >= 50 ? 'naranja' : 'amarilla',
          nivelTexto: pollen.value >= 50 ? 'Alto' : 'Moderado',
          zona: locationName,
          icono: pollen.icon,
          descripcion: `${pollen.name}: ${Math.round(pollen.value)} granos/m³`,
          valor: pollen.value,
          umbral: 10,
          categoria: 'polen'
        });
      }
    });

    return alerts;
  }

  /**
   * Genera alertas de riesgo de inundación
   */
  private generateFloodAlerts(floodData: FloodData, locationName: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const { daily } = floodData;
    
    if (!daily || !daily.river_discharge || daily.river_discharge.length === 0) {
      return alerts;
    }

    // Analizar caudal actual y pronóstico próximos 7 días
    const recentDischarge = daily.river_discharge.slice(0, 7);
    const currentDischarge = recentDischarge[0] || 0;
    const maxDischarge = Math.max(...recentDischarge);
    const avgDischarge = recentDischarge.reduce((sum, val) => sum + val, 0) / recentDischarge.length;

    // Alerta de caudal alto (comparado con el promedio)
    if (currentDischarge > avgDischarge * 2 && currentDischarge > 50) {
      alerts.push({
        id: `flood-current-${Date.now()}`,
        tipo: 'Caudal Elevado',
        nivel: currentDischarge > avgDischarge * 4 ? 'roja' : currentDischarge > avgDischarge * 3 ? 'naranja' : 'amarilla',
        nivelTexto: currentDischarge > avgDischarge * 4 ? 'Muy Alto' : currentDischarge > avgDischarge * 3 ? 'Alto' : 'Moderado',
        zona: locationName,
        icono: 'water',
        descripcion: `Caudal actual: ${Math.round(currentDischarge)} m³/s (${Math.round((currentDischarge / avgDischarge) * 100)}% sobre media)`,
        valor: currentDischarge,
        umbral: avgDischarge * 2,
        categoria: 'inundacion'
      });
    }

    // Alerta de incremento de caudal previsto
    if (daily.river_discharge_max && daily.river_discharge_max.length > 0) {
      const maxExpected = Math.max(...daily.river_discharge_max.slice(0, 7));
      if (maxExpected > currentDischarge * 2 && maxExpected > 100) {
        alerts.push({
          id: `flood-forecast-${Date.now()}`,
          tipo: 'Riesgo de Inundación',
          nivel: maxExpected > currentDischarge * 4 ? 'roja' : maxExpected > currentDischarge * 3 ? 'naranja' : 'amarilla',
          nivelTexto: maxExpected > currentDischarge * 4 ? 'Alto Riesgo' : maxExpected > currentDischarge * 3 ? 'Riesgo Moderado' : 'Vigilancia',
          zona: locationName,
          icono: 'flood',
          descripcion: `Caudal máximo previsto: ${Math.round(maxExpected)} m³/s en próximos 7 días`,
          valor: maxExpected,
          umbral: currentDischarge * 2,
          categoria: 'inundacion'
        });
      }
    }

    return alerts;
  }

  /**
   * Obtiene descripción textual del Índice de Calidad del Aire Europeo
   */
  private getAQIDescription(aqi: number): string {
    if (aqi <= 20) return 'Buena';
    if (aqi <= 40) return 'Regular';
    if (aqi <= 60) return 'Moderada';
    if (aqi <= 80) return 'Mala';
    if (aqi <= 100) return 'Muy Mala';
    return 'Extremadamente Mala';
  }

  /**
   * Genera alertas meteorológicas basadas en los datos actuales y futuros de Open-Meteo
   * Analiza condiciones extremas y potencialmente peligrosas
   */
  generateWeatherAlerts(weatherData: WeatherData): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const locationName = weatherData.municipio.nombre;
    
    console.log('🔍 Analizando alertas para:', locationName, weatherData.current);
    
    // Analizar datos actuales
    if (weatherData.current) {
      const { windSpeed, windGusts, temperature, precipitation, humidity, pressureMsl } = weatherData.current;
      
      console.log('📊 Datos actuales:', { windSpeed, temperature, precipitation, humidity });
      
      // Alerta de viento (umbrales MÁS BAJOS para debugging)
      const windValue = windGusts || windSpeed;
      if (windValue >= 10) { // Bajado de 25 a 10
        alerts.push({
          id: `wind-${Date.now()}`,
          tipo: windValue >= 25 ? 'Viento Fuerte' : 'Viento Moderado',
          nivel: windValue >= 40 ? 'roja' : windValue >= 25 ? 'naranja' : 'amarilla',
          nivelTexto: windValue >= 40 ? 'Alto' : windValue >= 25 ? 'Moderado' : 'Leve',
          zona: locationName,
          icono: 'wind',
          descripcion: `Viento de ${Math.round(windValue)} km/h`,
          valor: windValue,
          umbral: 10,
          categoria: 'meteorologica'
        });
      }
      
      // Alerta de temperatura (umbrales MÁS BAJOS)
      if (temperature >= 20) { // Bajado de 30 a 20
        alerts.push({
          id: `heat-${Date.now()}`,
          tipo: temperature >= 30 ? 'Calor Intenso' : 'Temperatura Elevada',
          nivel: temperature >= 35 ? 'roja' : temperature >= 25 ? 'naranja' : 'amarilla',
          nivelTexto: temperature >= 35 ? 'Alta' : temperature >= 25 ? 'Moderada' : 'Leve',
          zona: locationName,
          icono: 'temperature-high',
          descripcion: `Temperatura de ${Math.round(temperature)}°C`,
          valor: temperature,
          umbral: 20,
          categoria: 'meteorologica'
        });
      } else if (temperature <= 5) { // Bajado de 0 a 5
        alerts.push({
          id: `cold-${Date.now()}`,
          tipo: temperature <= 0 ? 'Frío Intenso' : 'Temperatura Baja',
          nivel: temperature <= -5 ? 'roja' : temperature <= 0 ? 'naranja' : 'amarilla',
          nivelTexto: temperature <= -5 ? 'Muy Baja' : temperature <= 0 ? 'Baja' : 'Fresca',
          zona: locationName,
          icono: 'temperature-low',
          descripcion: `Temperatura de ${Math.round(temperature)}°C`,
          valor: Math.abs(temperature),
          umbral: 5,
          categoria: 'meteorologica'
        });
      }
      
      // Alerta de precipitación (umbrales MÁS BAJOS)
      if (precipitation != null && precipitation > 0.1) { // Bajado mucho más
        const hourlyPrecip = precipitation * 60; // Convertir a mm/h
        alerts.push({
          id: `rain-${Date.now()}`,
          tipo: hourlyPrecip >= 5 ? 'Lluvia Intensa' : 'Lluvia',
          nivel: hourlyPrecip >= 10 ? 'roja' : hourlyPrecip >= 5 ? 'naranja' : 'amarilla',
          nivelTexto: hourlyPrecip >= 10 ? 'Intensa' : hourlyPrecip >= 5 ? 'Moderada' : 'Leve',
          zona: locationName,
          icono: 'cloud-rain',
          descripcion: `Precipitación de ${hourlyPrecip.toFixed(1)} mm/h`,
          valor: hourlyPrecip,
          umbral: 0.1,
          categoria: 'meteorologica'
        });
      }
      
      // Alerta de humedad alta (NUEVA - muy común)
      if (humidity >= 70) {
        alerts.push({
          id: `humidity-${Date.now()}`,
          tipo: 'Humedad Elevada',
          nivel: humidity >= 90 ? 'naranja' : 'amarilla',
          nivelTexto: humidity >= 90 ? 'Muy Alta' : 'Alta',
          zona: locationName,
          icono: 'tint',
          descripcion: `Humedad relativa del ${Math.round(humidity)}%`,
          valor: humidity,
          umbral: 70,
          categoria: 'meteorologica'
        });
      }
      
      // Alerta de presión baja (NUEVA)
      if (pressureMsl && pressureMsl < 1013) {
        alerts.push({
          id: `pressure-${Date.now()}`,
          tipo: 'Presión Atmosférica Baja',
          nivel: pressureMsl < 1000 ? 'naranja' : 'amarilla',
          nivelTexto: pressureMsl < 1000 ? 'Muy Baja' : 'Baja',
          zona: locationName,
          icono: 'tachometer-alt',
          descripcion: `Presión de ${Math.round(pressureMsl)} hPa`,
          valor: 1013 - pressureMsl,
          umbral: 1013,
          categoria: 'meteorologica'
        });
      }
    }
    
    // Analizar previsión próximas 24 horas
    if (weatherData.hourly && weatherData.hourly.length > 0) {
      const next24Hours = weatherData.hourly.slice(0, 24);
      
      // Buscar precipitación acumulada (umbral MÁS BAJO)
      const totalPrecip = next24Hours.reduce((sum, h) => sum + (h.precipitation || 0), 0);
      if (totalPrecip >= 5) { // Bajado de 40 a 5
        alerts.push({
          id: `heavy-rain-${Date.now()}`,
          tipo: totalPrecip >= 40 ? 'Lluvias Abundantes' : 'Lluvia Prevista',
          nivel: totalPrecip >= 50 ? 'roja' : totalPrecip >= 20 ? 'naranja' : 'amarilla',
          nivelTexto: totalPrecip >= 50 ? 'Intensa' : totalPrecip >= 20 ? 'Moderada' : 'Leve',
          zona: locationName,
          icono: 'cloud-showers-heavy',
          descripcion: `Acumulado previsto de ${totalPrecip.toFixed(1)} mm en 24h`,
          valor: totalPrecip,
          umbral: 5,
          categoria: 'meteorologica'
        });
      }
      
      // Buscar tormentas (código meteorológico)
      const hasThunderstorm = next24Hours.some(h => 
        h.weatherCode >= 95 && h.weatherCode <= 99
      );
      if (hasThunderstorm) {
        alerts.push({
          id: `storm-${Date.now()}`,
          tipo: 'Tormentas',
          nivel: 'naranja',
          nivelTexto: 'Activas',
          zona: locationName,
          icono: 'bolt',
          descripcion: 'Probabilidad de tormentas en las próximas 24 horas',
          valor: 1,
          umbral: 1,
          categoria: 'meteorologica'
        });
      }
      
      // Buscar nevadas (umbral MÁS BAJO)
      const totalSnow = next24Hours.reduce((sum, h) => sum + (h.snowfall || 0), 0);
      if (totalSnow >= 1) { // Bajado de 5 a 1
        alerts.push({
          id: `snow-${Date.now()}`,
          tipo: 'Nevadas',
          nivel: totalSnow >= 10 ? 'naranja' : 'amarilla',
          nivelTexto: totalSnow >= 10 ? 'Intensas' : 'Leves',
          zona: locationName,
          icono: 'snowflake',
          descripcion: `Acumulación prevista de ${totalSnow.toFixed(1)} cm`,
          valor: totalSnow,
          umbral: 1,
          categoria: 'meteorologica'
        });
      }
      
      // Alertas de tendencia de temperatura
      const tempChange = Math.abs(next24Hours[0].temperature - next24Hours[Math.min(6, next24Hours.length - 1)].temperature);
      if (tempChange >= 5) {
        alerts.push({
          id: `temp-change-${Date.now()}`,
          tipo: 'Cambio de Temperatura',
          nivel: tempChange >= 15 ? 'naranja' : 'amarilla',
          nivelTexto: tempChange >= 15 ? 'Brusco' : 'Gradual',
          zona: locationName,
          icono: 'thermometer-half',
          descripcion: `Variación esperada de ${Math.round(tempChange)}°C en 6h`,
          valor: tempChange,
          umbral: 5,
          categoria: 'meteorologica'
        });
      }
    }
    
    // Analizar datos diarios para alertas de UV (umbral MÁS BAJO)
    if (weatherData.daily && weatherData.daily.length > 0) {
      const today = weatherData.daily[0];
      if (today.uvIndexMax && today.uvIndexMax >= 3) { // Bajado de 8 a 3
        alerts.push({
          id: `uv-${Date.now()}`,
          tipo: 'Radiación UV',
          nivel: today.uvIndexMax >= 8 ? 'roja' : today.uvIndexMax >= 6 ? 'naranja' : 'amarilla',
          nivelTexto: today.uvIndexMax >= 8 ? 'Muy Alta' : today.uvIndexMax >= 6 ? 'Alta' : 'Moderada',
          zona: locationName,
          icono: 'sun',
          descripcion: `Índice UV: ${Math.round(today.uvIndexMax)}`,
          valor: today.uvIndexMax,
          umbral: 3,
          categoria: 'meteorologica'
        });
      }
    }
    
    // ALERTA GARANTIZADA para debugging - si no hay ninguna alerta, crear una informativa
    if (alerts.length === 0) {
      console.log('🔧 No se generaron alertas, creando alerta informativa...');
      alerts.push({
        id: `conditions-${Date.now()}`,
        tipo: 'Condiciones Actuales',
        nivel: 'amarilla',
        nivelTexto: 'Monitoreando',
        zona: locationName,
        icono: 'eye',
        descripcion: `Temperatura: ${Math.round(weatherData.current?.temperature || 0)}°C, Viento: ${Math.round(weatherData.current?.windSpeed || 0)} km/h`,
        valor: 1,
        umbral: 0,
        categoria: 'meteorologica'
      });
    }
    
    console.log(`✅ ${alerts.length} alertas generadas para ${locationName}:`, alerts);
    return alerts;
  }
}
