const pool = require('../config/database');

class Reservation {

  // Crear reserva con cálculo automático de descuentos
  static async create({
    usuario_id,
    barbero_id,
    fecha_reserva,
    hora_reserva,
    notas,
    es_invitado = false,
    invitado_nombre = null,
    invitado_telefono = null,
    invitado_email = null
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verificar disponibilidad
      const checkQuery = `
        SELECT * FROM reservas
        WHERE barbero_id = $1
        AND fecha_reserva = $2
        AND hora_reserva = $3
        AND estado NOT IN ('cancelada')
      `;
      const check = await client.query(checkQuery, [barbero_id, fecha_reserva, hora_reserva]);

      if (check.rows.length > 0) {
        throw new Error('El barbero ya tiene una reserva en ese horario');
      }

      // Validar datos según tipo de reserva
      if (es_invitado) {
        if (!invitado_nombre || !invitado_telefono) {
          throw new Error('Nombre y teléfono son requeridos para reservas de invitados');
        }
      } else {
        if (!usuario_id) {
          throw new Error('usuario_id es requerido para reservas de usuarios registrados');
        }
      }

      // NUEVO: Calcular descuento para usuarios registrados
      let citasCompletadas = 0;
      let aplicaDescuento = false;
      let porcentajeDescuento = 0;

      if (!es_invitado && usuario_id) {
        // Contar citas completadas del usuario
        const citasQuery = await client.query(
          'SELECT contar_citas_completadas($1) as total',
          [usuario_id]
        );
        citasCompletadas = citasQuery.rows[0].total;

        // Calcular si aplica descuento
        const descuentoQuery = await client.query(
          'SELECT * FROM calcular_descuento($1)',
          [citasCompletadas]
        );

        const descuentoInfo = descuentoQuery.rows[0];
        aplicaDescuento = descuentoInfo.aplica;
        porcentajeDescuento = descuentoInfo.porcentaje;
      }

      // Crear la reserva con información de descuento
      const insertQuery = `
        INSERT INTO reservas (
          usuario_id, 
          barbero_id, 
          fecha_reserva, 
          hora_reserva, 
          notas,
          es_invitado,
          invitado_nombre,
          invitado_telefono,
          invitado_email,
          citas_completadas_previas,
          aplica_descuento,
          porcentaje_descuento
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        usuario_id || null,
        barbero_id,
        fecha_reserva,
        hora_reserva,
        notas || null,
        es_invitado,
        invitado_nombre,
        invitado_telefono,
        invitado_email,
        citasCompletadas,
        aplicaDescuento,
        porcentajeDescuento
      ];

      const result = await client.query(insertQuery, values);

      // Actualizar estadísticas del barbero
      await client.query(
        'UPDATE barberos SET total_citas = total_citas + 1 WHERE id = $1',
        [barbero_id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // NUEVO: Calcular y actualizar totales de una reserva
  static async calcularTotales(reserva_id) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtener información de la reserva
      const reservaQuery = await client.query(
        'SELECT * FROM reservas WHERE id = $1',
        [reserva_id]
      );

      if (reservaQuery.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      const reserva = reservaQuery.rows[0];

      // Calcular subtotal (suma de servicios y productos)
      const subtotalQuery = await client.query(
        'SELECT COALESCE(SUM(precio_unitario), 0) as subtotal FROM detalle_reserva WHERE reserva_id = $1',
        [reserva_id]
      );

      const subtotal = parseFloat(subtotalQuery.rows[0].subtotal);

      // Calcular descuento si aplica
      let descuentoMonto = 0;
      let totalFinal = subtotal;

      if (reserva.aplica_descuento && reserva.porcentaje_descuento > 0) {
        const montosQuery = await client.query(
          'SELECT * FROM calcular_montos_reserva($1, $2)',
          [subtotal, reserva.porcentaje_descuento]
        );

        descuentoMonto = parseFloat(montosQuery.rows[0].descuento_monto);
        totalFinal = parseFloat(montosQuery.rows[0].total_final);
      }

      // Actualizar la reserva con los totales
      const updateQuery = await client.query(
        `UPDATE reservas 
         SET subtotal = $1, 
             descuento_monto = $2, 
             total_final = $3
         WHERE id = $4
         RETURNING *`,
        [subtotal, descuentoMonto, totalFinal, reserva_id]
      );

      // Si aplica descuento, registrar en historial
      if (reserva.aplica_descuento && reserva.usuario_id) {
        await client.query(
          `INSERT INTO historial_descuentos 
           (reserva_id, usuario_id, citas_completadas_al_momento, porcentaje_aplicado, monto_descuento, subtotal, total_final)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            reserva_id,
            reserva.usuario_id,
            reserva.citas_completadas_previas,
            reserva.porcentaje_descuento,
            descuentoMonto,
            subtotal,
            totalFinal
          ]
        );
      }

      await client.query('COMMIT');
      return updateQuery.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener todas las reservas con información de descuentos
  static async findAll() {
    const query = 'SELECT * FROM vista_reservas_con_descuentos ORDER BY fecha_reserva DESC, hora_reserva DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener reserva por ID con información completa
  static async findById(id) {
    const query = 'SELECT * FROM vista_reservas_con_descuentos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Obtener reservas de un usuario
  static async findByUser(usuario_id) {
    const query = `
      SELECT * FROM vista_reservas_con_descuentos
      WHERE usuario_id = $1 AND es_invitado = false
      ORDER BY fecha_reserva DESC, hora_reserva DESC
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  // NUEVO: Obtener estadísticas de fidelidad de un usuario
  static async getUsuarioLoyaltyStats(usuario_id) {
    const query = `
      SELECT 
        contar_citas_completadas($1) as citas_completadas,
        (SELECT * FROM calcular_descuento(contar_citas_completadas($1))) as proximo_descuento,
        (SELECT COUNT(*) FROM reservas WHERE usuario_id = $1 AND aplica_descuento = true) as veces_uso_descuento,
        (SELECT COALESCE(SUM(descuento_monto), 0) FROM reservas WHERE usuario_id = $1 AND aplica_descuento = true) as total_ahorrado
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows[0];
  }

  // Obtener reservas de invitado por teléfono
  static async findByGuestPhone(telefono) {
    const query = `
      SELECT * FROM vista_reservas_con_descuentos
      WHERE invitado_telefono = $1 AND es_invitado = true
      ORDER BY fecha_reserva DESC, hora_reserva DESC
    `;
    const result = await pool.query(query, [telefono]);
    return result.rows;
  }

  // Obtener reservas de un barbero
  static async findByBarber(barbero_id, fecha = null) {
    let query = `
      SELECT * FROM vista_reservas_con_descuentos
      WHERE barbero_id = $1
    `;

    const values = [barbero_id];

    if (fecha) {
      query += ' AND fecha_reserva = $2';
      values.push(fecha);
    }

    query += ' ORDER BY fecha_reserva, hora_reserva';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Obtener reservas por estado
  static async findByStatus(estado) {
    const query = `
      SELECT * FROM vista_reservas_con_descuentos
      WHERE estado = $1
      ORDER BY fecha_reserva, hora_reserva
    `;
    const result = await pool.query(query, [estado]);
    return result.rows;
  }

  // Actualizar estado de reserva
  static async updateStatus(id, estado, cancelado_por = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let query = 'UPDATE reservas SET estado = $1';
      const values = [estado, id];

      if (estado === 'cancelada') {
        query += ', fecha_cancelacion = CURRENT_TIMESTAMP, cancelado_por = $3';
        values.splice(2, 0, cancelado_por);

        const reserva = await client.query('SELECT barbero_id FROM reservas WHERE id = $1', [id]);
        if (reserva.rows.length > 0) {
          await client.query(
            'UPDATE barberos SET citas_canceladas = citas_canceladas + 1 WHERE id = $1',
            [reserva.rows[0].barbero_id]
          );
        }
      } else if (estado === 'completada') {
        const reserva = await client.query('SELECT barbero_id FROM reservas WHERE id = $1', [id]);
        if (reserva.rows.length > 0) {
          await client.query(
            'UPDATE barberos SET citas_completadas = citas_completadas + 1 WHERE id = $1',
            [reserva.rows[0].barbero_id]
          );
        }
      }

      query += ' WHERE id = $2 RETURNING *';
      const result = await client.query(query, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Eliminar reserva
  static async delete(id) {
    const query = 'DELETE FROM reservas WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Obtener horarios disponibles
  static async getAvailableSlots(barbero_id, fecha) {
    const query = `
      SELECT hora_reserva
      FROM reservas
      WHERE barbero_id = $1
      AND fecha_reserva = $2
      AND estado NOT IN ('cancelada')
      ORDER BY hora_reserva
    `;
    const result = await pool.query(query, [barbero_id, fecha]);
    return result.rows.map(r => r.hora_reserva);
  }

  // Obtener estadísticas generales
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE es_invitado = false) as reservas_registrados,
        COUNT(*) FILTER (WHERE es_invitado = true) as reservas_invitados,
        COUNT(*) as total_reservas,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'confirmada') as confirmadas,
        COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
        COUNT(*) FILTER (WHERE aplica_descuento = true) as con_descuento,
        COALESCE(SUM(descuento_monto), 0) as total_descuentos_otorgados,
        COALESCE(SUM(total_final), 0) as ingresos_totales
      FROM reservas
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Reservation;