/**
 * Script de prueba para publicar eventos de prueba al consumer
 * Útil para testing sin necesidad del Core real
 */

require('dotenv').config();
const amqp = require('amqplib');

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'core_events';

// Eventos de ejemplo
const testEvents = {
  // Usuario creado
  usuarioCreado: {
    routingKey: 'usuarios.usuario.creado',
    data: {
      evento: 'usuario_creado',
      idUsuario: 'u123',
      nombre: 'Juan Pérez',
      pais: 'AR',
      fechaRegistro: '2025-08-20'
    }
  },

  // Sesión iniciada
  sesionIniciada: {
    routingKey: 'usuarios.sesion.iniciada',
    data: {
      evento: 'sesion_iniciada',
      idUsuario: 'u123',
      timestamp: new Date().toISOString()
    }
  },

  // Sesión finalizada
  sesionFinalizada: {
    routingKey: 'usuarios.sesion.finalizada',
    data: {
      evento: 'sesion_finalizada',
      idUsuario: 'u123',
      timestamp: new Date().toISOString()
    }
  },

  // Reseña creada
  resenaCreada: {
    routingKey: 'resenas.resena.creada',
    data: {
      event: 'resena_creada',
      id: 101,
      movie_id: 25,
      user_id: 'u123',
      title: 'Una obra maestra del suspenso',
      body: 'La película mantiene la tensión de principio a fin. Excelente dirección y actuaciones.',
      rating: 4,
      has_spoilers: false,
      tags: ['suspenso', 'thriller'],
      created_at: new Date().toISOString()
    }
  },

  // Reseña actualizada
  resenaActualizada: {
    routingKey: 'resenas.resena.actualizada',
    data: {
      event: 'resena_actualizada',
      id: 101,
      title: 'Actualizado: Una obra maestra',
      body: 'Texto actualizado con más detalles sobre la película.',
      rating: 5,
      has_spoilers: true,
      tags: ['suspenso', 'thriller', 'cine-noir']
    }
  },

  // Reseña eliminada
  resenaEliminada: {
    routingKey: 'resenas.resena.eliminada',
    data: {
      event: 'resena_eliminada',
      id: 101
    }
  }
};

/**
 * Publicar un evento de prueba
 */
async function publishTestEvent(eventName) {
  let connection = null;
  let channel = null;

  try {
    console.log('🔌 Conectando a RabbitMQ...');
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();

    // Asegurar que el exchange existe
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    const event = testEvents[eventName];
    if (!event) {
      console.error(`❌ Evento no encontrado: ${eventName}`);
      console.log('Eventos disponibles:', Object.keys(testEvents).join(', '));
      return;
    }

    const message = JSON.stringify(event.data);
    
    channel.publish(
      EXCHANGE_NAME,
      event.routingKey,
      Buffer.from(message),
      { persistent: true }
    );

    console.log('✅ Evento publicado exitosamente:');
    console.log('   Exchange:', EXCHANGE_NAME);
    console.log('   Routing Key:', event.routingKey);
    console.log('   Payload:', message);

  } catch (error) {
    console.error('❌ Error al publicar evento:', error.message);
  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('👋 Conexión cerrada');
  }
}

/**
 * Publicar todos los eventos en secuencia
 */
async function publishAllEvents() {
  console.log('📦 Publicando todos los eventos de prueba...\n');
  
  for (const eventName of Object.keys(testEvents)) {
    await publishTestEvent(eventName);
    console.log('⏱️  Esperando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('✅ Todos los eventos publicados');
}

/**
 * Publicar flujo de usuario completo
 */
async function publishUserFlow() {
  console.log('👤 Publicando flujo completo de usuario...\n');
  
  await publishTestEvent('usuarioCreado');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await publishTestEvent('sesionIniciada');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await publishTestEvent('sesionFinalizada');
  
  console.log('✅ Flujo de usuario completado');
}

/**
 * Publicar flujo de reseña completo
 */
async function publishReviewFlow() {
  console.log('📝 Publicando flujo completo de reseña...\n');
  
  await publishTestEvent('resenaCreada');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await publishTestEvent('resenaActualizada');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await publishTestEvent('resenaEliminada');
  
  console.log('✅ Flujo de reseña completado');
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

console.log('🧪 Test Publisher - Consumer Service\n');

if (!command) {
  console.log('Uso: node testPublisher.js <comando>');
  console.log('\nComandos disponibles:');
  console.log('  all           - Publicar todos los eventos');
  console.log('  user          - Publicar flujo de usuario (crear, login, logout)');
  console.log('  review        - Publicar flujo de reseña (crear, actualizar, eliminar)');
  console.log('  <eventName>   - Publicar evento específico');
  console.log('\nEventos disponibles:');
  Object.keys(testEvents).forEach(name => {
    console.log(`  - ${name}`);
  });
  process.exit(0);
}

// Ejecutar comando
(async () => {
  try {
    switch (command) {
      case 'all':
        await publishAllEvents();
        break;
      case 'user':
        await publishUserFlow();
        break;
      case 'review':
        await publishReviewFlow();
        break;
      default:
        await publishTestEvent(command);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
