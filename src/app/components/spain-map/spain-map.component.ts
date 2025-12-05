import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Municipio } from '../../models/municipio.model';

declare const google: any;

interface ProvinciaData {
  provincia: string;
  temperaturaMedia: number;
  municipiosCapitales: Municipio[];
}

@Component({
  selector: 'app-spain-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spain-map.component.html',
  styleUrls: ['./spain-map.component.css']
})
export class SpainMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() provinciaSeleccionada = new EventEmitter<string>();

  private chartsLoaded = false;
  private resizeObserver?: ResizeObserver;
  isLoading = true;
  provinciasData: ProvinciaData[] = [];
  selectedProvincia: string | null = null;

  // Mapa de provincias a comunidades autónomas (códigos ISO 3166-2)
  private readonly PROVINCIA_TO_CCAA: { [key: string]: string } = {
    // Andalucía
    'Almería': 'ES-AN', 'Cádiz': 'ES-AN', 'Córdoba': 'ES-AN', 'Granada': 'ES-AN',
    'Huelva': 'ES-AN', 'Jaén': 'ES-AN', 'Málaga': 'ES-AN', 'Sevilla': 'ES-AN',
    // Aragón
    'Huesca': 'ES-AR', 'Teruel': 'ES-AR', 'Zaragoza': 'ES-AR',
    // Asturias
    'Asturias': 'ES-AS',
    // Baleares
    'Baleares': 'ES-IB', 'Islas Baleares': 'ES-IB',
    // Canarias
    'Las Palmas': 'ES-CN', 'Santa Cruz de Tenerife': 'ES-CN',
    // Cantabria
    'Cantabria': 'ES-CB',
    // Castilla-La Mancha
    'Albacete': 'ES-CM', 'Ciudad Real': 'ES-CM', 'Cuenca': 'ES-CM',
    'Guadalajara': 'ES-CM', 'Toledo': 'ES-CM',
    // Castilla y León
    'Ávila': 'ES-CL', 'Burgos': 'ES-CL', 'León': 'ES-CL', 'Palencia': 'ES-CL',
    'Salamanca': 'ES-CL', 'Segovia': 'ES-CL', 'Soria': 'ES-CL', 'Valladolid': 'ES-CL', 'Zamora': 'ES-CL',
    // Cataluña
    'Barcelona': 'ES-CT', 'Gerona': 'ES-CT', 'Lérida': 'ES-CT', 'Tarragona': 'ES-CT',
    // Extremadura
    'Badajoz': 'ES-EX', 'Cáceres': 'ES-EX',
    // Galicia
    'A Coruña': 'ES-GA', 'La Coruña': 'ES-GA', 'Lugo': 'ES-GA', 'Orense': 'ES-GA', 'Pontevedra': 'ES-GA',
    // La Rioja
    'La Rioja': 'ES-RI',
    // Madrid
    'Madrid': 'ES-MD',
    // Murcia
    'Murcia': 'ES-MC',
    // Navarra
    'Navarra': 'ES-NC',
    // País Vasco
    'Álava': 'ES-PV', 'Guipúzcoa': 'ES-PV', 'Vizcaya': 'ES-PV',
    // Comunidad Valenciana
    'Alicante': 'ES-VC', 'Castellón': 'ES-VC', 'Valencia': 'ES-VC'
  };

  private readonly CCAA_NOMBRES: { [key: string]: string } = {
    'ES-AN': 'Andalucía', 'ES-AR': 'Aragón', 'ES-AS': 'Asturias',
    'ES-IB': 'Islas Baleares', 'ES-CN': 'Canarias', 'ES-CB': 'Cantabria',
    'ES-CM': 'Castilla-La Mancha', 'ES-CL': 'Castilla y León', 'ES-CT': 'Cataluña',
    'ES-EX': 'Extremadura', 'ES-GA': 'Galicia', 'ES-RI': 'La Rioja',
    'ES-MD': 'Madrid', 'ES-MC': 'Murcia', 'ES-NC': 'Navarra',
    'ES-PV': 'País Vasco', 'ES-VC': 'Comunidad Valenciana'
  };

  constructor(private http: HttpClient, private zone: NgZone) {}

  ngOnInit() {
    this.cargarDatosProvincias();
  }

  ngAfterViewInit() {
    this.loadGoogleCharts();
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private loadGoogleCharts() {
    if (typeof google !== 'undefined' && google.charts) {
      console.log('📦 Cargando Google Charts...');
      google.charts.load('current', {
        'packages': ['geochart'],
        'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
      });
      google.charts.setOnLoadCallback(() => {
        console.log('✅ Google Charts cargado correctamente');
        this.chartsLoaded = true;
        if (this.provinciasData.length > 0) {
          console.log('🗺️ Datos ya disponibles, dibujando mapa inmediatamente...');
          setTimeout(() => this.drawMap(), 100);
        } else {
          console.log('⏳ Esperando a que se carguen los datos de provincias...');
        }
      });
    }
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartsLoaded && this.provinciasData.length > 0) {
          this.drawMap();
        }
      });

      const container = document.querySelector('.spain-map-container');
      if (container) {
        this.resizeObserver.observe(container);
      }
    }
  }

  private async cargarDatosProvincias() {
    try {
      this.isLoading = true;
      
      // Cargar municipios
      const response = await fetch('/municipios-espana.json');
      const data = await response.json();
      const municipios: Municipio[] = data.municipios;

      // Agrupar por provincia y obtener capitales
      const provinciaMap = new Map<string, Municipio[]>();
      
      municipios.forEach(municipio => {
        if (!municipio.provincia) return;
        
        if (!provinciaMap.has(municipio.provincia)) {
          provinciaMap.set(municipio.provincia, []);
        }
        provinciaMap.get(municipio.provincia)!.push(municipio);
      });

      // Obtener datos meteorológicos para las capitales de provincia
      // Procesamos en lotes para evitar saturar la red y el DNS (ERR_NAME_NOT_RESOLVED)
      const entries = Array.from(provinciaMap.entries());
      const batchSize = 5;
      const resultados: ProvinciaData[] = [];

      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchPromises = batch.map(async ([provincia, municipios]) => {
          // Intentar encontrar la capital de provincia
          let capital = municipios.find(m => 
            m.nombre.toLowerCase() === provincia.toLowerCase() ||
            m.nombre.toLowerCase().includes(provincia.toLowerCase()) ||
            (m.capital && m.capital.toLowerCase() === provincia.toLowerCase())
          );

          // Si no encuentra capital, usar el municipio más poblado
          if (!capital && municipios.length > 0) {
            capital = municipios.reduce((prev, current) => {
              const currentPob = parseInt(current.num_hab || '0');
              const prevPob = parseInt(prev.num_hab || '0');
              return currentPob > prevPob ? current : prev;
            });
          }

          if (capital) {
            try {
              const temp = await this.obtenerTemperaturaMunicipio(capital);
              return {
                provincia,
                temperaturaMedia: temp,
                municipiosCapitales: [capital!]
              } as ProvinciaData;
            } catch (e) {
              console.warn(`Error obteniendo datos para ${provincia}`, e);
              return null;
            }
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(res => {
          if (res) resultados.push(res);
        });

        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.provinciasData = resultados;
      console.log('✅ Datos de provincias cargados:', this.provinciasData.length);
      console.log('📊 Primeras 3 provincias:', this.provinciasData.slice(0, 3));
      this.isLoading = false;

      if (this.chartsLoaded) {
        console.log('🗺️ Google Charts ya cargado, dibujando mapa...');
        // Esperar a que Angular actualice el DOM para que el contenedor exista
        setTimeout(() => {
          this.drawMap();
        }, 100);
      } else {
        console.log('⏳ Esperando a que Google Charts se cargue...');
      }

    } catch (error) {
      console.error('Error cargando datos de provincias:', error);
      this.isLoading = false;
    }
  }

  private async obtenerTemperaturaMunicipio(municipio: Municipio): Promise<number> {
    try {
      if (!municipio.latitud_dec || !municipio.longitud_dec) {
        return 15; // Temperatura por defecto
      }
      
      const lat = parseFloat(municipio.latitud_dec);
      const lon = parseFloat(municipio.longitud_dec);
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.current?.temperature_2m || 15; // Temperatura por defecto
    } catch (error) {
      console.error(`Error obteniendo temperatura para ${municipio.nombre}:`, error);
      return 15; // Temperatura por defecto en caso de error
    }
  }

  private drawMap() {
    console.log('🎨 drawMap() llamado');
    console.log('📍 provinciasData disponibles:', this.provinciasData?.length || 0);
    
    if (!this.provinciasData || this.provinciasData.length === 0) {
      console.warn('⚠️ No hay datos de provincias para dibujar');
      return;
    }

    const mapContainer = document.getElementById('spain_map');
    if (!mapContainer) {
      console.error('❌ No se encontró el contenedor del mapa #spain_map');
      return;
    }
    console.log('✅ Contenedor del mapa encontrado');

    // Agrupar provincias por comunidad autónoma y calcular temperatura media
    const ccaaTemps = new Map<string, { suma: number; count: number; provincias: string[] }>();
    
    this.provinciasData.forEach(pd => {
      const ccaaCode = this.PROVINCIA_TO_CCAA[pd.provincia];
      if (ccaaCode) {
        if (!ccaaTemps.has(ccaaCode)) {
          ccaaTemps.set(ccaaCode, { suma: 0, count: 0, provincias: [] });
        }
        const data = ccaaTemps.get(ccaaCode)!;
        data.suma += pd.temperaturaMedia;
        data.count++;
        data.provincias.push(pd.provincia);
      } else {
        console.warn(`⚠️ No hay código CCAA para la provincia: ${pd.provincia}`);
      }
    });

    // Crear array de datos para el mapa
    const mapData: [string, number][] = [];
    ccaaTemps.forEach((data, ccaaCode) => {
      const tempMedia = data.suma / data.count;
      mapData.push([ccaaCode, tempMedia]);
      console.log(`📍 ${this.CCAA_NOMBRES[ccaaCode]}: ${tempMedia.toFixed(1)}°C (${data.count} provincias)`);
    });

    const data = google.visualization.arrayToDataTable([
      ['Comunidad Autónoma', 'Temperatura'],
      ...mapData
    ]);

    console.log(`📊 Comunidades autónomas procesadas: ${data.getNumberOfRows()}`);

    // Calcular rango de temperaturas desde el DataTable
    const temperaturas: number[] = [];
    for (let i = 0; i < data.getNumberOfRows(); i++) {
      temperaturas.push(data.getValue(i, 1));
    }
    const minTemp = Math.min(...temperaturas);
    const maxTemp = Math.max(...temperaturas);
    console.log(`🌡️ Rango de temperaturas: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`);

    // Ajustar altura según tamaño de pantalla
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    let chartHeight = 650;
    
    if (isMobile) {
      chartHeight = window.innerWidth < 480 ? 320 : 450;
    } else if (isTablet) {
      chartHeight = 500;
    }

    const options: any = {
      region: 'ES',
      displayMode: 'regions',
      resolution: 'provinces',
      width: '100%',
      height: chartHeight,
      magnifyingGlass: { enable: false },
      keepAspectRatio: true,
      colorAxis: {
        minValue: 0,
        maxValue: 30,
        colors: ['#0d47a1', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#b71c1c']
      },
      backgroundColor: {
        fill: '#f5f5f5',
        stroke: '#dddddd',
        strokeWidth: 1
      },
      datalessRegionColor: '#eeeeee',
      defaultColor: '#f5f5f5',
      tooltip: {
        isHtml: false,
        trigger: isMobile ? 'none' : 'focus',
        textStyle: {
          fontSize: isMobile ? 11 : 14
        }
      }
    };

    console.log('⚙️ Opciones del mapa configuradas');

    const chart = new google.visualization.GeoChart(mapContainer);
    console.log('📈 GeoChart creado');

    // Evento de selección
    google.visualization.events.addListener(chart, 'select', () => {
      const selection = chart.getSelection();
      console.log('🖱️ Mapa clickeado, selección:', selection);

      if (!selection || selection.length === 0) {
        console.log('⚠️ Selección vacía');
        return;
      }

      const sel = selection[0];
      console.log('📋 Datos de selección:', sel);
      
      // La selección devuelve {row: número}
      if (sel.row !== null && sel.row !== undefined) {
        const ccaaCode = data.getValue(sel.row, 0);
        const temperatura = data.getValue(sel.row, 1);
        const ccaaNombre = this.CCAA_NOMBRES[ccaaCode] || ccaaCode;
        
        console.log('🎯 CCAA seleccionada:', ccaaNombre, '(' + ccaaCode + ')', 'Temp:', temperatura);

        // Buscar una provincia capital de esa CCAA para mostrar su tiempo
        const provinciaDeLaCCAA = this.provinciasData.find(pd => 
          this.PROVINCIA_TO_CCAA[pd.provincia] === ccaaCode
        );

        if (provinciaDeLaCCAA) {
          console.log('✅ Emitiendo provincia:', provinciaDeLaCCAA.provincia);
          
          this.zone.run(() => {
            this.selectedProvincia = ccaaNombre;
            this.provinciaSeleccionada.emit(provinciaDeLaCCAA.provincia);
          });
        }
      } else {
        console.warn('⚠️ sel.row es null o undefined');
      }
    });

    console.log('🎨 Dibujando mapa...');
    console.log('📋 Opciones finales:', JSON.stringify(options, null, 2));
    
    try {
      chart.draw(data, options);
      console.log('✅ Mapa dibujado correctamente');
      
      // Verificar si hay errores después de dibujar
      setTimeout(() => {
        console.log('🔍 Verificando estado del mapa después de 1 segundo...');
      }, 1000);
    } catch (error) {
      console.error('❌ Error al dibujar el mapa:', error);
    }
  }

  getProvinciasOrdenadas(): ProvinciaData[] {
    return [...this.provinciasData].sort((a, b) => 
      b.temperaturaMedia - a.temperaturaMedia
    );
  }

  getTemperaturaColor(temp: number): string {
    if (temp < 5) return '#4A90E2';
    if (temp < 15) return '#50C878';
    if (temp < 25) return '#FFD700';
    if (temp < 30) return '#FF6B6B';
    return '#C41E3A';
  }

  seleccionarProvincia(provincia: string) {
    this.selectedProvincia = provincia;
    this.provinciaSeleccionada.emit(provincia);
  }
}
