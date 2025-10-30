const pool = require('../config/database');

(async () => {
  try {
    console.log('🧨 Borrando todas las tablas...');
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    console.log('✅ Base de datos limpiada correctamente.');
  } catch (err) {
    console.error('❌ Error limpiando la base:', err.message);
  } finally {
    await pool.end();
  }
})();
