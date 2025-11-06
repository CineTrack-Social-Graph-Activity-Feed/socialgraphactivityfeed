const mongoose = require('mongoose');

/**
 * Modelo de Movie (Película) para el Consumer
 * Guarda lo mínimo necesario para el feed: movie_id, poster, titulo
 */
const movieSchema = new mongoose.Schema({
    movie_id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    poster: {
        type: String,
        required: true,
        trim: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    syncedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

movieSchema.index({ movie_id: 1 });
movieSchema.index({ titulo: 1 });

/**
 * Normaliza el evento del Core y hace upsert por movie_id
 * Soporta estructuras: { data: { data: {...} } }, { data: {...} } o plana
 */
movieSchema.statics.upsertFromEvent = async function (eventData) {
    const actualData = eventData?.data || eventData || {};
    const movieData = actualData?.data || actualData;

    const id = movieData.id ?? movieData.movie_id;
    const poster = movieData.poster || movieData.portada || movieData.poster_path;
    const titulo = movieData.titulo || movieData.title;

    if (id === undefined || poster === undefined || titulo === undefined) {
        throw new Error('Evento de película incompleto: se requieren id, poster y titulo');
    }

    const update = {
        movie_id: Number(id),
        poster: String(poster),
        titulo: String(titulo),
        updated_at: new Date(),
        syncedAt: new Date()
    };

    const movie = await this.findOneAndUpdate(
        { movie_id: Number(id) },
        { $set: update, $setOnInsert: { created_at: new Date() } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return movie;
};

/** Obtener película por ID */
movieSchema.statics.getByMovieId = async function (movieId) {
    return await this.findOne({ movie_id: Number(movieId) });
};

/**
 * Eliminar película desde evento del Core
 */
movieSchema.statics.deleteFromEvent = async function (eventData) {
    const actualData = eventData?.data || eventData || {};
    const movieData = actualData?.data || actualData;
    const id = movieData.id ?? movieData.movie_id;
    if (id === undefined || id === null) {
        throw new Error('Evento de borrado de película sin id');
    }
    return await this.deleteOne({ movie_id: Number(id) });
};

module.exports = mongoose.model('Movie', movieSchema);