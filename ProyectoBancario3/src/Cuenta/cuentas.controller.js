'use strict';

import Cuenta from './cuentas.model.js';

// Listar cuentas (con paginación y filtros básicos)
export const getCuentas = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado = 'ACTIVA', tipoCuenta, cliente } = req.query;
        
        const filter = { estado };
        if (tipoCuenta) filter.tipoCuenta = tipoCuenta.toUpperCase();
        if (cliente) filter.cliente = cliente;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { fechaApertura: -1 },
            populate: { path: 'cliente', select: 'name dpi email' }
        };

        const cuentas = await Cuenta.find(filter)
            .populate(options.populate)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort(options.sort);

        const total = await Cuenta.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: cuentas,
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
            message: 'Error al obtener las cuentas',
            error: error.message
        });
    }
};

// Obtener cuenta por ID
export const getCuentaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cuenta = await Cuenta.findById(id)
            .populate('cliente', 'name dpi email');
        
        if (!cuenta) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: cuenta
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener la cuenta',
            error: error.message
        });
    }
};

// Crear cuenta nueva
export const createCuenta = async (req, res) => {
    try {
        const cuentaData = req.body;
        
        // Validaciones básicas adicionales
        if (!cuentaData.cliente) {
            return res.status(400).json({
                success: false,
                message: 'El ID del cliente es obligatorio'
            });
        }

        if (cuentaData.saldo < 0) {
            return res.status(400).json({
                success: false,
                message: 'El saldo inicial no puede ser negativo'
            });
        }

        // Por defecto
        cuentaData.estado = 'ACTIVA';
        cuentaData.saldoDisponible = cuentaData.saldo || 0;

        // Aquí podrías generar número de cuenta automático si no viene
        if (!cuentaData.numeroCuenta) {
            // Ejemplo muy básico – en producción usa algo más robusto
            const ultimo = await Cuenta.countDocuments() + 100000;
            cuentaData.numeroCuenta = `GTB${ultimo.toString().padStart(8, '0')}`;
        }

        const cuenta = new Cuenta(cuentaData);
        await cuenta.save();

        const cuentaResponse = await Cuenta.findById(cuenta._id)
            .populate('cliente', 'name dpi email');

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            data: cuentaResponse
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la cuenta',
            error: error.message
        });
    }
};

// Actualizar cuenta (sin modificar saldo directamente)
export const updateCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Proteger campos sensibles
        const camposProhibidos = ['saldo', 'saldoDisponible', 'numeroCuenta', 'cliente'];
        camposProhibidos.forEach(campo => {
            if (updateData[campo] !== undefined) delete updateData[campo];
        });

        const cuenta = await Cuenta.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('cliente', 'name dpi email');

        if (!cuenta) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta actualizada exitosamente',
            data: cuenta
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la cuenta',
            error: error.message
        });
    }
};

// Eliminar cuenta (soft delete → cambiar estado)
export const deleteCuenta = async (req, res) => {
    try {
        const { id } = req.params;

        const cuenta = await Cuenta.findById(id);

        if (!cuenta) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        if (cuenta.estado === 'CANCELADA') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta ya está cancelada'
            });
        }

        if (cuenta.saldo > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede cancelar una cuenta con saldo positivo'
            });
        }

        cuenta.estado = 'CANCELADA';
        await cuenta.save();

        res.status(200).json({
            success: true,
            message: 'Cuenta cancelada exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al cancelar la cuenta',
            error: error.message
        });
    }
};