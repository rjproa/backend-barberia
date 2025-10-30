const User = require('../models/user');

class UserController {

  // GET - Obtener todos los usuarios
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener usuarios',
        message: error.message
      });
    }
  }

  // GET - Obtener usuario por ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error en getUserById:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener usuario',
        message: error.message
      });
    }
  }

  // POST - Crear nuevo usuario
  static async createUser(req, res) {
    try {
      const { name, email, password, phone, role } = req.body;

      // Validaciones
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      const newUser = await User.create({ name, email, password, phone, role });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });
    } catch (error) {
      console.error('Error en createUser:', error);

      if (error.message === 'El email ya está registrado') {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al crear usuario',
        message: error.message
      });
    }
  }

  // PUT - Actualizar usuario
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      const updatedUser = await User.update(id, { name, email, phone });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error en updateUser:', error);

      if (error.message === 'El email ya está en uso') {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al actualizar usuario',
        message: error.message
      });
    }
  }

  // DELETE - Eliminar usuario
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = await User.delete(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: deletedUser
      });
    } catch (error) {
      console.error('Error en deleteUser:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario',
        message: error.message
      });
    }
  }
}

module.exports = UserController;