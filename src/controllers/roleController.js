const Role = require('../models/role');

exports.getAll = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error en getAll roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener roles',
      message: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error en getById role:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el rol',
      message: error.message
    });
  }
};

exports.getByName = async (req, res) => {
  try {
    const { nombre } = req.params;
    const role = await Role.findByName(nombre);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error en getByName role:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el rol',
      message: error.message
    });
  }
};