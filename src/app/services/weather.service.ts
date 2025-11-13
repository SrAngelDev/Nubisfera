import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { fetchWeatherApi } from 'openmeteo';
import { Municipio } from '../models/municipio.model';
import { WeatherData, DailyForecast, HourlyForecast } from '../models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly API_URL = 'https://api.open-meteo.com/v1/forecast';
  private readonly GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  
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
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m'
      ],
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m'
      ],
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'precipitation_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant'
      ],
      timezone: 'Europe/Madrid',
      forecast_days: 7
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
          weatherCode: current.variables(3)?.value() ?? 0,
          windSpeed: current.variables(4)?.value() ?? 0,
          windDirection: current.variables(5)?.value() ?? 0
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

        for (let i = 0; i < hourlyLength; i++) {
          const time = new Date((hourlyTimeStart + i * hourlyInterval + utcOffsetSeconds) * 1000);
          
          // Obtener arrays una sola vez para mejor rendimiento y seguridad
          const tempArray = hourly.variables(0)?.valuesArray();
          const humidityArray = hourly.variables(1)?.valuesArray();
          const appTempArray = hourly.variables(2)?.valuesArray();
          const precipProbArray = hourly.variables(3)?.valuesArray();
          const precipArray = hourly.variables(4)?.valuesArray();
          const weatherCodeArray = hourly.variables(5)?.valuesArray();
          const windSpeedArray = hourly.variables(6)?.valuesArray();
          const windDirArray = hourly.variables(7)?.valuesArray();
          
          hourlyData.push({
            time,
            temperature: tempArray?.[i] ?? 0,
            humidity: humidityArray?.[i] ?? 0,
            apparentTemperature: appTempArray?.[i] ?? 0,
            precipitationProbability: precipProbArray?.[i] ?? 0,
            precipitation: precipArray?.[i] ?? 0,
            weatherCode: weatherCodeArray?.[i] ?? 0,
            windSpeed: windSpeedArray?.[i] ?? 0,
            windDirection: windDirArray?.[i] ?? 0
          });
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

        for (let i = 0; i < dailyLength; i++) {
          const time = new Date((dailyTimeStart + i * dailyInterval + utcOffsetSeconds) * 1000);
          
          // Obtener arrays una sola vez
          const weatherCodeArray = daily.variables(0)?.valuesArray();
          const tempMaxArray = daily.variables(1)?.valuesArray();
          const tempMinArray = daily.variables(2)?.valuesArray();
          const appTempMaxArray = daily.variables(3)?.valuesArray();
          const appTempMinArray = daily.variables(4)?.valuesArray();
          const sunriseArray = daily.variables(5)?.valuesArray();
          const sunsetArray = daily.variables(6)?.valuesArray();
          const precipSumArray = daily.variables(7)?.valuesArray();
          const precipProbArray = daily.variables(8)?.valuesArray();
          const windSpeedArray = daily.variables(9)?.valuesArray();
          const windDirArray = daily.variables(10)?.valuesArray();
          
          dailyData.push({
            date: time,
            weatherCode: weatherCodeArray?.[i] ?? 0,
            temperatureMax: tempMaxArray?.[i] ?? 0,
            temperatureMin: tempMinArray?.[i] ?? 0,
            apparentTemperatureMax: appTempMaxArray?.[i] ?? 0,
            apparentTemperatureMin: appTempMinArray?.[i] ?? 0,
            sunrise: sunriseArray?.[i] ? new Date((Number(sunriseArray[i]) + utcOffsetSeconds) * 1000) : time,
            sunset: sunsetArray?.[i] ? new Date((Number(sunsetArray[i]) + utcOffsetSeconds) * 1000) : time,
            precipitationSum: precipSumArray?.[i] ?? 0,
            precipitationProbabilityMax: precipProbArray?.[i] ?? 0,
            windSpeedMax: windSpeedArray?.[i] ?? 0,
            windDirectionDominant: windDirArray?.[i] ?? 0
          });
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
   * Obtiene una lista de municipios españoles
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
        console.log(`📈 Cobertura: ${((municipios.length / 8131) * 100).toFixed(1)}% de España`);
        
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
   * Busca municipios por nombre usando la API de geocoding de Open-Meteo
   * Esto permite buscar cualquier municipio de España
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

        // Filtrar solo resultados de España y convertir al formato Municipio
        return data.results
          .filter((result: any) => {
            // Filtrar solo España usando múltiples criterios
            const esEspana = result.country === 'España' || 
                           result.country === 'Spain' ||
                           result.country_code === 'ES';
            
            // Excluir resultados sin coordenadas válidas
            const tieneCoordenadasValidas = result.latitude && result.longitude;
            
            return esEspana && tieneCoordenadasValidas;
          })
          .map((result: any, index: number) => ({
            id: `geo-${result.id || `${result.latitude}-${result.longitude}`}`,
            nombre: result.name,
            provincia: result.admin2 || result.admin1 || '',
            ccaa: result.admin1 || '',
            latitud_dec: result.latitude.toFixed(4),
            longitud_dec: result.longitude.toFixed(4),
            num_hab: result.population ? result.population.toString() : undefined
          } as Municipio));
      }),
      catchError(error => {
        console.error('Error buscando municipios:', error);
        return of([]);
      })
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
}
