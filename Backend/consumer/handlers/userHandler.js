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
      
      logger.info('UserHandler', `Procesando usuario creado (raw): ${idUsuario}`);
      logger.info('UserHandler', 'Datos completos del evento:', eventData);

      // Normalizar idUsuario: "u135" => 135 (Number)
      const normalizedId = normalizeExternalUserId(idUsuario);
      logger.info('UserHandler', `idUsuario normalizado: ${normalizedId}`);

      // Clonar evento e inyectar el id normalizado manteniendo la estructura
      const normalizedEvent = eventData.data
        ? { ...eventData, data: { ...eventData.data, idUsuario: normalizedId } }
        : { ...eventData, idUsuario: normalizedId };

      const user = await User.createOrUpdateFromEvent(normalizedEvent);

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
   * Procesar evento de sesión iniciada
   */
  async handleSessionStarted(eventData) {
    try {
      const actualData = (eventData.data && eventData.data.data) || eventData.data || eventData;
      const idUsuario = actualData.idUsuario || eventData.idUsuario;
      const idSesion = actualData.idSesion || actualData.sessionId;
      const dispositivo = actualData.dispositivo || actualData.device;
      const fechaInicio = actualData.fechaInicio || actualData.startedAt;

      logger.info('UserHandler', `Procesando sesión iniciada (raw user): ${idUsuario} - sesion: ${idSesion}`);
      logger.info('UserHandler', 'Datos completos del evento:', eventData);

      const userId = normalizeExternalUserId(idUsuario);
      const user = await User.markSessionStarted({
        userId,
        sessionId: idSesion,
        device: dispositivo,
        startedAt: fechaInicio
      });

      logger.success('UserHandler', `Sesión iniciada registrada para user ${user.user_id}`, {
        userId: user.user_id,
        sessionId: idSesion,
        device: dispositivo,
        activeSessions: user.activeSessions
      });
      return user;
    } catch (error) {
      logger.error('UserHandler', `Error al procesar sesión iniciada: ${error.message}`, {
        eventData,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Procesar evento de sesión finalizada
   */
  async handleSessionFinished(eventData) {
    try {
      const actualData = (eventData.data && eventData.data.data) || eventData.data || eventData;
      const idUsuario = actualData.idUsuario || eventData.idUsuario;
      const idSesion = actualData.idSesion || actualData.sessionId;
      const fechaFin = actualData.fechaFin || actualData.endedAt;

      logger.info('UserHandler', `Procesando sesión finalizada (raw user): ${idUsuario} - sesion: ${idSesion}`);
      logger.info('UserHandler', 'Datos completos del evento:', eventData);

      const userId = normalizeExternalUserId(idUsuario);
      const user = await User.markSessionFinished({
        userId,
        sessionId: idSesion,
        endedAt: fechaFin
      });

      logger.success('UserHandler', `Sesión finalizada registrada para user ${user.user_id}`, {
        userId: user.user_id,
        sessionId: idSesion,
        activeSessions: user.activeSessions
      });
      return user;
    } catch (error) {
      logger.error('UserHandler', `Error al procesar sesión finalizada: ${error.message}`, {
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
        return await this.handleSessionFinished(eventData);
      
      default:
        logger.warn('UserHandler', `Routing key no reconocida: ${routingKey}`);
        return null;
    }
  }
}

module.exports = new UserHandler();

// Helpers
function normalizeExternalUserId(value) {
  // Acepta: 135, "135", "u135", "user-135", etc. Extrae dígitos y los convierte a Number
  const s = String(value ?? '').trim();
  const digits = s.replace(/\D+/g, '');
  const n = Number(digits);
  if (!digits || Number.isNaN(n)) {
    throw new Error(`idUsuario inválido: '${value}'`);
  }
  return n;
}
