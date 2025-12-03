require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.RAILWAY_TCP_PROXY_DOMAIN,
  port: parseInt(process.env.RAILWAY_TCP_PROXY_PORT, 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000, // 15 segundos
});

(async () => {
  console.log('🔌 Intentando conectar...');
  console.log(`   Host: ${process.env.RAILWAY_TCP_PROXY_DOMAIN}:${process.env.RAILWAY_TCP_PROXY_PORT}`);

  try {
    const client = await pool.connect();
    console.log('✅ ¡CONEXIÓN EXITOSA!');

    const result = await client.query('SELECT NOW(), version()');
    console.log('📊 Servidor:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    console.log('⏰ Hora:', result.rows[0].now);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔍 Causas posibles:');
    console.error('   1. TCP Proxy no está habilitado en Railway');
    console.error('   2. Firewall bloqueando el puerto 20618');
    console.error('   3. Credenciales incorrectas');
    console.error('   4. Base de datos pausada/apagada');
    await pool.end();
    process.exit(1);
  }
})();