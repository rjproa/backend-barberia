const User = require('../models/user');
const Role = require('../models/role');

// Crear nuevo usuario
exports.create = async (req, res) => {
  try {
    const { rol_id, nombre, telefono, contraseña } = req.body;

    // Validaciones
    if (!rol_id || !nombre || !contraseña) {
      return res.status(400).json({
        success: false,
        error: 'Rol, nombre y contraseña son requeridos'
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

    // Validar que el teléfono no exista (si se proporciona)
    if (telefono) {
      const telefonoExists = await User.telefonoExists(telefono);
      if (telefonoExists) {
        return res.status(400).json({
          success: false,
          error: 'El teléfono ya está registrado'
        });
      }
    }

    // Crear usuario
    const user = await User.create({ rol_id, nombre, telefono, contraseña });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error en create user:', error);
    
    // Manejo de errores específicos de PostgreSQL
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario',
      message: error.message
    });
  }
};

// Obtener todos los usuarios
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error en getAll users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
};

// Obtener usuario por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
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
    console.error('Error en getById user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el usuario',
      message: error.message
    });
  }
};

// Obtener usuarios por rol
exports.getByRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    
    // Validar que el rol exista
    const role = await Role.findById(rol_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }

    const users = await User.findByRol(rol_id);
    
    res.json({
      success: true,
      rol: role.nombre,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error en getByRol user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios por rol',
      message: error.message
    });
  }
};

// Obtener usuario por teléfono (útil para login)
exports.getByTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;
    const user = await User.findByTelefono(telefono);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado con ese teléfono'
      });
    }

    // Remover la contraseña de la respuesta (por seguridad)
    const { contraseña, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en getByTelefono user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el usuario',
      message: error.message
    });
  }
};

// Actualizar usuario
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que el usuario existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validar rol si se está actualizando
    if (updates.rol_id) {
      const role = await Role.findById(updates.rol_id);
      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'El rol especificado no existe'
        });
      }
    }

    // Validar teléfono único si se está actualizando
    if (updates.telefono) {
      const telefonoExists = await User.telefonoExists(updates.telefono, id);
      if (telefonoExists) {
        return res.status(400).json({
          success: false,
          error: 'El teléfono ya está registrado por otro usuario'
        });
      }
    }

    const user = await User.update(id, updates);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'No se realizaron cambios'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error en update user:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario',
      message: error.message
    });
  }
};

// Actualizar contraseña
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { contraseña_actual, contraseña_nueva } = req.body;

    if (!contraseña_actual || !contraseña_nueva) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    // Verificar que el usuario existe y obtener su contraseña
    const user = await User.findByTelefono(
      (await User.findById(id))?.telefono
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    // NOTA: En producción, deberías usar bcrypt.compare
    if (user.contraseña !== contraseña_actual) {
      return res.status(401).json({
        success: false,
        error: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    // NOTA: En producción, deberías encriptar con bcrypt.hash
    const updatedUser = await User.updatePassword(id, contraseña_nueva);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error en updatePassword user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar contraseña',
      message: error.message
    });
  }
};

// Eliminar usuario
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.delete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error en delete user:', error);
    
    // Si hay restricciones de clave foránea
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el usuario porque tiene registros asociados (reservas, etc.)'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario',
      message: error.message
    });
  }
};

// Obtener estadísticas de usuarios por rol
exports.getStats = async (req, res) => {
  try {
    const stats = await User.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error en getStats user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};

// Contar usuarios por rol
exports.countByRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    
    // Validar que el rol exista
    const role = await Role.findById(rol_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }

    const count = await User.countByRol(rol_id);
    
    res.json({
      success: true,
      rol: role.nombre,
      total: count
    });
  } catch (error) {
    console.error('Error en countByRol user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al contar usuarios',
      message: error.message
    });
  }
};