const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definida en el archivo .env');
  console.error('Por favor verifica tu configuración de Railway');
  // termina el proceso con valor de 1 - indica que terminó con un error
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo de espera de inactividad antes de terminar una conexión
  connectionTimeoutMillis: 2000, // tiempo que espera respuesta de la bd antes de mandar error de conexión
});

pool.on('connect', () => {
  console.log('Nueva conexión al pool de PostgreSQL');
});


pool.on('error', (err) => {
  console.error('Error inesperado en cliente de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;