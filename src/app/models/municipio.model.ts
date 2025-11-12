export interface Municipio {
  id: string;
  nombre: string;
  capital?: string;
  provincia?: string; // Mantenemos para retrocompatibilidad
  ccaa?: string;
  longitud_dec?: string;
  latitud_dec?: string;
  altitud?: string;
  url?: string;
  id_old?: string;
  num_hab?: string;
  zona_comarcal?: string;
  destacada?: string;
  latitud?: string;
  longitud?: string;
}

export interface MunicipioResponse {
  estado: number;
  descripcion: string;
  datos: string;
  metadatos: string;
}
