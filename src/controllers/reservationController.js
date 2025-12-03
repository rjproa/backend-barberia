const Reservation = require('../models/reservation');
const ReservationDetail = require('../models/reservationDetail');

// ============================================
// CREAR RESERVA CON CÁLCULO AUTOMÁTICO DE DESCUENTO
// ============================================
exports.create = async (req, res) => {
  try {
    const {
      usuario_id,
      barbero_id,
      fecha_reserva,
      hora_reserva,
      notas,
      servicios,
      productos,
      es_invitado,
      invitado_nombre,
      invitado_telefono,
      invitado_email
    } = req.body;

    // Validaciones básicas
    if (!barbero_id || !fecha_reserva || !hora_reserva) {
      return res.status(400).json({
        success: false,
        error: 'Barbero, fecha y hora son requeridos'
      });
    }

    // Validar según tipo de reserva
    if (es_invitado) {
      if (!invitado_nombre || !invitado_telefono) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y teléfono son requeridos para reservas de invitados'
        });
      }
    } else {
      if (!usuario_id) {
        return res.status(400).json({
          success: false,
          error: 'usuario_id es requerido para reservas de usuarios registrados'
        });
      }
    }

    // Crear la reserva (el modelo calcula automáticamente el descuento)
    const reservation = await Reservation.create({
      usuario_id: es_invitado ? null : usuario_id,
      barbero_id,
      fecha_reserva,
      hora_reserva,
      notas,
      es_invitado: es_invitado || false,
      invitado_nombre: es_invitado ? invitado_nombre : null,
      invitado_telefono: es_invitado ? invitado_telefono : null,
      invitado_email: es_invitado ? invitado_email : null
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

    // NUEVO: Calcular totales con descuento
    await Reservation.calcularTotales(reservation.id);

    // Obtener la reserva completa con detalles y descuentos
    const reservationComplete = await Reservation.findById(reservation.id);
    const details = await ReservationDetail.findByReservation(reservation.id);

    // Mensaje personalizado si aplica descuento
    let message = es_invitado
      ? 'Reserva de invitado creada exitosamente'
      : 'Reserva creada exitosamente';

    if (reservation.aplica_descuento) {
      message += ` - ¡Felicidades! Tienes ${reservation.porcentaje_descuento}% de descuento por fidelidad`;
    }

    res.status(201).json({
      success: true,
      message,
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

// ============================================
// OBTENER TODAS LAS RESERVAS (CON INFO DE DESCUENTOS)
// ============================================
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

// ============================================
// OBTENER RESERVA POR ID
// ============================================
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

    res.json({
      success: true,
      data: {
        ...reservation,
        detalles: details
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

// ============================================
// OBTENER RESERVAS POR USUARIO
// ============================================
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

// ============================================
// NUEVO: OBTENER ESTADÍSTICAS DE FIDELIDAD DEL USUARIO
// ============================================
exports.getUserLoyaltyStats = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const stats = await Reservation.getUsuarioLoyaltyStats(usuario_id);

    // Parsear el resultado de la función proximo_descuento
    const proximoDescuento = stats.proximo_descuento;
    const [aplica, porcentaje, esCitaNumero] = proximoDescuento
      .replace('(', '')
      .replace(')', '')
      .split(',')
      .map(v => v === 't' ? true : v === 'f' ? false : parseFloat(v));

    res.json({
      success: true,
      data: {
        citas_completadas: parseInt(stats.citas_completadas),
        proximo_descuento: {
          aplica: aplica,
          porcentaje: porcentaje,
          sera_la_cita: esCitaNumero
        },
        veces_uso_descuento: parseInt(stats.veces_uso_descuento),
        total_ahorrado: parseFloat(stats.total_ahorrado)
      }
    });
  } catch (error) {
    console.error('Error en getUserLoyaltyStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de fidelidad',
      message: error.message
    });
  }
};

// ============================================
// OBTENER RESERVAS DE INVITADO POR TELÉFONO
// ============================================
exports.getByGuestPhone = async (req, res) => {
  try {
    const { telefono } = req.params;

    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono es requerido'
      });
    }

    const reservations = await Reservation.findByGuestPhone(telefono);

    res.json({
      success: true,
      count: reservations.length,
      message: `Reservas encontradas para el teléfono ${telefono}`,
      data: reservations
    });
  } catch (error) {
    console.error('Error en getByGuestPhone reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas del invitado',
      message: error.message
    });
  }
};

// ============================================
// OBTENER RESERVAS POR BARBERO
// ============================================
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

// ============================================
// OBTENER RESERVAS POR ESTADO
// ============================================
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

// ============================================
// ACTUALIZAR ESTADO DE RESERVA
// ============================================
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

// ============================================
// OBTENER HORARIOS DISPONIBLES
// ============================================
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

// ============================================
// ELIMINAR RESERVA
// ============================================
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

// ============================================
// OBTENER ESTADÍSTICAS DE RESERVAS
// ============================================
exports.getStats = async (req, res) => {
  try {
    const stats = await Reservation.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error en getStats reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};