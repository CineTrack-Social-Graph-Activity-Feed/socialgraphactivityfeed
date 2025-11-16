const Movie = require('../models/Movie');
const Publication = require('../models/Publication');
const logger = require('../utils/logger');

/**
 * Handler para eventos de películas del Core
 */
class MovieHandler {
    /** Procesa peliculas.pelicula.creada */
    async handleMovieCreated(eventData) {
        try {
            // Log amigable mostrando ID si estuviera disponible
            const id = (eventData?.data?.data?.id) || (eventData?.data?.id) || eventData?.id;
            logger.info('MovieHandler', `Procesando película creada${id ? `: ${id}` : ''}`);

            const movie = await Movie.upsertFromEvent(eventData);

            logger.success('MovieHandler', `Película actualizada/creada`, {
                movie_id: movie.movie_id,
                titulo: movie.titulo
            });
            return movie;
        } catch (error) {
            logger.error('MovieHandler', `Error al procesar película creada: ${error.message}`, {
                eventData,
                error: error.stack
            });
            throw error;
        }
    }

    /** Procesa peliculas.pelicula.actualizada (upsert) */
    async handleMovieUpdated(eventData) {
        try {
            const id = (eventData?.data?.data?.id) || (eventData?.data?.id) || eventData?.id;
            logger.info('MovieHandler', `Procesando película actualizada${id ? `: ${id}` : ''}`);
            // Obtener estado previo para detectar reactivaciones
            const previous = id ? await Movie.getByMovieId(Number(id)) : null;
            const movie = await Movie.upsertFromEvent(eventData);

            let restored = null;
            // Si antes estaba inactiva y ahora activa => restaurar publicaciones soft-deleted
            if (previous && previous.activa === false && movie.activa === true) {
                try {
                    const Publication = require('../models/Publication');
                    const r = await Publication.restoreByMovieId(movie.movie_id);
                    restored = { restoredCount: r.modifiedCount ?? r.nModified };
                } catch (e) {
                    logger.warn('MovieHandler', 'Error al restaurar publicaciones en reactivación', { error: e.message });
                }
            }

            logger.success('MovieHandler', 'Película actualizada', {
                movie_id: movie.movie_id,
                titulo: movie.titulo,
                activa: movie.activa,
                restored
            });
            return movie;
        } catch (error) {
            logger.error('MovieHandler', `Error al actualizar película: ${error.message}`, {
                eventData,
                error: error.stack
            });
            throw error;
        }
    }

    /** Procesa peliculas.pelicula.borrada (soft delete => activa:false) */
    async handleMovieDeleted(eventData) {
        try {
            const id = (eventData?.data?.data?.id) || (eventData?.data?.id) || eventData?.id;
            logger.info('MovieHandler', `Procesando película borrada${id ? `: ${id}` : ''}`);

            if (id === undefined || id === null) {
                throw new Error('Evento de borrado sin id');
            }
            const movie = await Movie.deleteFromEvent(eventData); // marca activa:false

            // Cascada: soft delete publicaciones asociadas
            let cascadeInfo = undefined;
            try {
                const mode = 'soft';
                const r = await Publication.softDeleteByMovieId(Number(id));
                cascadeInfo = { mode, matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified };
            } catch (e) {
                logger.warn('MovieHandler', 'Error en soft delete de publicaciones en cascada', { error: e.message });
            }

            logger.success('MovieHandler', 'Película desactivada', { movie_id: Number(id), activa: movie?.activa === false, cascade: cascadeInfo });
            return { movie_id: Number(id), activa: false, cascade: cascadeInfo };
        } catch (error) {
            logger.error('MovieHandler', `Error al borrar película: ${error.message}`, {
                eventData,
                error: error.stack
            });
            throw error;
        }
    }

    /** Enrutador por routingKey */
    async processEvent(routingKey, eventData) {
        switch (routingKey) {
            case 'peliculas.pelicula.creada':
                return await this.handleMovieCreated(eventData);
            case 'peliculas.pelicula.actualizada':
                return await this.handleMovieUpdated(eventData);
            case 'peliculas.pelicula.borrada':
                return await this.handleMovieDeleted(eventData);

            default:
                logger.warn('MovieHandler', `Routing key no reconocida: ${routingKey}`);
                return null;
        }
    }
}

module.exports = new MovieHandler();