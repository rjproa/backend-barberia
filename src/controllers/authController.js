const User = require('../models/user');
const Role = require('../models/role');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generar JWT Token
const generateToken = (userId, roleId, roleName) => {
  return jwt.sign(
    { 
      id: userId, 
      rol_id: roleId,
      rol_nombre: roleName 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ============================================
// REGISTRO DE USUARIOS
// ============================================
exports.register = async (req, res) => {
  try {
    const { rol_id, nombre, telefono, contraseña } = req.body;

    // Validaciones
    if (!rol_id || !nombre || !telefono || !contraseña) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos: rol_id, nombre, telefono, contraseña'
      });
    }

    // Validar longitud de contraseña
    if (contraseña.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar que el rol exista
    const role = await Role.findById(rol_id);
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }

    // Validar que el teléfono no exista
    const telefonoExists = await User.telefonoExists(telefono);
    if (telefonoExists) {
      return res.status(400).json({
        success: false,
        error: 'El teléfono ya está registrado'
      });
    }

    // Crear usuario (la contraseña se encripta en el modelo)
    const user = await User.create({ rol_id, nombre, telefono, contraseña });

    // Generar token
    const token = generateToken(user.id, user.rol_id, role.nombre);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          telefono: user.telefono,
          rol_id: user.rol_id,
          rol_nombre: role.nombre,
          fecha_registro: user.fecha_registro
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario',
      message: error.message
    });
  }
};

// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {
  try {
    const { telefono, contraseña } = req.body;

    // Validaciones
    if (!telefono || !contraseña) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono y contraseña son requeridos'
      });
    }

    // Buscar usuario por teléfono (con contraseña)
    const user = await User.findByTelefonoWithPassword(telefono);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user.id, user.rol_id, user.rol_nombre);

    // Remover contraseña de la respuesta
    const { contraseña: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PERFIL DEL USUARIO AUTENTICADO
// ============================================
exports.getProfile = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil',
      message: error.message
    });
  }
};

// ============================================
// ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    const userId = req.user.id;

    // Validar que al menos un campo esté presente
    if (!nombre && !telefono) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Validar teléfono único si se está actualizando
    if (telefono) {
      const telefonoExists = await User.telefonoExists(telefono, userId);
      if (telefonoExists) {
        return res.status(400).json({
          success: false,
          error: 'El teléfono ya está registrado por otro usuario'
        });
      }
    }

    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (telefono) updates.telefono = telefono;

    const user = await User.update(userId, updates);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'No se realizaron cambios'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil',
      message: error.message
    });
  }
};

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
exports.changePassword = async (req, res) => {
  try {
    const { contraseña_actual, contraseña_nueva } = req.body;
    const userId = req.user.id;

    // Validaciones
    if (!contraseña_actual || !contraseña_nueva) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (contraseña_nueva.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener usuario con contraseña
    const user = await User.findByTelefonoWithPassword(
      (await User.findById(userId)).telefono
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(contraseña_actual, user.contraseña);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    await User.updatePassword(userId, contraseña_nueva);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña',
      message: error.message
    });
  }
};

// ============================================
// VERIFICAR TOKEN
// ============================================
exports.verifyToken = async (req, res) => {
  try {
    // Si llegamos aquí, el token ya fue validado por el middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user,
        authenticated: true
      }
    });
  } catch (error) {
    console.error('Error en verifyToken:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar token',
      message: error.message
    });
  }
};