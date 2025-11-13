/**
 * Script para generar JSON completo de municipios españoles
 * Consulta la API de Open-Meteo Geocoding exhaustivamente
 * 
 * Uso: node scripts/generar-municipios.js
 * 
 * Genera: public/municipios-espana.json
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const DELAY_MS = 200; // Delay entre peticiones para no saturar API
const BATCH_SIZE = 50; // Peticiones simultáneas por lote

// Mapa para eliminar duplicados
const municipiosMap = new Map();
let totalPeticiones = 0;
let peticionesExitosas = 0;

/**
 * Búsqueda en la API de geocoding
 */
async function buscarMunicipios(query) {
  const url = `${BASE_URL}?name=${encodeURIComponent(query)}&count=100&language=es&format=json`;
  
  try {
    totalPeticiones++;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`❌ Error ${response.status} para: ${query}`);
      return [];
    }
    
    const data = await response.json();
    peticionesExitosas++;
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }
    
    // Filtrar solo España
    const resultadosEspana = data.results.filter(item => 
      item.country === 'Spain' || 
      item.country === 'España' ||
      item.country_code === 'ES'
    );
    
    return resultadosEspana.map(item => ({
      id: `${item.id}`,
      nombre: item.name,
      provincia: item.admin2 || '',
      ccaa: item.admin1 || '',
      latitud_dec: item.latitude.toString(),
      longitud_dec: item.longitude.toString(),
      poblacion: item.population || 0,
      elevacion: item.elevation || 0
    }));
    
  } catch (error) {
    console.warn(`❌ Error de red para: ${query} - ${error.message}`);
    return [];
  }
}

/**
 * Procesa un lote de búsquedas con delay
 */
async function procesarLote(queries, numLote, totalLotes) {
  console.log(`\n⏳ Procesando lote ${numLote}/${totalLotes} (${queries.length} búsquedas)...`);
  
  const promesas = queries.map(query => buscarMunicipios(query));
  const resultados = await Promise.all(promesas);
  
  // Agregar al mapa (elimina duplicados automáticamente)
  resultados.flat().forEach(municipio => {
    const key = `${municipio.nombre}-${municipio.provincia}`.toLowerCase();
    if (!municipiosMap.has(key)) {
      municipiosMap.set(key, municipio);
    }
  });
  
  console.log(`   ✅ Municipios únicos acumulados: ${municipiosMap.size}`);
  
  // Delay antes del siguiente lote
  if (numLote < totalLotes) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
}

/**
 * Genera todas las consultas a realizar
 */
