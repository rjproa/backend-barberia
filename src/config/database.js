const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones para Railway
const pool = new Pool({
  host: process.env.RAILWAY_TCP_PROXY_DOMAIN,
  port: parseInt(process.env.RAILWAY_TCP_PROXY_PORT, 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,

  // ========================================
  // CONFIGURACIÓN SSL PARA RAILWAY
  // ========================================
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // Configuración del pool
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 15000, // Timeout para establecer conexión (15 segundos)
});

// Event listeners para debugging
pool.on('connect', () => {
  console.log('🔗 Nueva conexión establecida con la base de datos');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
  process.exit(-1);
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('   ↳ Timestamp del servidor:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    return false;
  }
};

// Exportar el pool directamente (para compatibilidad)
module.exports = pool;

// También exportar con nombres (para importaciones destructuradas)
module.exports.pool = pool;
module.exports.testConnection = testConnection;