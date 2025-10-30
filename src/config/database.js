const { Pool } = require('pg');
require('dotenv').config();

// Verificar que exista la variable de entorno
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida en el archivo .env');
  console.error('Por favor verifica tu configuración de Railway');
  process.exit(1);
}

// Crear pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de conexión
pool.on('connect', () => {
  console.log('🔗 Nueva conexión al pool de PostgreSQL');
});

// Evento de error
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;