require('dotenv').config();
const app = require('./app');
const pool = require('./src/config/database');


const PORT = process.env.PORT || 3000;


const startServer = async () => {
  try {
    console.log('Iniciando servidor...');
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL establecida');

    client.release();

    app.listen(PORT, () => {
      console.log('-----------------------------------------');
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('ERROR FATAL AL INICIAR EL SERVIDOR');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);

    await pool.end();
    process.exit(1);
  }
};

// cierre por servidor
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor gracefully...');
  await pool.end();
  console.log('Conexiones cerradas');
  process.exit(0);
});

// cierre por terminal
process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor gracefully...');
  await pool.end();
  console.log('Conexiones cerradas');
  process.exit(0);
});

startServer();