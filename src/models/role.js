const pool = require('../config/database');

class Role {


  static async findAll() {
    const query = 'SELECT * FROM roles ORDER BY id';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByName(nombre) {
    const query = 'SELECT * FROM roles WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }
}

module.exports = Role;