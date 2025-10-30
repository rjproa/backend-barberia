const pool = require('../config/database');

class Product {

  static async create({ nombre, descripcion, precio, categoria }) {
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [nombre, descripcion, precio, categoria];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM productos ORDER BY categoria, nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findActive() {
    const query = 'SELECT * FROM productos WHERE activo = true ORDER BY categoria, nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM productos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCategory(categoria) {
    const query = 'SELECT * FROM productos WHERE categoria = $1 AND activo = true ORDER BY nombre';
    const result = await pool.query(query, [categoria]);
    return result.rows;
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
    if (data.categoria !== undefined) {
      fields.push(`categoria = $${paramCount++}`);
      values.push(data.categoria);
    }
    if (data.activo !== undefined) {
      fields.push(`activo = $${paramCount++}`);
      values.push(data.activo);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE productos 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM productos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async toggleActive(id) {
    const query = `
      UPDATE productos 
      SET activo = NOT activo
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Product;