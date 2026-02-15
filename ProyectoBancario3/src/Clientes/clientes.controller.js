'use strict';

import User from './clientes.model.js';
import bcrypt from 'bcryptjs';

// Listar usuarios
export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive = true, role } = req.query;
        
        const filter = { isActive };
        if (role) filter.role = role;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const users = await User.find(filter)
            .select('-password')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort(options.sort);

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener los usuarios',
            error: error.message
        });
    }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener el usuario',
            error: error.message
        });
    }
};

// Crear usuario (solo CLIENT por defecto, ADMIN debe crearse manualmente en DB)
export const createUser = async (req, res) => {
  try {
    console.log('BODY RECIBIDO:', req.body);

    const userData = req.body;

    if (userData.monthlyIncome < 100) {
      return res.status(400).json({
        success: false,
        message: 'Los ingresos mensuales deben ser mayores o iguales a Q100'
      });
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
    userData.role = 'CLIENT';

    const user = new User(userData);

    const savedUser = await user.save();

    console.log('USUARIO GUARDADO EN MONGO:', savedUser);

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('ERROR MONGODB:', error);

    res.status(400).json({
      success: false,
      message: 'Error al crear el usuario',
      error: error.message
    });
  }
};

// Actualizar usuario (sin DPI ni password)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // No permitir actualizar DPI
        if (updateData.dpi) {
            delete updateData.dpi;
        }

        // No permitir actualizar password aquí
        if (updateData.password) {
            delete updateData.password;
        }

        // No permitir cambiar rol a ADMIN
        if (updateData.role === 'ADMIN') {
            delete updateData.role;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el usuario',
            error: error.message
        });
    }
};

// Eliminar usuario (soft delete)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir eliminar ADMINs
        if (user.role === 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar un usuario administrador'
            });
        }

        // Soft delete
        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar el usuario',
            error: error.message
        });
    }
};