function generarConsultas() {
  const consultas = [];
  
  console.log('📋 Generando estrategia de búsqueda exhaustiva...\n');
  
  // 1. Alfabeto completo
  const alfabeto = 'abcdefghijklmnopqrstuvwxyzñ'.split('');
  consultas.push(...alfabeto);
  console.log(`✓ Alfabeto: ${alfabeto.length} búsquedas`);
  
  // 2. Combinaciones de 2 letras (solo con vocales para reducir)
  const vocales = 'aeiou'.split('');
  const combinaciones2 = [];
  for (let letra of alfabeto) {
    for (let vocal of vocales) {
      combinaciones2.push(letra + vocal);
      combinaciones2.push(vocal + letra);
    }
  }
  consultas.push(...combinaciones2);
  console.log(`✓ Combinaciones 2 letras: ${combinaciones2.length} búsquedas`);
  
  // 3. Prefijos comunes de municipios españoles
  const prefijos = [
    'san', 'santa', 'santo',
    'el', 'la', 'los', 'las',
    'villa', 'villar', 'villar de', 'villar del',
    'castro', 'castillo',
    'monte', 'montes',
    'pueblo', 'puebla',
    'torre', 'torres',
    'valle', 'valles',
    'vega', 'vegas',
    'prado', 'prados',
    'fuente', 'fuentes',
    'puente', 'puentes',
    'campo', 'campos',
    'aldea', 'aldeas',
    'arroyo', 'arroyos',
    'cerro', 'cerros',
    'sierra', 'sierras',
    'río', 'ríos',
    'peña', 'peñas',
    'puerto', 'puertos',
    'nueva', 'nuevo',
    'real',
    'oliva', 'olivas',
    'pozuelo', 'pozuelos',
    'navas', 'nava',
    'alameda', 'alamo'
  ];
  consultas.push(...prefijos);
  console.log(`✓ Prefijos comunes: ${prefijos.length} búsquedas`);
  
  // 4. Sufijos comunes
  const sufijos = [
    'de la', 'del', 'de los', 'de las',
    'illo', 'illa', 'uelo', 'uela',
    'ejo', 'eja', 'ico', 'ica',
    'ito', 'ita', 'ino', 'ina',
    'az', 'ez', 'iz', 'oz', 'uz'
  ];
  consultas.push(...sufijos);
  console.log(`✓ Sufijos comunes: ${sufijos.length} búsquedas`);
  
  // 5. Capitales y ciudades principales
  const principales = [
    'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza',
    'málaga', 'murcia', 'palma', 'bilbao', 'alicante',
    'córdoba', 'valladolid', 'vigo', 'gijón', 'hospitalet',
    'vitoria', 'coruña', 'granada', 'elche', 'oviedo',
    'badalona', 'cartagena', 'terrassa', 'jerez', 'sabadell',
    'móstoles', 'alcalá', 'pamplona', 'fuenlabrada', 'almería',
    'leganés', 'donostia', 'burgos', 'santander', 'castellón',
    'albacete', 'alcorcón', 'getafe', 'salamanca', 'huelva',
    'badajoz', 'logroño', 'tarragona', 'león', 'cádiz',
    'lleida', 'marbella', 'dos hermanas', 'torrejón', 'parla'
  ];
  consultas.push(...principales);
  console.log(`✓ Principales: ${principales.length} búsquedas`);
  
  // 6. Provincias
  const provincias = [
    'álava', 'albacete', 'alicante', 'almería', 'asturias', 'ávila',
    'badajoz', 'barcelona', 'burgos', 'cáceres', 'cádiz', 'cantabria',
    'castellón', 'ciudad real', 'córdoba', 'coruña', 'cuenca',
    'girona', 'granada', 'guadalajara', 'guipúzcoa', 'huelva', 'huesca',
    'jaén', 'león', 'lleida', 'lugo', 'madrid', 'málaga', 'murcia',
    'navarra', 'ourense', 'palencia', 'las palmas', 'pontevedra',
    'rioja', 'salamanca', 'segovia', 'sevilla', 'soria',
    'tarragona', 'teruel', 'toledo', 'valencia', 'valladolid',
    'vizcaya', 'zamora', 'zaragoza'
  ];
  consultas.push(...provincias);
  console.log(`✓ Provincias: ${provincias.length} búsquedas`);
  
  console.log(`\n📊 TOTAL DE BÚSQUEDAS: ${consultas.length}`);
  return consultas;
}

/**
 * Función principal
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   GENERADOR DE DATASET DE MUNICIPIOS ESPAÑOLES       ║');
  console.log('║   Fuente: Open-Meteo Geocoding API                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  const inicioTotal = Date.now();
  
  // Generar lista de consultas
  const consultas = generarConsultas();
  
  // Dividir en lotes
  const lotes = [];
  for (let i = 0; i < consultas.length; i += BATCH_SIZE) {
    lotes.push(consultas.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`\n🚀 Iniciando búsqueda en ${lotes.length} lotes...`);
  console.log(`   Configuración: ${BATCH_SIZE} peticiones/lote, ${DELAY_MS}ms delay\n`);
  
  // Procesar todos los lotes
  for (let i = 0; i < lotes.length; i++) {
    await procesarLote(lotes[i], i + 1, lotes.length);
  }
  
  // Convertir mapa a array y ordenar
  const municipios = Array.from(municipiosMap.values())
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  // Estadísticas
  const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(1);
  const tasaExito = ((peticionesExitosas / totalPeticiones) * 100).toFixed(1);
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                    ESTADÍSTICAS                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`📊 Municipios únicos encontrados: ${municipios.length}`);
  console.log(`🌐 Peticiones realizadas: ${totalPeticiones}`);
  console.log(`✅ Peticiones exitosas: ${peticionesExitosas} (${tasaExito}%)`);
  console.log(`⏱️  Tiempo total: ${tiempoTotal}s`);
  console.log(`📈 Cobertura estimada: ${((municipios.length / 8131) * 100).toFixed(1)}%`);
  
  // Guardar JSON
  const outputPath = path.join(__dirname, '..', 'public', 'municipios-espana.json');
  const outputDir = path.dirname(outputPath);
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Guardar archivo
  const jsonData = {
    version: '1.0',
    fecha_generacion: new Date().toISOString(),
    total_municipios: municipios.length,
    fuente: 'Open-Meteo Geocoding API',
    municipios: municipios
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
  
  console.log(`\n💾 JSON generado: ${outputPath}`);
  console.log(`📦 Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  
  // Mostrar muestra
  console.log('\n📋 Muestra de municipios (primeros 10):');
  municipios.slice(0, 10).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.nombre} (${m.provincia}) - ${m.ccaa}`);
  });
  
  console.log('\n✅ Proceso completado exitosamente!\n');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
