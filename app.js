const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const userRoutes = require('./src/routes/usersRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const barberRoutes = require('./src/routes/barberRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const productRoutes = require('./src/routes/productRoutes');
const reservationRoutes = require('./src/routes/reservationRoutes');
const unavailabilityRoutes = require('./src/routes/unavailabilityRoutes');

// Usar rutas
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/unavailability', unavailabilityRoutes);

// Ruta de prueba de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Barbería - Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      roles: '/api/roles',
      barbers: '/api/barbers',
      services: '/api/services',
      products: '/api/products',
      reservations: '/api/reservations',
      unavailability: '/api/unavailability'
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;