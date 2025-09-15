const express = require('express');
const { createUser, getUser, searchUsers, updateUser } = require('../controllers/userController');

const router = express.Router();

// Rutas de usuarios
router.post('/user', createUser);
router.get('/user/search', searchUsers);
router.get('/user/:user_id', getUser);
router.put('/user/:user_id', updateUser);

module.exports = router;
