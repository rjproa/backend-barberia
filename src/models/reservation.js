const pool = require('../config/database');

class Reservation {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
        fecha_reserva DATE NOT NULL,
        hora_reserva TIME NOT NULL,
        estado VARCHAR(20) DEFAULT 'pendiente',
        notas TEXT,
        fecha_cancelacion TIMESTAMP,
        cancelado_por INTEGER REFERENCES usuarios(id),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(barbero_id, fecha_reserva, hora_reserva)
      );
      
      CREATE INDEX IF NOT EXISTS idx_reservas_barbero_fecha 
      ON reservas(barbero_id, fecha_reserva, hora_reserva);
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Tabla reservas creada/verificada');
    } catch (error) {
      console.error('❌ Error creando tabla reservas:', error.message);
      throw error;
    }
  }

  static async create({ usuario_id, barbero_id, fecha_reserva, hora_reserva, notas }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar si el barbero está disponible en esa fecha/hora
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

      // Crear la reserva
      const insertQuery = `
        INSERT INTO reservas (usuario_id, barbero_id, fecha_reserva, hora_reserva, notas)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await client.query(insertQuery, [usuario_id, barbero_id, fecha_reserva, hora_reserva, notas]);
      
      // Actualizar estadísticas del barbero
      await client.query('UPDATE barberos SET total_citas = total_citas + 1 WHERE id = $1', [barbero_id]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const query = `
      SELECT 
        r.*,
        u.nombre as cliente_nombre,
        u.telefono as cliente_telefono,
        b.nombre_artistico as barbero_nombre,
        b.especialidad as barbero_especialidad
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN barberos b ON r.barbero_id = b.id
      ORDER BY r.fecha_reserva DESC, r.hora_reserva DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        r.*,
        u.nombre as cliente_nombre,
        u.telefono as cliente_telefono,
        b.nombre_artistico as barbero_nombre,
        b.especialidad as barbero_especialidad
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN barberos b ON r.barbero_id = b.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUser(usuario_id) {
    const query = `
      SELECT 
        r.*,
        b.nombre_artistico as barbero_nombre,
        b.especialidad as barbero_especialidad
      FROM reservas r
      JOIN barberos b ON r.barbero_id = b.id
      WHERE r.usuario_id = $1
      ORDER BY r.fecha_reserva DESC, r.hora_reserva DESC
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  static async findByBarber(barbero_id, fecha = null) {
    let query = `
      SELECT 
        r.*,
        u.nombre as cliente_nombre,
        u.telefono as cliente_telefono
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.barbero_id = $1
    `;
    
    const values = [barbero_id];
    
    if (fecha) {
      query += ' AND r.fecha_reserva = $2';
      values.push(fecha);
    }
    
    query += ' ORDER BY r.fecha_reserva, r.hora_reserva';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findByStatus(estado) {
    const query = `
      SELECT 
        r.*,
        u.nombre as cliente_nombre,
        b.nombre_artistico as barbero_nombre
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN barberos b ON r.barbero_id = b.id
      WHERE r.estado = $1
      ORDER BY r.fecha_reserva, r.hora_reserva
    `;
    const result = await pool.query(query, [estado]);
    return result.rows;
  }

  static async updateStatus(id, estado, cancelado_por = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let query = 'UPDATE reservas SET estado = $1';
      const values = [estado, id];
      
      if (estado === 'cancelada') {
        query += ', fecha_cancelacion = CURRENT_TIMESTAMP, cancelado_por = $3';
        values.splice(2, 0, cancelado_por);
        
        // Obtener barbero_id
        const reserva = await client.query('SELECT barbero_id FROM reservas WHERE id = $1', [id]);
        if (reserva.rows.length > 0) {
          await client.query('UPDATE barberos SET citas_canceladas = citas_canceladas + 1 WHERE id = $1', 
            [reserva.rows[0].barbero_id]);
        }
      } else if (estado === 'completada') {
        // Obtener barbero_id
        const reserva = await client.query('SELECT barbero_id FROM reservas WHERE id = $1', [id]);
        if (reserva.rows.length > 0) {
          await client.query('UPDATE barberos SET citas_completadas = citas_completadas + 1 WHERE id = $1', 
            [reserva.rows[0].barbero_id]);
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

  static async delete(id) {
    const query = 'DELETE FROM reservas WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

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
}

module.exports = Reservation;