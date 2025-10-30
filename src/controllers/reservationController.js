const Reservation = require('../models/reservation');
const ReservationDetail = require('../models/reservationDetail');

exports.create = async (req, res) => {
  try {
    const { usuario_id, barbero_id, fecha_reserva, hora_reserva, notas, servicios, productos } = req.body;

    if (!usuario_id || !barbero_id || !fecha_reserva || !hora_reserva) {
      return res.status(400).json({
        success: false,
        error: 'Usuario, barbero, fecha y hora son requeridos'
      });
    }

    // Crear la reserva
    const reservation = await Reservation.create({
      usuario_id,
      barbero_id,
      fecha_reserva,
      hora_reserva,
      notas
    });

    // Agregar servicios si existen
    if (servicios && servicios.length > 0) {
      for (const servicio of servicios) {
        await ReservationDetail.create({
          reserva_id: reservation.id,
          tipo: 'servicio',
          servicio_id: servicio.id,
          producto_id: null,
          precio_unitario: servicio.precio
        });
      }
    }

    // Agregar productos si existen
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        await ReservationDetail.create({
          reserva_id: reservation.id,
          tipo: 'producto',
          servicio_id: null,
          producto_id: producto.id,
          precio_unitario: producto.precio
        });
      }
    }

    // Obtener la reserva completa con detalles
    const reservationComplete = await Reservation.findById(reservation.id);
    const details = await ReservationDetail.findByReservation(reservation.id);

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        ...reservationComplete,
        detalles: details
      }
    });
  } catch (error) {
    console.error('Error en create reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear reserva',
      message: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error en getAll reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas',
      message: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const details = await ReservationDetail.findByReservation(id);
    const total = await ReservationDetail.getTotalByReservation(id);

    res.json({
      success: true,
      data: {
        ...reservation,
        detalles: details,
        total
      }
    });
  } catch (error) {
    console.error('Error en getById reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la reserva',
      message: error.message
    });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const reservations = await Reservation.findByUser(usuario_id);
    
    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error en getByUser reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas del usuario',
      message: error.message
    });
  }
};

exports.getByBarber = async (req, res) => {
  try {
    const { barbero_id } = req.params;
    const { fecha } = req.query;
    
    const reservations = await Reservation.findByBarber(barbero_id, fecha);
    
    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error en getByBarber reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas del barbero',
      message: error.message
    });
  }
};

exports.getByStatus = async (req, res) => {
  try {
    const { estado } = req.params;
    const reservations = await Reservation.findByStatus(estado);
    
    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error en getByStatus reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas por estado',
      message: error.message
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, cancelado_por } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        error: 'El estado es requerido'
      });
    }

    const validStates = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido. Debe ser: pendiente, confirmada, completada o cancelada'
      });
    }

    const reservation = await Reservation.updateStatus(id, estado, cancelado_por);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Reserva ${estado} exitosamente`,
      data: reservation
    });
  } catch (error) {
    console.error('Error en updateStatus reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado de la reserva',
      message: error.message
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { barbero_id, fecha } = req.query;

    if (!barbero_id || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'Barbero y fecha son requeridos'
      });
    }

    const occupiedSlots = await Reservation.getAvailableSlots(barbero_id, fecha);

    // Horarios disponibles de 9am a 7pm
    const allSlots = [];
    for (let hour = 9; hour < 19; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }

    const availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot));

    res.json({
      success: true,
      fecha,
      barbero_id: parseInt(barbero_id),
      slots_disponibles: availableSlots,
      slots_ocupados: occupiedSlots
    });
  } catch (error) {
    console.error('Error en getAvailableSlots:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener horarios disponibles',
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.delete(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Reserva eliminada exitosamente',
      data: reservation
    });
  } catch (error) {
    console.error('Error en delete reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar reserva',
      message: error.message
    });
  }
};