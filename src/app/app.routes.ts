import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AcercaDeComponent } from './components/acerca-de/acerca-de.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'acerca-de', component: AcercaDeComponent }
];
