const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Handler para eventos de usuarios
 */
class UserHandler {
  /**
   * Procesar evento de usuario creado
   */
  async handleUserCreated(eventData) {
    try {
      // Extraer ID para logging (maneja estructura anidada)
      const actualData = eventData.data || eventData;
      const idUsuario = actualData.idUsuario || eventData.idUsuario;
      
      logger.info('UserHandler', `Procesando usuario creado: ${idUsuario}`);
      logger.info('UserHandler', 'Datos completos del evento:', eventData);

      const user = await User.createOrUpdateFromEvent(eventData);

      logger.success('UserHandler', `Usuario creado/actualizado: ${user.user_id}`, {
        userId: user.user_id,
        username: user.username,
        pais: user.pais
      });

      return user;
    } catch (error) {
      logger.error('UserHandler', `Error al crear usuario: ${error.message}`, {
        eventData,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Enrutar evento según el tipo
   */
  async processEvent(routingKey, eventData) {
    switch (routingKey) {
      case 'usuarios.usuario.creado':
        return await this.handleUserCreated(eventData);
      
      default:
        logger.warn('UserHandler', `Routing key no reconocida: ${routingKey}`);
        return null;
    }
  }
}

module.exports = new UserHandler();
