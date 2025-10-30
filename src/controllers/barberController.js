const Barber = require('../models/barber');

exports.create = async (req, res) => {
  try {
    const { usuario_id, nombre_artistico, especialidad } = req.body;

    if (!nombre_artistico) {
      return res.status(400).json({
        success: false,
        error: 'El nombre artístico es requerido'
      });
    }

    const barber = await Barber.create({ usuario_id, nombre_artistico, especialidad });

    res.status(201).json({
      success: true,
      message: 'Barbero creado exitosamente',
      data: barber
    });
  } catch (error) {
    console.error('Error en create barber:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear barbero',
      message: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const barbers = await Barber.findAll();
    res.json({
      success: true,
      count: barbers.length,
      data: barbers
    });
  } catch (error) {
    console.error('Error en getAll barbers:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener barberos',
      message: error.message
    });
  }
};

exports.getAvailable = async (req, res) => {
  try {
    const barbers = await Barber.findAvailable();
    res.json({
      success: true,
      count: barbers.length,
      data: barbers
    });
  } catch (error) {
    console.error('Error en getAvailable barbers:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener barberos disponibles',
      message: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const barber = await Barber.findById(id);
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        error: 'Barbero no encontrado'
      });
    }

    res.json({
      success: true,
      data: barber
    });
  } catch (error) {
    console.error('Error en getById barber:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el barbero',
      message: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const barber = await Barber.update(id, updates);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: 'Barbero no encontrado o sin cambios'
      });
    }

    res.json({
      success: true,
      message: 'Barbero actualizado exitosamente',
      data: barber
    });
  } catch (error) {
    console.error('Error en update barber:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar barbero',
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const barber = await Barber.delete(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: 'Barbero no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Barbero eliminado exitosamente',
      data: barber
    });
  } catch (error) {
    console.error('Error en delete barber:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar barbero',
      message: error.message
    });
  }
};