const BarberUnavailability = require('../models/barberUnavailability');

exports.create = async (req, res) => {
  try {
    const { barbero_id, fecha, hora_inicio, hora_fin, motivo } = req.body;

    if (!barbero_id || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'Barbero y fecha son requeridos'
      });
    }

    const unavailability = await BarberUnavailability.create({
      barbero_id,
      fecha,
      hora_inicio,
      hora_fin,
      motivo
    });

    res.status(201).json({
      success: true,
      message: 'Indisponibilidad creada exitosamente',
      data: unavailability
    });
  } catch (error) {
    console.error('Error en create unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear indisponibilidad',
      message: error.message
    });
  }
};

exports.getByBarber = async (req, res) => {
  try {
    const { barbero_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const unavailabilities = await BarberUnavailability.findByBarber(
      barbero_id,
      fecha_inicio,
      fecha_fin
    );

    res.json({
      success: true,
      count: unavailabilities.length,
      data: unavailabilities
    });
  } catch (error) {
    console.error('Error en getByBarber unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener indisponibilidades del barbero',
      message: error.message
    });
  }
};

exports.getByDate = async (req, res) => {
  try {
    const { fecha } = req.params;

    const unavailabilities = await BarberUnavailability.findByDate(fecha);

    res.json({
      success: true,
      count: unavailabilities.length,
      data: unavailabilities
    });
  } catch (error) {
    console.error('Error en getByDate unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener indisponibilidades de la fecha',
      message: error.message
    });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { barbero_id, fecha, hora } = req.query;

    if (!barbero_id || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        error: 'Barbero, fecha y hora son requeridos'
      });
    }

    const isAvailable = await BarberUnavailability.isBarberAvailable(
      barbero_id,
      fecha,
      hora
    );

    res.json({
      success: true,
      barbero_id: parseInt(barbero_id),
      fecha,
      hora,
      disponible: isAvailable
    });
  } catch (error) {
    console.error('Error en checkAvailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar disponibilidad',
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const unavailability = await BarberUnavailability.delete(id);

    if (!unavailability) {
      return res.status(404).json({
        success: false,
        error: 'Indisponibilidad no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Indisponibilidad eliminada exitosamente',
      data: unavailability
    });
  } catch (error) {
    console.error('Error en delete unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar indisponibilidad',
      message: error.message
    });
  }
};

exports.deleteByBarberAndDate = async (req, res) => {
  try {
    const { barbero_id, fecha } = req.params;
    const unavailabilities = await BarberUnavailability.deleteByBarberAndDate(
      barbero_id,
      fecha
    );

    res.json({
      success: true,
      message: 'Indisponibilidades eliminadas exitosamente',
      count: unavailabilities.length,
      data: unavailabilities
    });
  } catch (error) {
    console.error('Error en deleteByBarberAndDate:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar indisponibilidades',
      message: error.message
    });
  }
};