require('dotenv').config();
const app = require('./app');
const pool = require('./src/config/database');

// Importar modelos
const User = require('./src/models/user');
const Role = require('./src/models/role');
const Barber = require('./src/models/barber');
const Service = require('./src/models/service');
const Product = require('./src/models/product');
const Reservation = require('./src/models/reservation');
const ReservationDetail = require('./src/models/reservationDetail');
const BarberUnavailability = require('./src/models/barberUnavailability');

const PORT = process.env.PORT || 3000;

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    
    // Crear tablas en orden de dependencias
    await Role.createTable();
    await User.createTable();
    await Barber.createTable();
    await Service.createTable();
    await Product.createTable();
    await Reservation.createTable();
    await ReservationDetail.createTable();
    await BarberUnavailability.createTable();
    
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    throw error;
  }
};

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    
    // Verificar conexión a PostgreSQL
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Conexión a PostgreSQL establecida');
    console.log('⏰ Hora del servidor:', result.rows[0].now);
    console.log('🗄️  PostgreSQL:', result.rows[0].version.split(' ')[1]);
    client.release();
    
    // Inicializar base de datos
    await initializeDatabase();
    
    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log('\n📋 Endpoints disponibles:');
      console.log('   • Usuarios:          /api/users');
      console.log('   • Roles:             /api/roles');
      console.log('   • Barberos:          /api/barbers');
      console.log('   • Servicios:         /api/services');
      console.log('   • Productos:         /api/products');
      console.log('   • Reservas:          /api/reservations');
      console.log('   • Indisponibilidad:  /api/unavailability');
      console.log('='.repeat(60) + '\n');
    });
   
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR FATAL AL INICIAR EL SERVIDOR');
    console.error('='.repeat(60));
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(60) + '\n');
    
    // Cerrar el pool de conexiones
    await pool.end();
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM recibido, cerrando servidor gracefully...');
  await pool.end();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT recibido, cerrando servidor gracefully...');
  await pool.end();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

// Iniciar la aplicación
startServer();