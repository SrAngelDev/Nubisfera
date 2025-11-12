export interface PrediccionResponse {
  estado: number;
  descripcion: string;
  datos: string;
  metadatos: string;
}

export interface PrediccionDiaria {
  nombre: string;
  provincia: string;
  prediccion: {
    dia: Dia[];
  };
  version: string;
  timestamp?: string;
}

export interface Dia {
  fecha: string;
  estadoCielo: EstadoCielo[];
  temperatura: Temperatura;
  probPrecipitacion: Hora[];
  humedadRelativa?: Humedad;
  viento?: Viento[];
  sensTermica?: SensTermica;
}

export interface Temperatura {
  maxima: number;
  minima: number;
  dato?: Hora[];
}

export interface SensTermica {
  maxima: number;
  minima: number;
  dato?: Hora[];
}

export interface Humedad {
  maxima: number;
  minima: number;
  dato?: Hora[];
}

export interface Hora {
  value: number;
  periodo: string;
}

export interface EstadoCielo {
  value: string;
  periodo: string;
  descripcion: string;
}

export interface Viento {
  direccion: string[];
  velocidad: number[];
  periodo: string;
}