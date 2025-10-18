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
      logger.info('UserHandler', `Procesando usuario creado: ${eventData.idUsuario}`);

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
      const userId = eventData.idUsuario;
      logger.info('UserHandler', `Procesando inicio de sesión: ${userId}`);

      const user = await User.updateLastLogin(userId);

      if (!user) {
        logger.warn('UserHandler', `Usuario no encontrado para sesión iniciada: ${userId}`);
        // Crear usuario si no existe
        return await this.handleUserCreated(eventData);
      }

      logger.success('UserHandler', `Sesión iniciada registrada para: ${userId}`);
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
      const userId = eventData.idUsuario;
      logger.info('UserHandler', `Procesando cierre de sesión: ${userId}`);

      const user = await User.updateLastLogout(userId);

      if (!user) {
        logger.warn('UserHandler', `Usuario no encontrado para sesión finalizada: ${userId}`);
        return null;
      }

      logger.success('UserHandler', `Sesión finalizada registrada para: ${userId}`);
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
