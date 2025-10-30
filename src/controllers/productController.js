const Product = require('../models/product');

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y precio son requeridos'
      });
    }

    const product = await Product.create({ nombre, descripcion, precio, categoria });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error en create product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear producto',
      message: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error en getAll products:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      message: error.message
    });
  }
};

exports.getActive = async (req, res) => {
  try {
    const products = await Product.findActive();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error en getActive products:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos activos',
      message: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error en getById product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message
    });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    const products = await Product.findByCategory(categoria);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error en getByCategory product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos por categoría',
      message: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.update(id, updates);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado o sin cambios'
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error en update product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto',
      message: error.message
    });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.toggleActive(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Producto ${product.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: product
    });
  } catch (error) {
    console.error('Error en toggleActive product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del producto',
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.delete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error en delete product:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto',
      message: error.message
    });
  }
};