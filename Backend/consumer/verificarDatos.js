/**
 * 🔍 Script de Verificación de Publicaciones
 * 
 * Este script verifica que las reseñas del Core se están guardando correctamente
 * en MongoDB como publicaciones.
 */

const mongoose = require('mongoose');
const Publication = require('./models/Publication');
const User = require('./models/User');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

async function verificarDatos() {
  try {
    // Conectar a MongoDB
    console.log(`${colors.blue}📦 Conectando a MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/socialgraphactivityfeed');
    console.log(`${colors.green}✅ Conectado a MongoDB${colors.reset}\n`);

    // ==================== VERIFICAR USUARIOS ====================
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}       👥 USUARIOS GUARDADOS          ${colors.reset}`);
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

    const totalUsers = await User.countDocuments();
    const usersWithUserId = await User.countDocuments({ user_id: { $exists: true, $ne: null } });
    const usersWithAuthorId = await User.countDocuments({ author_id: { $exists: true, $ne: null } });

    console.log(`📊 Total de usuarios: ${colors.yellow}${totalUsers}${colors.reset}`);
    console.log(`   └─ Con user_id (Core): ${colors.blue}${usersWithUserId}${colors.reset}`);
    console.log(`   └─ Con author_id (Servidor): ${colors.blue}${usersWithAuthorId}${colors.reset}\n`);

    // Mostrar algunos ejemplos
    const sampleUsers = await User.find()
      .limit(5)
      .select('user_id username nombre email pais created_at')
      .sort({ created_at: -1 });

    if (sampleUsers.length > 0) {
      console.log(`${colors.blue}📋 Últimos 5 usuarios:${colors.reset}`);
      sampleUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${colors.yellow}${user.user_id || user.username}${colors.reset}`);
        console.log(`      Nombre: ${user.nombre || user.username || 'N/A'}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log(`      País: ${user.pais || 'N/A'}`);
        console.log(`      Creado: ${user.created_at?.toISOString() || 'N/A'}\n`);
      });
    }

    // ==================== VERIFICAR PUBLICACIONES ====================
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}    📝 PUBLICACIONES GUARDADAS        ${colors.reset}`);
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

    const totalPublications = await Publication.countDocuments();
    const publicationsFromCore = await Publication.countDocuments({ review_id: { $exists: true, $ne: null } });
    const publicationsFromServer = await Publication.countDocuments({ author_id: { $exists: true, $ne: null } });
    const deletedPublications = await Publication.countDocuments({ isDeleted: true });

    console.log(`📊 Total de publicaciones: ${colors.yellow}${totalPublications}${colors.reset}`);
    console.log(`   ├─ Desde Core (review_id): ${colors.blue}${publicationsFromCore}${colors.reset}`);
    console.log(`   ├─ Desde Servidor (author_id): ${colors.blue}${publicationsFromServer}${colors.reset}`);
    console.log(`   └─ Eliminadas (soft delete): ${colors.red}${deletedPublications}${colors.reset}\n`);

    // Estadísticas por tipo
    const byType = await Publication.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    if (byType.length > 0) {
      console.log(`${colors.blue}📊 Por tipo de publicación:${colors.reset}`);
      byType.forEach(item => {
        console.log(`   └─ ${item._id}: ${colors.yellow}${item.count}${colors.reset}`);
      });
      console.log('');
    }

    // Mostrar ejemplos de publicaciones del Core
    const samplePublications = await Publication.find({ review_id: { $exists: true } })
      .limit(5)
      .select('review_id movie_id user_id title rating has_spoilers tags created_at')
      .sort({ created_at: -1 });

    if (samplePublications.length > 0) {
      console.log(`${colors.blue}📋 Últimas 5 reseñas del Core:${colors.reset}\n`);
      samplePublications.forEach((pub, i) => {
        console.log(`   ${i + 1}. Review #${colors.yellow}${pub.review_id}${colors.reset}`);
        console.log(`      Usuario: ${pub.user_id}`);
        console.log(`      Película: ${pub.movie_id}`);
        console.log(`      Título: "${pub.title}"`);
        console.log(`      Rating: ${'⭐'.repeat(pub.rating)} (${pub.rating}/5)`);
        console.log(`      Spoilers: ${pub.has_spoilers ? '⚠️  Sí' : '✅ No'}`);
        if (pub.tags && pub.tags.length > 0) {
          console.log(`      Tags: ${pub.tags.join(', ')}`);
        }
        console.log(`      Creado: ${pub.created_at?.toISOString() || 'N/A'}\n`);
      });
    }

    // ==================== VERIFICAR INTEGRIDAD ====================
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}      🔍 VERIFICACIÓN DE DATOS        ${colors.reset}`);
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

    // Publicaciones sin user_id
    const pubsWithoutUserId = await Publication.countDocuments({
      review_id: { $exists: true },
      $or: [
        { user_id: null },
        { user_id: { $exists: false } },
        { user_id: '' }
      ]
    });

    // Publicaciones sin movie_id
    const pubsWithoutMovieId = await Publication.countDocuments({
      review_id: { $exists: true },
      $or: [
        { movie_id: null },
        { movie_id: { $exists: false } }
      ]
    });

    // Publicaciones sin título
    const pubsWithoutTitle = await Publication.countDocuments({
      review_id: { $exists: true },
      $or: [
        { title: null },
        { title: { $exists: false } },
        { title: '' }
      ]
    });

    // Publicaciones sin body/content
    const pubsWithoutBody = await Publication.countDocuments({
      review_id: { $exists: true },
      $or: [
        { body: null, content: null },
        { body: { $exists: false }, content: { $exists: false } },
        { body: '', content: '' }
      ]
    });

    let hasErrors = false;

    if (pubsWithoutUserId > 0) {
      console.log(`${colors.red}❌ Publicaciones sin user_id: ${pubsWithoutUserId}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Todas las publicaciones tienen user_id${colors.reset}`);
    }

    if (pubsWithoutMovieId > 0) {
      console.log(`${colors.red}❌ Publicaciones sin movie_id: ${pubsWithoutMovieId}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Todas las publicaciones tienen movie_id${colors.reset}`);
    }

    if (pubsWithoutTitle > 0) {
      console.log(`${colors.yellow}⚠️  Publicaciones sin título: ${pubsWithoutTitle}${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Todas las publicaciones tienen título${colors.reset}`);
    }

    if (pubsWithoutBody > 0) {
      console.log(`${colors.red}❌ Publicaciones sin contenido: ${pubsWithoutBody}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Todas las publicaciones tienen contenido${colors.reset}`);
    }

    // ==================== RESUMEN FINAL ====================
    console.log(`\n${colors.magenta}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}         🎯 RESUMEN FINAL             ${colors.reset}`);
    console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

    if (!hasErrors && totalPublications > 0) {
      console.log(`${colors.green}✅ ¡TODO FUNCIONA CORRECTAMENTE!${colors.reset}`);
      console.log(`   └─ ${totalPublications} publicaciones guardadas sin errores\n`);
    } else if (totalPublications === 0) {
      console.log(`${colors.yellow}⚠️  No hay publicaciones guardadas todavía${colors.reset}`);
      console.log(`   └─ El consumer está esperando eventos del Core\n`);
    } else {
      console.log(`${colors.red}⚠️  Se encontraron algunos errores de datos${colors.reset}`);
      console.log(`   └─ Revisa los mensajes anteriores para más detalles\n`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log(`${colors.blue}👋 Desconectado de MongoDB${colors.reset}`);
  }
}

// Ejecutar verificación
verificarDatos();
