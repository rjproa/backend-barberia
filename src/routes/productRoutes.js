const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// POST /api/products - Crear nuevo producto
router.post('/', productController.create);

// GET /api/products - Obtener todos los productos
router.get('/', productController.getAll);

// GET /api/products/active - Obtener productos activos
router.get('/active', productController.getActive);

// GET /api/products/category/:categoria - Obtener productos por categoría
router.get('/category/:categoria', productController.getByCategory);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', productController.getById);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', productController.update);

// PATCH /api/products/:id/toggle - Activar/desactivar producto
router.patch('/:id/toggle', productController.toggleActive);

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', productController.delete);

module.exports = router;