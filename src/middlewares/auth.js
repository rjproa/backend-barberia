const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// Verifica que el usuario esté autenticado (tiene un token válido)
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si existe el token
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Token no proporcionado'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar que el usuario exista
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Agregar usuario al request
      req.user = {
        id: decoded.id,
        rol_id: decoded.rol_id,
        rol_nombre: decoded.rol_nombre
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error en la autenticación',
      message: error.message
    });
  }
};

// ============================================
// MIDDLEWARE DE AUTORIZACIÓN POR ROLES
// ============================================
// Verifica que el usuario tenga uno de los roles permitidos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.rol_nombre)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}. Tu rol: ${req.user.rol_nombre}`
      });
    }

    next();
  };
};

// ============================================
// MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
// ============================================
// Intenta autenticar, pero no bloquea si no hay token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
          req.user = {
            id: decoded.id,
            rol_id: decoded.rol_id,
            rol_nombre: decoded.rol_nombre
          };
        }
      } catch (error) {
        // Token inválido, pero continuamos sin usuario
      }
    }

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación opcional:', error);
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};