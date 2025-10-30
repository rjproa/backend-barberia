const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// POST /api/services - Crear nuevo servicio
router.post('/', serviceController.create);

// GET /api/services - Obtener todos los servicios
router.get('/', serviceController.getAll);

// GET /api/services/active - Obtener servicios activos
router.get('/active', serviceController.getActive);

// GET /api/services/:id - Obtener servicio por ID
router.get('/:id', serviceController.getById);

// PUT /api/services/:id - Actualizar servicio
router.put('/:id', serviceController.update);

// PATCH /api/services/:id/toggle - Activar/desactivar servicio
router.patch('/:id/toggle', serviceController.toggleActive);

// DELETE /api/services/:id - Eliminar servicio
router.delete('/:id', serviceController.delete);

module.exports = router;