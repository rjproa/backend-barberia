const pool = require('../config/database');

class ReservationDetail {

  static async create({ reserva_id, tipo, servicio_id, producto_id, precio_unitario }) {
    const query = `
      INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, producto_id, precio_unitario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [reserva_id, tipo, servicio_id, producto_id, precio_unitario];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByReservation(reserva_id) {
    const query = `
      SELECT 
        dr.*,
        s.nombre as servicio_nombre,
        s.duracion as servicio_duracion,
        p.nombre as producto_nombre,
        p.categoria as producto_categoria
      FROM detalle_reserva dr
      LEFT JOIN servicios s ON dr.servicio_id = s.id
      LEFT JOIN productos p ON dr.producto_id = p.id
      WHERE dr.reserva_id = $1
      ORDER BY dr.id
    `;
    const result = await pool.query(query, [reserva_id]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM detalle_reserva WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByReservation(reserva_id) {
    const query = 'DELETE FROM detalle_reserva WHERE reserva_id = $1 RETURNING *';
    const result = await pool.query(query, [reserva_id]);
    return result.rows;
  }

  static async getTotalByReservation(reserva_id) {
    const query = `
      SELECT SUM(precio_unitario) as total
      FROM detalle_reserva
      WHERE reserva_id = $1
    `;
    const result = await pool.query(query, [reserva_id]);
    return result.rows[0]?.total || 0;
  }
}

module.exports = ReservationDetail;