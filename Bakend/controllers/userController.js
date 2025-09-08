const User = require('../models/User');

/**
 * Crear un nuevo usuario
 * POST /api/user
 */
const createUser = async (req, res) => {
  try {
    const { username, email, avatar_url } = req.body;

    // Validaciones básicas
    if (!username || !email) {
      return res.status(400).json({
        error: 'username y email son requeridos'
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    // Crear el usuario
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      avatar_url: avatar_url || null
    });

    await user.save();

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error en createUser:', error);
    
    // Manejar errores de duplicados
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `El ${field} ya está en uso`
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener usuario por ID
 * GET /api/user/:user_id
 */
const getUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido'
      });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error en getUser:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Buscar usuarios por username
 * GET /api/user/search?q=username
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Parámetro de búsqueda q es requerido'
      });
    }

    // Buscar usuarios que contengan el texto en el username
    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' }
    })
    .select('username email avatar_url created_at')
    .sort({ username: 1 })
    .skip(skip)
    .limit(limit);

    // Obtener total de resultados
    const totalUsers = await User.countDocuments({
      username: { $regex: q.trim(), $options: 'i' }
    });

    res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalUsers / limit),
        total_items: totalUsers,
        items_per_page: limit
      }
    });

  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar usuario
 * PUT /api/user/:user_id
 */
const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { username, email, avatar_url } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido'
      });
    }

    // Construir objeto de actualización
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Formato de email inválido'
        });
      }
      updateData.email = email.toLowerCase().trim();
    }
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Actualizar usuario
    const user = await User.findByIdAndUpdate(
      user_id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error en updateUser:', error);
    
    // Manejar errores de duplicados
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `El ${field} ya está en uso`
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createUser,
  getUser,
  searchUsers,
  updateUser
};
