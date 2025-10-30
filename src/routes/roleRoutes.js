const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// GET /api/roles - Obtener todos los roles
router.get('/', roleController.getAll);

// GET /api/roles/:id - Obtener rol por ID
router.get('/:id', roleController.getById);

// GET /api/roles/nombre/:nombre - Obtener rol por nombre
router.get('/nombre/:nombre', roleController.getByName);

module.exports = router;