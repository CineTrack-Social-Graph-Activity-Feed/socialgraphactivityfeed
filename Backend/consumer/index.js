require('dotenv').config();
const express = require('express');
const database = require('./config/database');
const coreConsumer = require('./consumers/coreConsumer');
const logger = require('./utils/logger');

/**
 * Servicio Consumer Principal
 */
class ConsumerService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
  }

  /**
   * Configurar Express (solo para health checks)
   */
  setupExpress() {
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const stats = coreConsumer.getStats();
      const health = {
        status: 'ok',
        service: 'consumer-service',
        timestamp: new Date().toISOString(),
        database: database.isConnected() ? 'connected' : 'disconnected',
        rabbitmq: stats.rabbitConnected ? 'connected' : 'disconnected',
        consumer: stats.isConsuming ? 'consuming' : 'stopped',
        messagesProcessed: stats.messagesProcessed,
        uptime: process.uptime()
      };

      const statusCode = (health.database === 'connected' && health.rabbitmq === 'connected') ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Consumer Service - Social Graph & Activity Feed',
        version: '1.0.0',
        description: 'Servicio de mensajería para consumir eventos del Core',
        endpoints: {
          health: '/health'
        }
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint no encontrado' });
    });
  }

  /**
   * Iniciar servidor HTTP
   */
  startHttpServer() {
    this.app.listen(this.port, () => {
      logger.success('HTTP Server', `Servidor HTTP escuchando en puerto ${this.port}`);
      logger.info('HTTP Server', `Health check disponible en: http://localhost:${this.port}/health`);
    });
  }

  /**
   * Iniciar servicio completo
   */
  async start() {
    try {
      logger.info('ConsumerService', '🚀 Iniciando Consumer Service...');
      
      // Conectar a MongoDB
      await database.connect();

      // Configurar Express
      this.setupExpress();

      // Iniciar servidor HTTP
      this.startHttpServer();

      // Iniciar consumer de RabbitMQ
      await coreConsumer.start();

      logger.success('ConsumerService', '✅ Consumer Service iniciado correctamente');
      logger.info('ConsumerService', 'Esperando eventos del Core...');

    } catch (error) {
      logger.error('ConsumerService', `❌ Error al iniciar el servicio: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Detener servicio
   */
  async stop() {
    try {
      logger.info('ConsumerService', 'Deteniendo servicio...');
      
      await coreConsumer.stop();
      await database.disconnect();
      
      logger.success('ConsumerService', 'Servicio detenido correctamente');
      process.exit(0);
    } catch (error) {
      logger.error('ConsumerService', `Error al detener servicio: ${error.message}`);
      process.exit(1);
    }
  }
}

// Crear instancia del servicio
const service = new ConsumerService();

// Manejar señales de terminación
process.on('SIGINT', () => {
  logger.info('ConsumerService', 'Recibida señal SIGINT...');
  service.stop();
});

process.on('SIGTERM', () => {
  logger.info('ConsumerService', 'Recibida señal SIGTERM...');
  service.stop();
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('ConsumerService', `Error no capturado: ${error.message}`);
  console.error(error.stack);
  service.stop();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('ConsumerService', 'Promesa rechazada no manejada:', reason);
  service.stop();
});

// Iniciar servicio
service.start();
