import { Component, Input } from '@angular/core';

const paths: Record<string, string> = {
  sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z',
  cloud: 'M6 18a4 4 0 0 1-.6-8A6 6 0 0 1 17 8a5 5 0 1 1 1 10H6Z',
  rain: 'M7 15a4 4 0 0 1-1.6-7A6 6 0 0 1 17 6a4 4 0 0 1 1 8M8 17l-1 3m6-3-1 3m6-3-1 3',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 3 3-3M9 19l3-3 3 3',
  storm: 'M6 15a4 4 0 0 1-.6-8A6 6 0 0 1 17 5a4 4 0 0 1 1 8M13 11l-4 6h5l-3 5',
  fog: 'M4 12h16M2 16h18M5 20h15M6 8a4 4 0 0 1 7-3 4 4 0 0 1 5 3',
  wind: 'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow: 'm9 5 7 7-7 7', back: 'm15 5-7 7 7 7', close: 'm6 6 12 12M6 18 18 6',
  more: 'M4 6h16M4 12h16M4 18h16',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
  locate: 'M12 2v3m0 14v3M2 12h3m14 0h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  refresh: 'M20 8a8 8 0 1 0 0 8M20 3v5h-5',
  drop: 'M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z',
  sunrise: 'M3 20h18M5 16h14M7 16a5 5 0 0 1 10 0M12 2v5m-8 3 2 2m14-2-2 2M9 5l3-3 3 3',
  sunset: 'M3 20h18M5 16h14M7 16a5 5 0 0 1 10 0M12 2v5M4 10l2 2m14-2-2 2M9 4l3 3 3-3',
  chart: 'M4 3v17h17M8 15l4-6 4 3 5-8',
  compare: 'M4 4h6v16H4V4Zm10 0h6v16h-6V4Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  info: 'M12 11v6m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  trophy: 'M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v7m-4 1h8',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  offline: 'm3 3 18 18M2 8a17 17 0 0 1 3-2m4-1a17 17 0 0 1 13 3M5 12a11 11 0 0 1 4-2m5 0a11 11 0 0 1 5 2M8 16a6 6 0 0 1 5-1m-1 5h.01',
  check: 'm5 12 4 4L19 6',
};

@Component({
  selector: 'app-mobile-icon', standalone: true,
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path [attr.d]="path" /></svg>',
  styles: [':host { display:inline-flex; width:1.4em; height:1.4em; flex-shrink:0; vertical-align:middle; } svg { width:100%; height:100%; }']
})
export class MobileIconComponent {
  @Input() name = 'cloud';
  get path(): string { return paths[this.name] || paths['cloud']; }
}
