const express = require('express');
const router = express.Router();
const unavailabilityController = require('../controllers/unavailabilityController');

// POST /api/unavailability - Crear nueva indisponibilidad
router.post('/', unavailabilityController.create);

// GET /api/unavailability/check - Verificar disponibilidad
router.get('/check', unavailabilityController.checkAvailability);

// GET /api/unavailability/barber/:barbero_id - Obtener indisponibilidades de un barbero
router.get('/barber/:barbero_id', unavailabilityController.getByBarber);

// GET /api/unavailability/date/:fecha - Obtener indisponibilidades de una fecha
router.get('/date/:fecha', unavailabilityController.getByDate);

// DELETE /api/unavailability/:id - Eliminar indisponibilidad
router.delete('/:id', unavailabilityController.delete);

// DELETE /api/unavailability/barber/:barbero_id/date/:fecha - Eliminar todas las indisponibilidades de un barbero en una fecha
router.delete('/barber/:barbero_id/date/:fecha', unavailabilityController.deleteByBarberAndDate);

module.exports = router;