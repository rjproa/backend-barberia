const pool = require('../config/database');

class Barber {


  static async create({ usuario_id, nombre_artistico, especialidad }) {
    const query = `
      INSERT INTO barberos (usuario_id, nombre_artistico, especialidad)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [usuario_id, nombre_artistico, especialidad];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT b.*, u.nombre as usuario_nombre, u.telefono
      FROM barberos b
      LEFT JOIN usuarios u ON b.usuario_id = u.id
      ORDER BY b.id
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT b.*, u.nombre as usuario_nombre, u.telefono
      FROM barberos b
      LEFT JOIN usuarios u ON b.usuario_id = u.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAvailable() {
    const query = `
      SELECT b.*, u.nombre as usuario_nombre
      FROM barberos b
      LEFT JOIN usuarios u ON b.usuario_id = u.id
      WHERE b.disponible = true
      ORDER BY b.nombre_artistico
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.nombre_artistico !== undefined) {
      fields.push(`nombre_artistico = $${paramCount++}`);
      values.push(data.nombre_artistico);
    }
    if (data.especialidad !== undefined) {
      fields.push(`especialidad = $${paramCount++}`);
      values.push(data.especialidad);
    }
    if (data.disponible !== undefined) {
      fields.push(`disponible = $${paramCount++}`);
      values.push(data.disponible);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE barberos 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStats(id, type) {
    let query;
    switch (type) {
      case 'total':
        query = 'UPDATE barberos SET total_citas = total_citas + 1 WHERE id = $1 RETURNING *';
        break;
      case 'completada':
        query = 'UPDATE barberos SET citas_completadas = citas_completadas + 1 WHERE id = $1 RETURNING *';
        break;
      case 'cancelada':
        query = 'UPDATE barberos SET citas_canceladas = citas_canceladas + 1 WHERE id = $1 RETURNING *';
        break;
      default:
        return null;
    }

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM barberos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Barber;