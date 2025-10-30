const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');

// POST /api/barbers - Crear nuevo barbero
router.post('/', barberController.create);

// GET /api/barbers - Obtener todos los barberos
router.get('/', barberController.getAll);

// GET /api/barbers/available - Obtener barberos disponibles
router.get('/available', barberController.getAvailable);

// GET /api/barbers/:id - Obtener barbero por ID
router.get('/:id', barberController.getById);

// PUT /api/barbers/:id - Actualizar barbero
router.put('/:id', barberController.update);

// DELETE /api/barbers/:id - Eliminar barbero
router.delete('/:id', barberController.delete);

module.exports = router;