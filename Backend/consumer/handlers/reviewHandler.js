const Publication = require('../models/Publication');
const logger = require('../utils/logger');

/**
 * Handler para eventos de reseñas
 */
class ReviewHandler {
  /**
   * Procesar evento de reseña creada
   */
  async handleReviewCreated(eventData) {
    try {
      logger.info('ReviewHandler', `Procesando reseña creada: ${eventData.id}`);

      const publication = await Publication.createFromEvent(eventData);

      logger.success('ReviewHandler', `Reseña creada: ${publication.review_id}`, {
        reviewId: publication.review_id,
        movieId: publication.movie_id,
        userId: publication.user_id,
        title: publication.title,
        rating: publication.rating
      });

      return publication;
    } catch (error) {
      // Si es error de duplicado, intentar actualizar
      if (error.code === 11000) {
        logger.warn('ReviewHandler', `Reseña duplicada, actualizando: ${eventData.id}`);
        return await this.handleReviewUpdated(eventData);
      }

      logger.error('ReviewHandler', `Error al crear reseña: ${error.message}`, {
        eventData,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Procesar evento de reseña actualizada
   */
  async handleReviewUpdated(eventData) {
    try {
      logger.info('ReviewHandler', `Procesando reseña actualizada: ${eventData.id}`);

      const publication = await Publication.updateFromEvent(eventData);

      if (!publication) {
        logger.warn('ReviewHandler', `Reseña no encontrada para actualizar: ${eventData.id}`);
        // Si no existe, crearla
        return await this.handleReviewCreated(eventData);
      }

      logger.success('ReviewHandler', `Reseña actualizada: ${publication.review_id}`, {
        reviewId: publication.review_id,
        title: publication.title,
        rating: publication.rating
      });

      return publication;
    } catch (error) {
      logger.error('ReviewHandler', `Error al actualizar reseña: ${error.message}`, {
        eventData,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Procesar evento de reseña eliminada
   */
  async handleReviewDeleted(eventData) {
    try {
      const reviewId = eventData.id;
      logger.info('ReviewHandler', `Procesando reseña eliminada: ${reviewId}`);

      // Soft delete por defecto (mantener registro histórico)
      const publication = await Publication.markAsDeleted(reviewId);

      if (!publication) {
        logger.warn('ReviewHandler', `Reseña no encontrada para eliminar: ${reviewId}`);
        return null;
      }

      logger.success('ReviewHandler', `Reseña marcada como eliminada: ${reviewId}`);
      
      // Si se desea hacer hard delete, descomentar:
      // const publication = await Publication.deleteFromEvent(reviewId);
      // logger.success('ReviewHandler', `Reseña eliminada permanentemente: ${reviewId}`);

      return publication;
    } catch (error) {
      logger.error('ReviewHandler', `Error al eliminar reseña: ${error.message}`, {
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
      case 'resenas.resena.creada':
        return await this.handleReviewCreated(eventData);
      
      case 'resenas.resena.actualizada':
        return await this.handleReviewUpdated(eventData);
      
      case 'resenas.resena.eliminada':
        return await this.handleReviewDeleted(eventData);
      
      default:
        logger.warn('ReviewHandler', `Routing key no reconocida: ${routingKey}`);
        return null;
    }
  }
}

module.exports = new ReviewHandler();
