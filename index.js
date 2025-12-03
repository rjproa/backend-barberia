// ⚠️ IMPORTANTE: Cargar dotenv PRIMERO, antes que cualquier otra cosa
require('dotenv').config();

const app = require('./app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('\n🚀 Iniciando servidor...\n');

    // Verificar variables de entorno críticas
    console.log('📋 Verificando configuración...');
    const requiredVars = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }
    console.log('✅ Variables de entorno configuradas\n');

    // Probar conexión a PostgreSQL
    console.log('🔌 Conectando a PostgreSQL...');
    const client = await pool.connect();

    // Obtener información del servidor
    const result = await client.query('SELECT version(), NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');
    console.log(`📊 Versión: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`⏰ Hora del servidor: ${result.rows[0].now}\n`);

    client.release();

    // Iniciar servidor Express
    const server = app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║  ✅ SERVIDOR INICIADO CORRECTAMENTE   ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║  🌐 URL: http://localhost:${PORT.toString().padEnd(18)} ║`);
      console.log(`║  🏥 Health: http://localhost:${PORT}/api/health`.padEnd(41) + '║');
      console.log('║  📊 DB: PostgreSQL Railway (conectado) ║');
      console.log('╚════════════════════════════════════════╝\n');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} recibido, cerrando servidor gracefully...`);

      server.close(async () => {
        console.log('✅ Servidor HTTP cerrado');

        try {
          await pool.end();
          console.log('✅ Conexiones a DB cerradas');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error al cerrar conexiones:', error.message);
          process.exit(1);
        }
      });

      // Si después de 10 segundos no se cierra, forzar cierre
      setTimeout(() => {
        console.error('⏰ Timeout: Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    // Registrar manejadores de señales
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║  ❌ ERROR FATAL AL INICIAR SERVIDOR    ║');
    console.error('╚════════════════════════════════════════╝\n');
    console.error('📝 Mensaje:', error.message);

    if (error.code) {
      console.error('🔑 Código:', error.code);
    }

    // Mensajes de ayuda según el tipo de error
    if (error.message.includes('timeout')) {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Verifica que TCP Proxy esté habilitado en Railway');
      console.error('   2. Revisa tu conexión a internet');
      console.error('   3. Verifica que tu firewall no bloquee el puerto\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Ve a Railway → PostgreSQL → Settings → TCP Proxy');
      console.error('   2. Asegúrate de que esté habilitado');
      console.error('   3. Verifica el dominio y puerto en tu .env\n');
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Verifica POSTGRES_PASSWORD en tu .env');
      console.error('   2. Asegúrate de no tener espacios extras');
      console.error('   3. Verifica que la contraseña no tenga comillas\n');
    }

    console.error('📚 Stack completo:\n', error.stack);

    try {
      await pool.end();
    } catch (e) {
      // Ignorar errores al cerrar pool si no está inicializado
    }

    process.exit(1);
  }
};

// Manejo de promesas rechazadas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

startServer();