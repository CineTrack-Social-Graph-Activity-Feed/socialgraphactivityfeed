const rabbitConnection = require('../config/rabbit');
const userHandler = require('../handlers/userHandler');
const reviewHandler = require('../handlers/reviewHandler');
const logger = require('../utils/logger');

/**
 * Consumer principal para eventos del Core
 */
class CoreConsumer {
  constructor() {
    this.isConsuming = false;
    this.messageCount = 0;
  }

  /**
   * Iniciar consumo de mensajes
   */
  async start() {
    try {
      // Conectar a RabbitMQ
      await rabbitConnection.connect();

      const exchangeName = process.env.EXCHANGE_NAME || 'core_events';
      const queueName = process.env.QUEUE_NAME || 'social_graph_queue';
      const routingKeysStr = process.env.ROUTING_KEYS || 'usuarios.#,resenas.#';
      const routingKeys = routingKeysStr.split(',').map(k => k.trim());

      // Configurar exchange, queue y bindings
      await rabbitConnection.setupQueueAndBindings(exchangeName, queueName, routingKeys);

      // Obtener canal
      const channel = rabbitConnection.getChannel();

      // Configurar prefetch (procesar 1 mensaje a la vez)
      await channel.prefetch(1);

      logger.info('CoreConsumer', `Esperando mensajes en la cola: ${queueName}`);
      logger.info('CoreConsumer', 'Routing keys:', routingKeys);

      // Iniciar consumo
      await channel.consume(queueName, async (msg) => {
        if (msg !== null) {
          await this.handleMessage(msg, channel);
        }
      }, { noAck: false });

      this.isConsuming = true;
      logger.success('CoreConsumer', '🚀 Consumer iniciado y listo para procesar eventos');

    } catch (error) {
      logger.error('CoreConsumer', `Error al iniciar consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesar mensaje recibido
   */
  async handleMessage(msg, channel) {
    const routingKey = msg.fields.routingKey;
    const messageContent = msg.content.toString();

    try {
      // Incrementar contador
      this.messageCount++;

      // Parsear contenido
      const eventData = JSON.parse(messageContent);
      
      logger.event(routingKey, `Mensaje recibido (#${this.messageCount})`, {
        routingKey,
        eventType: eventData.evento || eventData.event,
        data: eventData
      });

      // Enrutar a handler correspondiente
      await this.routeEvent(routingKey, eventData);

      // Confirmar procesamiento (ACK)
      channel.ack(msg);
      logger.success('CoreConsumer', `Mensaje procesado y confirmado (#${this.messageCount})`);

    } catch (error) {
      logger.error('CoreConsumer', `Error al procesar mensaje: ${error.message}`, {
        routingKey,
        message: messageContent,
        error: error.stack
      });

      // Rechazar mensaje y reencolar (NACK)
      // Para evitar loops infinitos, se puede configurar un límite de reintentos
      channel.nack(msg, false, false); // false = no reencolar
      logger.warn('CoreConsumer', 'Mensaje rechazado (no reencolado)');
    }
  }

  /**
   * Enrutar evento al handler correspondiente
   */
  async routeEvent(routingKey, eventData) {
    // Eventos de usuarios
    if (routingKey.startsWith('usuarios.')) {
      return await userHandler.processEvent(routingKey, eventData);
    }
    
    // Eventos de reseñas
    if (routingKey.startsWith('resenas.')) {
      return await reviewHandler.processEvent(routingKey, eventData);
    }

    logger.warn('CoreConsumer', `Routing key no soportada: ${routingKey}`);
  }

  /**
   * Detener consumer
   */
  async stop() {
    try {
      await rabbitConnection.close();
      this.isConsuming = false;
      logger.info('CoreConsumer', 'Consumer detenido correctamente');
    } catch (error) {
      logger.error('CoreConsumer', `Error al detener consumer: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      isConsuming: this.isConsuming,
      messagesProcessed: this.messageCount,
      rabbitConnected: rabbitConnection.isConnected()
    };
  }
}

module.exports = new CoreConsumer();
