const amqp = require('amqplib');
const logger = require('../utils/logger');

/**
 * Configuración y gestión de conexión a RabbitMQ
 */
class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10;
    this.reconnectInterval = parseInt(process.env.RECONNECT_INTERVAL) || 5000;
    this.isConnecting = false;
  }

  /**
   * Conectar a RabbitMQ
   */
  async connect() {
    if (this.isConnecting) {
      logger.warn('RabbitMQ', 'Ya hay una conexión en progreso...');
      return;
    }

    this.isConnecting = true;

    try {
      const rabbitUrl = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
      
      logger.info('RabbitMQ', 'Intentando conectar...');
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      this.reconnectAttempts = 0;
      this.isConnecting = false;

      logger.success('RabbitMQ', 'Conectado exitosamente al broker');

      // Configurar manejadores de eventos
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ', `Error en la conexión: ${err.message}`);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ', 'Conexión cerrada');
        this.handleDisconnection();
      });

      return this.channel;

    } catch (error) {
      this.isConnecting = false;
      logger.error('RabbitMQ', `Error al conectar: ${error.message}`);
      this.handleDisconnection();
      throw error;
    }
  }

  /**
   * Manejar desconexión y reconexión automática
   */
  async handleDisconnection() {
    this.channel = null;
    this.connection = null;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('RabbitMQ', `Máximo de intentos de reconexión alcanzado (${this.maxReconnectAttempts})`);
      process.exit(1);
    }

    this.reconnectAttempts++;
    logger.info('RabbitMQ', `Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch((err) => {
        logger.error('RabbitMQ', `Fallo en reconexión: ${err.message}`);
      });
    }, this.reconnectInterval);
  }

  /**
   * Obtener el canal actual
   */
  getChannel() {
    if (!this.channel) {
      throw new Error('Canal de RabbitMQ no disponible. Conexión no establecida.');
    }
    return this.channel;
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.connection !== null && this.channel !== null;
  }

  /**
   * Cerrar conexión
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('RabbitMQ', 'Conexión cerrada correctamente');
    } catch (error) {
      logger.error('RabbitMQ', `Error al cerrar conexión: ${error.message}`);
    }
  }

  /**
   * Crear exchange y queue con bindings
   */
  async setupQueueAndBindings(exchangeName, queueName, routingKeys) {
    try {
      const channel = this.getChannel();

      // Declarar exchange tipo topic
      await channel.assertExchange(exchangeName, 'topic', { durable: true });
      logger.info('RabbitMQ', `Exchange '${exchangeName}' declarado`);

      // Declarar queue
      await channel.assertQueue(queueName, { durable: true });
      logger.info('RabbitMQ', `Queue '${queueName}' declarada`);

      // Bindear routing keys
      for (const routingKey of routingKeys) {
        await channel.bindQueue(queueName, exchangeName, routingKey);
        logger.info('RabbitMQ', `Binding: ${routingKey} -> ${queueName}`);
      }

      logger.success('RabbitMQ', 'Queue y bindings configurados correctamente');
    } catch (error) {
      logger.error('RabbitMQ', `Error al configurar queue: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RabbitMQConnection();
