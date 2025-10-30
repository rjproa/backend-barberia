const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

  // Crear tabla de usuarios
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin', 'barber')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `;

    try {
      await pool.query(query);
      console.log('✅ Tabla users creada o ya existe');
      return true;
    } catch (error) {
      console.error('❌ Error al crear tabla users:', error.message);
      throw error;
    }
  }

  // Crear un nuevo usuario
  static async create(userData) {
    const { name, email, password, phone, role = 'client' } = userData;

    // Validaciones básicas
    if (!name || !email || !password) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `;

    try {
      const result = await pool.query(query, [name, email, hashedPassword, phone, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Código de error para duplicados
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    const query = 'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por email (incluye password para login)
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async findAll() {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC';

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { name, email, phone } = userData;

    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          email = COALESCE($2, email), 
          phone = COALESCE($3, phone), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, phone, role, updated_at
    `;

    try {
      const result = await pool.query(query, [name, email, phone, id]);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El email ya está en uso');
      }
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, name, email';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Comparar contraseña
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar contraseña
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [hashedPassword, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;