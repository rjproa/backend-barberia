const pool = require('../config/database');

(async () => {
  try {
    console.log('🧨 Borrando todas las tablas...');

    // Drop schema
    await pool.query('DROP SCHEMA public CASCADE;');
    console.log('   ↳ Schema eliminado');

    // Recreate schema
    await pool.query('CREATE SCHEMA public;');
    console.log('   ↳ Schema recreado');

    console.log('✅ Base de datos limpiada correctamente.');
    console.log('💡 Ahora puedes ejecutar tu script SQL para crear las tablas.');

  } catch (err) {
    console.error('❌ Error limpiando la base:', err.message);
    console.error('\n🔍 Detalles del error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();