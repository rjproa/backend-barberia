const pool = require('../config/database');

class Role {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL
      );
      
      -- Insertar roles por defecto si no existen
      INSERT INTO roles (nombre) VALUES 
        ('cliente'),
        ('barbero'),
        ('admin')
      ON CONFLICT (nombre) DO NOTHING;
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Tabla roles creada/verificada');
    } catch (error) {
      console.error('❌ Error creando tabla roles:', error.message);
      throw error;
    }
  }

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