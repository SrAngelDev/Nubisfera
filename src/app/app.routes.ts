import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AcercaDeComponent } from './components/acerca-de/acerca-de.component';

/**
 * Rutas de la aplicación con lazy loading para componentes pesados
 * Optimiza el tiempo de carga inicial dividiendo el bundle
 */
export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent,
    title: 'Nubisfera - Predicción del Tiempo' 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/weather-dashboard/weather-dashboard.component')
      .then(m => m.WeatherDashboardComponent),
    title: 'Dashboard Meteorológico - Nubisfera'
  },
  { 
    path: 'comparar', 
    loadComponent: () => import('./components/city-comparison/city-comparison.component')
      .then(m => m.CityComparisonComponent),
    title: 'Comparación de Ciudades - Nubisfera'
  },
  { 
    path: 'timeline', 
    loadComponent: () => import('./components/weather-timeline/weather-timeline.component')
      .then(m => m.WeatherTimelineComponent),
    title: 'Timeline Interactivo - Nubisfera'
  },
  { 
    path: 'logros', 
    loadComponent: () => import('./components/achievements-panel/achievements-panel.component')
      .then(m => m.AchievementsPanelComponent),
    title: 'Mis Logros - Nubisfera'
  },
  { 
    path: 'acerca-de', 
    component: AcercaDeComponent,
    title: 'Acerca de - Nubisfera' 
  }
];
