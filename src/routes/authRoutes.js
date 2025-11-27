const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile - Actualizar perfil del usuario autenticado
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticate, authController.changePassword);

// GET /api/auth/verify - Verificar si el token es válido
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;