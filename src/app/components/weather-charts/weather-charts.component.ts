import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherData } from '../../models/weather.model';

declare const google: any;

@Component({
  selector: 'app-weather-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-charts.component.html',
  styleUrls: ['./weather-charts.component.css']
})
export class WeatherChartsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() weatherData: WeatherData | null = null;

  private chartsLoaded = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.loadGoogleCharts();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weatherData'] && this.weatherData && this.chartsLoaded) {
      setTimeout(() => {
        this.drawCharts();
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private loadGoogleCharts() {
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { packages: ['corechart', 'line'] });
      google.charts.setOnLoadCallback(() => {
        this.chartsLoaded = true;
        if (this.weatherData) {
          this.drawCharts();
        }
      });
    } else {
      console.error('Google Charts no está disponible. Asegúrate de incluir el script en index.html');
    }
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartsLoaded && this.weatherData) {
          this.drawCharts();
        }
      });

      const container = document.querySelector('.charts-container');
      if (container) {
        this.resizeObserver.observe(container);
      }
    }
  }

  private drawCharts() {
    if (!this.weatherData) return;

    this.drawTemperatureChart();
    this.drawPrecipitationChart();
    this.drawHumidityChart();
    this.drawWindSpeedChart();
  }

  private drawTemperatureChart() {
    const data = new google.visualization.DataTable();
    data.addColumn('datetime', 'Fecha');
    data.addColumn('number', 'Temperatura (°C)');
    data.addColumn('number', 'Sensación Térmica (°C)');

    const rows = this.weatherData!.hourly.slice(0, 48).map(hour => [
      hour.time,
      hour.temperature,
      hour.apparentTemperature
    ]);
    data.addRows(rows);

    const options = {
      title: 'Temperatura - Próximas 48 Horas',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
        color: '#333'
      },
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Hora',
        format: 'dd/MM HH:mm',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 }
      },
      vAxis: {
        title: 'Temperatura (°C)',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 }
      },
      colors: ['#FF6B6B', '#FFA500'],
      backgroundColor: { fill: 'transparent' },
      chartArea: { width: '85%', height: '70%' },
      lineWidth: 3,
      pointSize: 5,
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      }
    };

    const chart = new google.visualization.LineChart(
      document.getElementById('temperature_chart')
    );
    chart.draw(data, options);
  }

  private drawPrecipitationChart() {
    const data = new google.visualization.DataTable();
    data.addColumn('datetime', 'Fecha');
    data.addColumn('number', 'Precipitación (mm)');
    data.addColumn('number', 'Probabilidad (%)');

    const rows = this.weatherData!.hourly.slice(0, 48).map(hour => [
      hour.time,
      hour.precipitation,
      hour.precipitationProbability
    ]);
    data.addRows(rows);

    const options = {
      title: 'Precipitación - Próximas 48 Horas',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
        color: '#333'
      },
      seriesType: 'bars',
      series: {
        0: { targetAxisIndex: 0, type: 'bars', color: '#4FC3F7' },
        1: { targetAxisIndex: 1, type: 'line', color: '#7B68EE', lineWidth: 2 }
      },
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Hora',
        format: 'dd/MM HH:mm',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 }
      },
      vAxes: {
        0: {
          title: 'Precipitación (mm)',
          gridlines: { color: '#f0f0f0' },
          textStyle: { fontSize: 12 }
        },
        1: {
          title: 'Probabilidad (%)',
          gridlines: { color: 'transparent' },
          textStyle: { fontSize: 12 }
        }
      },
      backgroundColor: { fill: 'transparent' },
      chartArea: { width: '80%', height: '70%' },
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      }
    };

    const chart = new google.visualization.ComboChart(
      document.getElementById('precipitation_chart')
    );
    chart.draw(data, options);
  }

  private drawHumidityChart() {
    const data = new google.visualization.DataTable();
    data.addColumn('datetime', 'Fecha');
    data.addColumn('number', 'Humedad (%)');

    const rows = this.weatherData!.hourly.slice(0, 48).map(hour => [
      hour.time,
      hour.humidity
    ]);
    data.addRows(rows);

    const options = {
      title: 'Humedad - Próximas 48 Horas',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
        color: '#333'
      },
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Hora',
        format: 'dd/MM HH:mm',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 }
      },
      vAxis: {
        title: 'Humedad (%)',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 },
        minValue: 0,
        maxValue: 100
      },
      colors: ['#42A5F5'],
      backgroundColor: { fill: 'transparent' },
      chartArea: { width: '85%', height: '70%' },
      lineWidth: 3,
      pointSize: 5,
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      }
    };

    const chart = new google.visualization.LineChart(
      document.getElementById('humidity_chart')
    );
    chart.draw(data, options);
  }

  private drawWindSpeedChart() {
    const data = new google.visualization.DataTable();
    data.addColumn('datetime', 'Fecha');
    data.addColumn('number', 'Velocidad del Viento (km/h)');

    const rows = this.weatherData!.hourly.slice(0, 48).map(hour => [
      hour.time,
      hour.windSpeed
    ]);
    data.addRows(rows);

    const options = {
      title: 'Velocidad del Viento - Próximas 48 Horas',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
        color: '#333'
      },
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Hora',
        format: 'dd/MM HH:mm',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 }
      },
      vAxis: {
        title: 'Velocidad (km/h)',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 12 },
        minValue: 0
      },
      colors: ['#66BB6A'],
      backgroundColor: { fill: 'transparent' },
      chartArea: { width: '85%', height: '70%' },
      lineWidth: 3,
      pointSize: 5,
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      }
    };

    const chart = new google.visualization.AreaChart(
      document.getElementById('wind_speed_chart')
    );
    chart.draw(data, options);
  }
}
