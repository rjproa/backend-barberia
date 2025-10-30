const pool = require('../config/database');

class User {

  static async create({ rol_id, nombre, telefono, contraseña }) {
    const query = `
      INSERT INTO usuarios (rol_id, nombre, telefono, contraseña)
      VALUES ($1, $2, $3, $4)
      RETURNING id, rol_id, nombre, telefono, fecha_registro
    `;
    const values = [rol_id, nombre, telefono, contraseña];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    const query = `
      SELECT 
        u.id,
        u.rol_id,
        r.nombre as rol_nombre,
        u.nombre,
        u.telefono,
        u.fecha_registro
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.fecha_registro DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT 
        u.id,
        u.rol_id,
        r.nombre as rol_nombre,
        u.nombre,
        u.telefono,
        u.fecha_registro
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByRol(rol_id) {
    const query = `
      SELECT 
        u.id,
        u.rol_id,
        r.nombre as rol_nombre,
        u.nombre,
        u.telefono,
        u.fecha_registro
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.rol_id = $1
      ORDER BY u.nombre
    `;

    try {
      const result = await pool.query(query, [rol_id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }


  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.rol_id !== undefined) {
      fields.push(`rol_id = $${paramCount++}`);
      values.push(data.rol_id);
    }
    if (data.nombre !== undefined) {
      fields.push(`nombre = $${paramCount++}`);
      values.push(data.nombre);
    }
    if (data.telefono !== undefined) {
      fields.push(`telefono = $${paramCount++}`);
      values.push(data.telefono);
    }
    if (data.contraseña !== undefined) {
      fields.push(`contraseña = $${paramCount++}`);
      values.push(data.contraseña);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE usuarios 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, rol_id, nombre, telefono, fecha_registro
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(id, nuevaContraseña) {
    const query = `
      UPDATE usuarios 
      SET contraseña = $1
      WHERE id = $2
      RETURNING id, nombre
    `;

    try {
      const result = await pool.query(query, [nuevaContraseña, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async countByRol(rol_id) {
    const query = 'SELECT COUNT(*) as total FROM usuarios WHERE rol_id = $1';

    try {
      const result = await pool.query(query, [rol_id]);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw error;
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        r.nombre as rol,
        COUNT(u.id) as total
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      GROUP BY r.id, r.nombre
      ORDER BY r.id
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async telefonoExists(telefono, excludeId = null) {
    let query = 'SELECT id FROM usuarios WHERE telefono = $1';
    const values = [telefono];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;