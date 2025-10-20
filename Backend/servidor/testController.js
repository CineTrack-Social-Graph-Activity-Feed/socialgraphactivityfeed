/**
 * 🧪 Script de Prueba del Publication Controller
 * 
 * Prueba todos los endpoints del controlador de publicaciones
 * para verificar que funciona correctamente con el modelo unificado
 */

const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper para logs
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) log(`   ${details}`, 'yellow');
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// IDs de prueba (debes reemplazarlos con IDs reales de tu BD)
let TEST_USER_ID = null;
let TEST_PUBLICATION_ID = null;
let TEST_MOVIE_ID = '550'; // Fight Club

/**
 * Test 1: Crear publicación local (desde servidor)
 */
async function testCreatePublication() {
  log('\n📝 Test 1: Crear publicación local', 'blue');
  
  try {
    // Primero, obtener un usuario válido
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    if (!usersResponse.data.users || usersResponse.data.users.length === 0) {
      logTest('Crear publicación', false, 'No hay usuarios en la BD para probar');
      return;
    }
    
    TEST_USER_ID = usersResponse.data.users[0]._id;
    log(`   Usuario de prueba: ${TEST_USER_ID}`, 'yellow');
    
    const newPublication = {
      author_id: TEST_USER_ID,
      type: 'review',
      target_id: TEST_MOVIE_ID,
      content: 'Esta es una review de prueba desde el servidor',
      title: 'Review de Prueba',
      rating: 4,
      has_spoilers: false,
      tags: ['test', 'drama']
    };
    
    const response = await axios.post(`${BASE_URL}/publication`, newPublication);
    
    if (response.status === 201 && response.data.publication) {
      TEST_PUBLICATION_ID = response.data.publication.id;
      logTest('Crear publicación', true, `ID: ${TEST_PUBLICATION_ID}`);
      
      // Verificar campos del modelo unificado
      const pub = response.data.publication;
      const hasAllFields = pub.title && pub.content && pub.rating && pub.has_spoilers !== undefined;
      logTest('Campos del modelo unificado', hasAllFields, 
        hasAllFields ? 'Todos los campos presentes' : 'Faltan campos');
    } else {
      logTest('Crear publicación', false, 'Respuesta inesperada');
    }
    
  } catch (error) {
    logTest('Crear publicación', false, error.response?.data?.error || error.message);
  }
}

/**
 * Test 2: Obtener publicación por ID
 */
async function testGetPublication() {
  log('\n🔍 Test 2: Obtener publicación por ID', 'blue');
  
  if (!TEST_PUBLICATION_ID) {
    logTest('Obtener publicación', false, 'No hay ID de prueba disponible');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/publication/${TEST_PUBLICATION_ID}`);
    
    if (response.status === 200 && response.data.publication) {
      const pub = response.data.publication;
      logTest('Obtener publicación', true, `Título: ${pub.title || 'N/A'}`);
      
      // Verificar que tiene author
      logTest('Información de autor', !!pub.author, 
        pub.author ? `Autor: ${pub.author.username}` : 'Sin información de autor');
      
      // Verificar campos unificados
      logTest('Campos unificados', pub.movie_id !== undefined, 
        `movie_id: ${pub.movie_id || pub.target_id}`);
    } else {
      logTest('Obtener publicación', false, 'Respuesta inesperada');
    }
    
  } catch (error) {
    logTest('Obtener publicación', false, error.response?.data?.error || error.message);
  }
}

/**
 * Test 3: Obtener publicaciones de un usuario
 */
async function testGetUserPublications() {
  log('\n👤 Test 3: Obtener publicaciones de usuario', 'blue');
  
  if (!TEST_USER_ID) {
    logTest('Publicaciones de usuario', false, 'No hay user_id de prueba');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/publication/user/${TEST_USER_ID}`);
    
    if (response.status === 200) {
      const pubs = response.data.publications;
      logTest('Publicaciones de usuario', true, 
        `Encontradas: ${pubs.length} publicaciones`);
      
      // Verificar paginación
      logTest('Paginación', !!response.data.pagination, 
        response.data.pagination ? 
          `Total: ${response.data.pagination.total_items}` : 'Sin paginación');
      
      // Verificar si hay publicaciones del Core
      const fromCore = pubs.filter(p => p.review_id !== null && p.review_id !== undefined);
      if (fromCore.length > 0) {
        log(`   📦 Encontradas ${fromCore.length} publicaciones del Core`, 'magenta');
      }
    } else {
      logTest('Publicaciones de usuario', false, 'Respuesta inesperada');
    }
    
  } catch (error) {
    logTest('Publicaciones de usuario', false, error.response?.data?.error || error.message);
  }
}

/**
 * Test 4: Obtener publicaciones de una película
 */
