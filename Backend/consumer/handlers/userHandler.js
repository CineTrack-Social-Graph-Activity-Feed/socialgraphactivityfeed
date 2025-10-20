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
        nombre: user.nombre,
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
   * Procesar evento de sesión iniciada
   */
  async handleSessionStarted(eventData) {
    try {
      // Extraer ID para logging (maneja estructura anidada)
      const actualData = eventData.data || eventData;
      const userId = actualData.idUsuario || eventData.idUsuario;
      
      logger.info('UserHandler', `Procesando inicio de sesión: ${userId}`);
      logger.info('UserHandler', 'Datos del evento:', eventData);

      const user = await User.updateLastLogin(eventData);

      logger.success('UserHandler', `Sesión iniciada registrada para: ${user.user_id}`);
      return user;
    } catch (error) {
      logger.error('UserHandler', `Error al registrar inicio de sesión: ${error.message}`, {
        eventData,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Procesar evento de sesión finalizada
   */
  async handleSessionEnded(eventData) {
    try {
      // Extraer ID para logging (maneja estructura anidada)
      const actualData = eventData.data || eventData;
      const userId = actualData.idUsuario || eventData.idUsuario;
      
      logger.info('UserHandler', `Procesando cierre de sesión: ${userId}`);

      const user = await User.updateLastLogout(eventData);

      if (!user) {
        logger.warn('UserHandler', `Usuario no encontrado para sesión finalizada: ${userId}`);
        return null;
      }

      logger.success('UserHandler', `Sesión finalizada registrada para: ${user.user_id}`);
      return user;
    } catch (error) {
      logger.error('UserHandler', `Error al registrar cierre de sesión: ${error.message}`, {
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
      
      case 'usuarios.sesion.iniciada':
        return await this.handleSessionStarted(eventData);
      
      case 'usuarios.sesion.finalizada':
        return await this.handleSessionEnded(eventData);
      
      default:
        logger.warn('UserHandler', `Routing key no reconocida: ${routingKey}`);
        return null;
    }
  }
}

module.exports = new UserHandler();
