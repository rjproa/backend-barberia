const pool = require('../config/database');

class BarberUnavailability {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS barberos_indisponibilidad (
        id SERIAL PRIMARY KEY,
        barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        hora_inicio TIME,
        hora_fin TIME,
        motivo VARCHAR(100),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_barberos_indisponibilidad 
      ON barberos_indisponibilidad(barbero_id, fecha, hora_inicio);
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Tabla barberos_indisponibilidad creada/verificada');
    } catch (error) {
      console.error('❌ Error creando tabla barberos_indisponibilidad:', error.message);
      throw error;
    }
  }

  static async create({ barbero_id, fecha, hora_inicio, hora_fin, motivo }) {
    const query = `
      INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [barbero_id, fecha, hora_inicio, hora_fin, motivo];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByBarber(barbero_id, fecha_inicio = null, fecha_fin = null) {
    let query = `
      SELECT * FROM barberos_indisponibilidad
      WHERE barbero_id = $1
    `;
    const values = [barbero_id];
    let paramCount = 2;

    if (fecha_inicio) {
      query += ` AND fecha >= $${paramCount++}`;
      values.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ` AND fecha <= $${paramCount++}`;
      values.push(fecha_fin);
    }

    query += ' ORDER BY fecha, hora_inicio';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findByDate(fecha) {
    const query = `
      SELECT 
        bi.*,
        b.nombre_artistico as barbero_nombre
      FROM barberos_indisponibilidad bi
      JOIN barberos b ON bi.barbero_id = b.id
      WHERE bi.fecha = $1
      ORDER BY bi.barbero_id, bi.hora_inicio
    `;
    const result = await pool.query(query, [fecha]);
    return result.rows;
  }

  static async isBarberAvailable(barbero_id, fecha, hora) {
    const query = `
      SELECT * FROM barberos_indisponibilidad
      WHERE barbero_id = $1
      AND fecha = $2
      AND (
        (hora_inicio IS NULL) 
        OR 
        ($3 >= hora_inicio AND $3 < hora_fin)
      )
    `;
    const result = await pool.query(query, [barbero_id, fecha, hora]);
    return result.rows.length === 0; // true si no hay indisponibilidad
  }

  static async delete(id) {
    const query = 'DELETE FROM barberos_indisponibilidad WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByBarberAndDate(barbero_id, fecha) {
    const query = 'DELETE FROM barberos_indisponibilidad WHERE barbero_id = $1 AND fecha = $2 RETURNING *';
    const result = await pool.query(query, [barbero_id, fecha]);
    return result.rows;
  }
}

module.exports = BarberUnavailability;