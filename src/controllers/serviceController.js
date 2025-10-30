const Service = require('../models/service');

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y precio son requeridos'
      });
    }

    const service = await Service.create({ nombre, descripcion, precio, duracion });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error en create service:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear servicio',
      message: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error en getAll services:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener servicios',
      message: error.message
    });
  }
};

exports.getActive = async (req, res) => {
  try {
    const services = await Service.findActive();
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error en getActive services:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener servicios activos',
      message: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error en getById service:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el servicio',
      message: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.update(id, updates);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado o sin cambios'
      });
    }

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error en update service:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar servicio',
      message: error.message
    });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.toggleActive(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Servicio ${service.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: service
    });
  } catch (error) {
    console.error('Error en toggleActive service:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del servicio',
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.delete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error en delete service:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar servicio',
      message: error.message
    });
  }
};