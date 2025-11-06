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

            const movie = await Movie.upsertFromEvent(eventData);

            logger.success('MovieHandler', 'Película actualizada', {
                movie_id: movie.movie_id,
                titulo: movie.titulo
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

    /** Procesa peliculas.pelicula.borrada (hard delete) */
    async handleMovieDeleted(eventData) {
        try {
            const id = (eventData?.data?.data?.id) || (eventData?.data?.id) || eventData?.id;
            logger.info('MovieHandler', `Procesando película borrada${id ? `: ${id}` : ''}`);

            if (id === undefined || id === null) {
                throw new Error('Evento de borrado sin id');
            }

            const result = await Movie.deleteFromEvent(eventData);

            if (result?.deletedCount === 0) {
                logger.warn('MovieHandler', `Película a borrar no encontrada: ${id}`);
                // Aunque no exista la película, podemos seguir con el borrado de publicaciones si así se desea
            }

            // Eliminación en cascada de publicaciones
            const cascadeEnabled = String(process.env.PUBLICATION_CASCADE_ON_MOVIE_DELETE || 'true').toLowerCase() === 'true';
            let cascadeInfo = undefined;
            if (cascadeEnabled) {   // Utilizamos SOFT DELETE por defecto
                const mode = String(process.env.PUBLICATION_CASCADE_MODE || 'soft').toLowerCase();
                if (mode === 'hard') {
                    const r = await Publication.hardDeleteByMovieId(Number(id));
                    cascadeInfo = { mode: 'hard', deleted: r.deletedCount };
                } else {
                    const r = await Publication.softDeleteByMovieId(Number(id));
                    cascadeInfo = { mode: 'soft', matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified };
                }
            }

            logger.success('MovieHandler', 'Película eliminada', { movie_id: Number(id), cascade: cascadeInfo });
            return { movie_id: Number(id), deleted: true, cascade: cascadeInfo };
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