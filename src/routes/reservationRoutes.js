const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// POST /api/reservations - Crear nueva reserva
router.post('/', reservationController.create);

// GET /api/reservations - Obtener todas las reservas
router.get('/', reservationController.getAll);

// GET /api/reservations/available-slots - Obtener horarios disponibles
router.get('/available-slots', reservationController.getAvailableSlots);

// GET /api/reservations/status/:estado - Obtener reservas por estado
router.get('/status/:estado', reservationController.getByStatus);

// GET /api/reservations/user/:usuario_id - Obtener reservas de un usuario
router.get('/user/:usuario_id', reservationController.getByUser);

// GET /api/reservations/barber/:barbero_id - Obtener reservas de un barbero
router.get('/barber/:barbero_id', reservationController.getByBarber);

// GET /api/reservations/:id - Obtener reserva por ID
router.get('/:id', reservationController.getById);

// PATCH /api/reservations/:id/status - Actualizar estado de reserva
router.patch('/:id/status', reservationController.updateStatus);

// DELETE /api/reservations/:id - Eliminar reserva
router.delete('/:id', reservationController.delete);

module.exports = router;