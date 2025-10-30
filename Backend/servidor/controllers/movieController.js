const Movie = require('../models/Movie');

/**
 * Crear o actualizar película
 * POST /api/movie
 */
const upsertMovie = async (req, res) => {
  try {
    const { id, poster, titulo } = req.body;

    // Validaciones básicas
    if (!id || !poster || !titulo) {
      return res.status(400).json({
        error: 'id, poster y titulo son requeridos'
      });
    }

    // Validar que id sea un número
    const movieId = parseInt(id);
    if (isNaN(movieId)) {
      return res.status(400).json({
        error: 'id debe ser un número válido'
      });
    }

    // Crear o actualizar película
    const movie = await Movie.upsertFromMovieData({
      id: movieId,
      poster,
      titulo
    });

    res.status(200).json({
      message: 'Película procesada exitosamente',
      movie: {
        id: movie.movie_id,
        poster: movie.poster,
        titulo: movie.titulo,
        created_at: movie.created_at,
        updated_at: movie.updated_at
      }
    });

  } catch (error) {
    console.error('Error en upsertMovie:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

/**
 * Obtener película por ID
 * GET /api/movie/:movie_id
 */
const getMovie = async (req, res) => {
  try {
    const { movie_id } = req.params;

    if (!movie_id) {
      return res.status(400).json({
        error: 'movie_id es requerido'
      });
    }

    const movieId = parseInt(movie_id);
    if (isNaN(movieId)) {
      return res.status(400).json({
        error: 'movie_id debe ser un número válido'
      });
    }

    const movie = await Movie.getByMovieId(movieId);

    if (!movie) {
      return res.status(404).json({
        error: 'Película no encontrada'
      });
    }

    res.status(200).json({
      movie: {
        id: movie.movie_id,
        poster: movie.poster,
        titulo: movie.titulo,
        created_at: movie.created_at,
        updated_at: movie.updated_at
      }
    });

  } catch (error) {
    console.error('Error en getMovie:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener múltiples películas
 * GET /api/movie?ids=1,2,3
 */
const getMovies = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: 'Parámetro ids es requerido (ej: ?ids=1,2,3)'
      });
    }

    // Parsear IDs
    const movieIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (movieIds.length === 0) {
      return res.status(400).json({
        error: 'No se proporcionaron IDs válidos'
      });
    }

    const movies = await Movie.getByMovieIds(movieIds);

    res.status(200).json({
      movies: movies.map(movie => ({
        id: movie.movie_id,
        poster: movie.poster,
        titulo: movie.titulo,
        created_at: movie.created_at,
        updated_at: movie.updated_at
      })),
      total: movies.length
    });

  } catch (error) {
    console.error('Error en getMovies:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar película
 * DELETE /api/movie/:movie_id
 */
const deleteMovie = async (req, res) => {
  try {
    const { movie_id } = req.params;

    if (!movie_id) {
      return res.status(400).json({
        error: 'movie_id es requerido'
      });
    }

    const movieId = parseInt(movie_id);
    if (isNaN(movieId)) {
      return res.status(400).json({
        error: 'movie_id debe ser un número válido'
      });
    }

    const result = await Movie.deleteOne({ movie_id: movieId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Película no encontrada'
      });
    }

    res.status(200).json({
      message: 'Película eliminada exitosamente',
      movie_id: movieId
    });

  } catch (error) {
    console.error('Error en deleteMovie:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  upsertMovie,
  getMovie,
  getMovies,
  deleteMovie
};