async function testGetMoviePublications() {
  log('\n🎬 Test 4: Obtener publicaciones de película', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/publication/movie/${TEST_MOVIE_ID}`);
    
    if (response.status === 200) {
      const pubs = response.data.publications;
      logTest('Publicaciones de película', true, 
        `Encontradas: ${pubs.length} publicaciones para película ${TEST_MOVIE_ID}`);
      
      // Verificar mezcla de fuentes (servidor + Core)
      const fromServer = pubs.filter(p => p.target_id && !p.review_id);
      const fromCore = pubs.filter(p => p.review_id !== null && p.review_id !== undefined);
      
      log(`   📊 Servidor: ${fromServer.length} | Core: ${fromCore.length}`, 'yellow');
      
      // Mostrar ejemplo si hay datos
      if (pubs.length > 0) {
        const example = pubs[0];
        log(`   Ejemplo:`, 'yellow');
        log(`     - Título: ${example.title || 'N/A'}`, 'yellow');
        log(`     - Rating: ${example.rating || 'N/A'}`, 'yellow');
        log(`     - Autor: ${example.author?.username || example.author?.user_id || 'N/A'}`, 'yellow');
      }
    } else {
      logTest('Publicaciones de película', false, 'Respuesta inesperada');
    }
    
  } catch (error) {
    logTest('Publicaciones de película', false, error.response?.data?.error || error.message);
  }
}

/**
 * Test 5: Filtrar por tipo
 */
async function testFilterByType() {
  log('\n🔎 Test 5: Filtrar publicaciones por tipo', 'blue');
  
  if (!TEST_USER_ID) {
    logTest('Filtrar por tipo', false, 'No hay user_id de prueba');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/publication/user/${TEST_USER_ID}?type=review`);
    
    if (response.status === 200) {
      const pubs = response.data.publications;
      const allReviews = pubs.every(p => p.type === 'review');
      
      logTest('Filtrar por tipo', allReviews, 
        allReviews ? 
          `Todas son reviews (${pubs.length})` : 
          'Hay publicaciones de otro tipo');
    } else {
      logTest('Filtrar por tipo', false, 'Respuesta inesperada');
    }
    
  } catch (error) {
    logTest('Filtrar por tipo', false, error.response?.data?.error || error.message);
  }
}

/**
 * Test 6: Verificar compatibilidad con publicaciones del Core
 */
async function testCorePublications() {
  log('\n📦 Test 6: Verificar publicaciones del Core', 'blue');
  
  try {
    // Buscar publicaciones que tengan review_id (del Core)
    const response = await axios.get(`${BASE_URL}/publication/user/${TEST_USER_ID}`);
    
    if (response.status === 200) {
      const pubs = response.data.publications;
      const corePublications = pubs.filter(p => p.review_id);
      
      if (corePublications.length > 0) {
        logTest('Publicaciones del Core encontradas', true, 
          `${corePublications.length} reseñas del Core`);
        
        // Verificar estructura
        const firstCore = corePublications[0];
        const hasRequiredFields = firstCore.review_id && firstCore.movie_id && 
                                   firstCore.content && firstCore.rating;
        
        logTest('Estructura de publicación Core', hasRequiredFields,
          hasRequiredFields ? 'Todos los campos requeridos presentes' : 'Faltan campos');
        
        // Verificar que se puede acceder al autor
        logTest('Autor de publicación Core', !!firstCore.author,
          firstCore.author ? `Autor: ${firstCore.author.username || firstCore.author.user_id}` : 'Sin autor');
        
      } else {
        log('   ⚠️  No hay publicaciones del Core todavía', 'yellow');
        log('   Esto es normal si el consumer no ha procesado eventos aún', 'yellow');
      }
    }
    
  } catch (error) {
    logTest('Publicaciones del Core', false, error.response?.data?.error || error.message);
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  log('═══════════════════════════════════════════════', 'magenta');
  log('  🧪 PRUEBAS DEL PUBLICATION CONTROLLER        ', 'magenta');
  log('═══════════════════════════════════════════════', 'magenta');
  
  log(`\n📡 Servidor: ${BASE_URL}`, 'blue');
  
  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    log('✅ Servidor corriendo\n', 'green');
  } catch (error) {
    log('❌ El servidor no está corriendo', 'red');
    log('   Ejecuta: cd Backend/servidor && npm start', 'yellow');
    process.exit(1);
  }
  
  // Ejecutar tests
  await testCreatePublication();
  await testGetPublication();
  await testGetUserPublications();
  await testGetMoviePublications();
  await testFilterByType();
  await testCorePublications();
  
  // Resumen final
  log('\n═══════════════════════════════════════════════', 'magenta');
  log('              📊 RESUMEN FINAL                  ', 'magenta');
  log('═══════════════════════════════════════════════\n', 'magenta');
  
  const total = testResults.passed + testResults.failed;
  const percentage = ((testResults.passed / total) * 100).toFixed(1);
  
  log(`Total de pruebas: ${total}`, 'blue');
  log(`✅ Exitosas: ${testResults.passed}`, 'green');
  log(`❌ Fallidas: ${testResults.failed}`, 'red');
  log(`📊 Porcentaje: ${percentage}%\n`, percentage >= 80 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log('🎉 ¡TODAS LAS PRUEBAS PASARON!', 'green');
    log('✅ El controlador funciona correctamente con el modelo unificado', 'green');
  } else {
    log('⚠️  Algunas pruebas fallaron', 'yellow');
    log('Revisa los detalles arriba para más información', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════\n', 'magenta');
  
  // Cleanup (opcional): eliminar publicación de prueba
  if (TEST_PUBLICATION_ID) {
    try {
      await axios.delete(`${BASE_URL}/publication/${TEST_PUBLICATION_ID}`, {
        data: { user_id: TEST_USER_ID }
      });
      log('🧹 Limpieza: Publicación de prueba eliminada', 'yellow');
    } catch (error) {
      // Ignorar errores de limpieza
    }
  }
}

// Ejecutar
runAllTests().catch(error => {
  log('\n❌ Error fatal:', 'red');
  console.error(error);
  process.exit(1);
});
