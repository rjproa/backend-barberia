const pool = require('../config/database');

class Service {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        duracion INTEGER,
        activo BOOLEAN DEFAULT true
      );
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Tabla servicios creada/verificada');
    } catch (error) {
      console.error('❌ Error creando tabla servicios:', error.message);
      throw error;
    }
  }

  static async create({ nombre, descripcion, precio, duracion }) {
    const query = `
      INSERT INTO servicios (nombre, descripcion, precio, duracion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [nombre, descripcion, precio, duracion];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM servicios ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findActive() {
    const query = 'SELECT * FROM servicios WHERE activo = true ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM servicios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.nombre !== undefined) {
      fields.push(`nombre = $${paramCount++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${paramCount++}`);
      values.push(data.descripcion);
    }
    if (data.precio !== undefined) {
      fields.push(`precio = $${paramCount++}`);
      values.push(data.precio);
    }
    if (data.duracion !== undefined) {
      fields.push(`duracion = $${paramCount++}`);
      values.push(data.duracion);
    }
    if (data.activo !== undefined) {
      fields.push(`activo = $${paramCount++}`);
      values.push(data.activo);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE servicios 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM servicios WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async toggleActive(id) {
    const query = `
      UPDATE servicios 
      SET activo = NOT activo
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Service;