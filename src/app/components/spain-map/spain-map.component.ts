import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter } from '@angular/core';
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

  // Mapa de nombres de provincias para Google Charts
  private readonly PROVINCIA_MAPPING: { [key: string]: string } = {
    'A Coruña': 'ES-C',
    'Álava': 'ES-VI',
    'Albacete': 'ES-AB',
    'Alicante': 'ES-A',
    'Almería': 'ES-AL',
    'Asturias': 'ES-O',
    'Ávila': 'ES-AV',
    'Badajoz': 'ES-BA',
    'Barcelona': 'ES-B',
    'Burgos': 'ES-BU',
    'Cáceres': 'ES-CC',
    'Cádiz': 'ES-CA',
    'Cantabria': 'ES-S',
    'Castellón': 'ES-CS',
    'Ciudad Real': 'ES-CR',
    'Córdoba': 'ES-CO',
    'Cuenca': 'ES-CU',
    'Gerona': 'ES-GI',
    'Granada': 'ES-GR',
    'Guadalajara': 'ES-GU',
    'Guipúzcoa': 'ES-SS',
    'Huelva': 'ES-H',
    'Huesca': 'ES-HU',
    'Islas Baleares': 'ES-PM',
    'Jaén': 'ES-J',
    'La Rioja': 'ES-LO',
    'Las Palmas': 'ES-GC',
    'León': 'ES-LE',
    'Lérida': 'ES-L',
    'Lugo': 'ES-LU',
    'Madrid': 'ES-M',
    'Málaga': 'ES-MA',
    'Murcia': 'ES-MU',
    'Navarra': 'ES-NA',
    'Orense': 'ES-OR',
    'Palencia': 'ES-P',
    'Pontevedra': 'ES-PO',
    'Salamanca': 'ES-SA',
    'Santa Cruz de Tenerife': 'ES-TF',
    'Segovia': 'ES-SG',
    'Sevilla': 'ES-SE',
    'Soria': 'ES-SO',
    'Tarragona': 'ES-T',
    'Teruel': 'ES-TE',
    'Toledo': 'ES-TO',
    'Valencia': 'ES-V',
    'Valladolid': 'ES-VA',
    'Vizcaya': 'ES-BI',
    'Zamora': 'ES-ZA',
    'Zaragoza': 'ES-Z'
  };

  constructor(private http: HttpClient) {}

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
      google.charts.load('current', {
        'packages': ['geochart'],
        'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
      });
      google.charts.setOnLoadCallback(() => {
        this.chartsLoaded = true;
        if (this.provinciasData.length > 0) {
          this.drawMap();
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
      this.isLoading = false;

      if (this.chartsLoaded) {
        // Esperar a que Angular actualice el DOM para que el contenedor exista
        setTimeout(() => {
          this.drawMap();
        }, 0);
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
    if (!this.provinciasData || this.provinciasData.length === 0) return;

    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Provincia');
    data.addColumn('number', 'Temperatura');
    data.addColumn({type: 'string', role: 'tooltip'});

    const rows = this.provinciasData
      .filter(pd => this.PROVINCIA_MAPPING[pd.provincia])
      .map(pd => {
        const tooltip = `${pd.provincia}\n${pd.temperaturaMedia.toFixed(1)}°C`;
        return [
          this.PROVINCIA_MAPPING[pd.provincia],
          pd.temperaturaMedia,
          tooltip
        ];
      });

    data.addRows(rows);

    const options = {
      region: 'ES',
      displayMode: 'regions',
      resolution: 'provinces',
      backgroundColor: '#f5f5f5',
      datalessRegionColor: '#e0e0e0',
      colorAxis: {
        colors: ['#4A90E2', '#50C878', '#FFD700', '#FF6B6B', '#C41E3A'],
        minValue: -5,
        maxValue: 35,
        values: [-5, 5, 15, 25, 35]
      },
      legend: {
        textStyle: {
          fontSize: 12,
          fontName: 'Poppins'
        }
      },
      tooltip: {
        textStyle: {
          fontSize: 14,
          fontName: 'Poppins'
        },
        trigger: 'focus'
      },
      enableRegionInteractivity: true
    };

    const chart = new google.visualization.GeoChart(
      document.getElementById('spain_map')
    );

    // Evento de selección
    google.visualization.events.addListener(chart, 'select', () => {
      const selection = chart.getSelection();
      console.log('Mapa clickeado, selección:', selection);
      
      if (selection.length > 0) {
        const row = selection[0].row;
        // Si row es null, significa que se seleccionó toda la región o algo genérico
        if (row === null) return;

        const provinciaCode = data.getValue(row, 0);
        console.log('Código de provincia seleccionado:', provinciaCode);
        
        // Buscar el nombre de la provincia
        const provinciaEntry = Object.entries(this.PROVINCIA_MAPPING).find(
          ([_, code]) => code === provinciaCode
        );
        
        if (provinciaEntry) {
          const nombreProvincia = provinciaEntry[0];
          console.log('Provincia encontrada:', nombreProvincia);
          
          // Forzar la detección de cambios
          this.zone.run(() => {
            this.selectedProvincia = nombreProvincia;
            this.provinciaSeleccionada.emit(nombreProvincia);
          });
        } else {
          console.warn('No se encontró mapping para el código:', provinciaCode);
        }
      }
    });

    chart.draw(data, options);
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
