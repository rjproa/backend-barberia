const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// POST /api/users - Crear nuevo usuario (registro)
router.post('/', userController.create);

// ============================================
// RUTAS DE CONSULTA
// ============================================

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll);

// GET /api/users/stats - Obtener estadísticas de usuarios por rol
router.get('/stats', userController.getStats);

// GET /api/users/rol/:rol_id - Obtener usuarios por rol
router.get('/rol/:rol_id', userController.getByRol);

// GET /api/users/rol/:rol_id/count - Contar usuarios por rol
router.get('/rol/:rol_id/count', userController.countByRol);

// GET /api/users/telefono/:telefono - Buscar usuario por teléfono
router.get('/telefono/:telefono', userController.getByTelefono);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getById);

// ============================================
// RUTAS DE ACTUALIZACIÓN
// ============================================

// PUT /api/users/:id - Actualizar datos del usuario
router.put('/:id', userController.update);

// PATCH /api/users/:id/password - Actualizar contraseña
router.patch('/:id/password', userController.updatePassword);

// ============================================
// RUTAS DE ELIMINACIÓN
// ============================================

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', userController.delete);

module.exports = router;