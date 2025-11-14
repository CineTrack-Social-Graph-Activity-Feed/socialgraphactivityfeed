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

    const user = await User.findOne({ user_id: user_id, activated: { $ne: false } });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        user_id: user.user_id,
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
      username: { $regex: q.trim(), $options: 'i' },
      activated: { $ne: false }
    })
    .select('username email avatar_url created_at')
    .sort({ username: 1 })
    .skip(skip)
    .limit(limit);

    // Obtener total de resultados
    const totalUsers = await User.countDocuments({
      username: { $regex: q.trim(), $options: 'i' },
      activated: { $ne: false }
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

    // Buscar usuario
    const user = await User.findOne({ _id: user_id, activated: { $ne: false } });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar campos
    if (username) user.username = username.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (avatar_url !== undefined) user.avatar_url = avatar_url;

    // Guardar cambios
    await user.save();

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

/**
 * Eliminar un usuario
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;

    const user = await User.findOneAndDelete({ _id: userId });
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar si un usuario existe
 */
const checkUserExists = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;

    const user = await User.findOne({ _id: userId });
    
    res.status(200).json({
      exists: !!user
    });

  } catch (error) {
    console.error('Error en checkUserExists:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener usuario por username
 */
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username, activated: { $ne: false } });
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Error en getUserByUsername:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener todos los usuarios
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ activated: { $ne: false } }).select('-__v');
    
    res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }))
    });

  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createUser,
  getUser,
  searchUsers,
  updateUser,
  deleteUser,
  checkUserExists,
  getUserByUsername,
  getAllUsers
};