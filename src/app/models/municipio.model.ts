export interface Municipio {
  id: string;
  nombre: string;
  capital?: string; // País o capital (para compatibilidad)
  provincia?: string; // Región, provincia o estado
  ccaa?: string; // País o Comunidad Autónoma
  longitud_dec?: string;
  latitud_dec?: string;
  altitud?: string;
  url?: string;
  id_old?: string;
  num_hab?: string;
  poblacion?: number; // Para ordenamiento por población
  zona_comarcal?: string;
  destacada?: string;
  latitud?: string;
  longitud?: string;
  // Nuevos campos para soporte global
  pais?: string; // Nombre del país explícito
  country_code?: string; // Código ISO del país (ES, FR, US, etc.)
}

export interface MunicipioResponse {
  estado: number;
  descripcion: string;
  datos: string;
  metadatos: string;
}
