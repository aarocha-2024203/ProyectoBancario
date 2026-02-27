'use strict';

import Favorito from './favoritos.model.js';
import Account from '../Cuenta/cuentas.model.js';

export const createFavorito = async (req, res) => {
    try {
        const { accountNumber, accountType, alias } = req.body;

        if (!accountNumber || !accountType || !alias) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar que la cuenta existe y está activa
        const account = await Account.findOne({
            numeroCuenta: accountNumber,
            estado: 'ACTIVA'
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'La cuenta especificada no existe o está inactiva'
            });
        }

        // Validar que el tipo de cuenta coincida
        if (account.tipoCuenta !== accountType) {
            return res.status(400).json({
                success: false,
                message: `El tipo de cuenta no coincide. La cuenta ${accountNumber} es de tipo ${account.tipoCuenta}, no ${accountType}`
            });
        }

        // Verificar si ya existe un favorito activo con la misma cuenta para este usuario
        const existingFavorito = await Favorito.findOne({
            user: req.user.Id,
            accountNumber,
            isActive: true
        });

        if (existingFavorito) {
            return res.status(400).json({
                success: false,
                message: 'Ya tienes esta cuenta agregada como favorito'
            });
        }

        // Verificar si existe un favorito inactivo (soft deleted) y reactivarlo
        const deletedFavorito = await Favorito.findOne({
            user: req.user.Id,
            accountNumber,
            isActive: false
        });

        if (deletedFavorito) {
            // Reactivar favorito existente
            deletedFavorito.accountType = accountType;
            deletedFavorito.alias = alias;
            deletedFavorito.isActive = true;
            await deletedFavorito.save();

            return res.status(200).json({
                success: true,
                message: 'Favorito reactivado exitosamente',
                data: deletedFavorito
            });
        }

        // Crear nuevo favorito
        const favorito = new Favorito({
            user: req.user.Id,
            accountNumber,
            accountType,
            alias,
            isActive: true
        });

        await favorito.save();

        res.status(201).json({
            success: true,
            message: 'Favorito agregado exitosamente',
            data: favorito
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al agregar favorito',
            error: error.message
        });
    }
};

export const getFavoritos = async (req, res) => {
    try {
        const favoritos = await Favorito.find({
            user: req.user.Id,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: favoritos
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener favoritos',
            error: error.message
        });
    }
};

export const getFavoritoById = async (req, res) => {
    try {
        const { id } = req.params;

        const favorito = await Favorito.findOne({
            _id: id,
            user: req.user.Id,
            isActive: true
        });

        if (!favorito) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: favorito
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener favorito',
            error: error.message
        });
    }
};

export const updateFavorito = async (req, res) => {
    try {
        const { id } = req.params;
        const { alias } = req.body;

        // Validar que el alias esté presente
        if (!alias) {
            return res.status(400).json({
                success: false,
                message: 'El alias es obligatorio'
            });
        }

        // Validar formato de ObjectId de MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido. Debe proporcionar el ID del favorito (MongoDB ObjectId), no el número de cuenta'
            });
        }

        const favorito = await Favorito.findOneAndUpdate(
            { _id: id, user: req.user.Id, isActive: true },
            { alias },
            { new: true }
        );

        if (!favorito) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado o no tienes permisos para modificarlo'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Favorito actualizado exitosamente',
            data: favorito
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar favorito',
            error: error.message
        });
    }
};

export const deleteFavorito = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar formato de ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido. Debe proporcionar el ID del favorito (MongoDB ObjectId), no el número de cuenta'
            });
        }

        const favorito = await Favorito.findOne({
            _id: id,
            user: req.user.Id
        });

        if (!favorito) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        favorito.isActive = false;
        await favorito.save();

        res.status(200).json({
            success: true,
            message: 'Favorito eliminado exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar favorito',
            error: error.message
        });
    }
};

export const transferFromFavorito = async (req, res) => {
    try {
        const { favoriteId, amount } = req.body;

        const favorito = await Favorito.findOne({
            _id: favoriteId,
            user: req.user.Id,
            isActive: true
        });

        if (!favorito) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: `Transferencia realizada a ${favorito.alias}`,
            data: {
                accountNumber: favorito.accountNumber,
                accountType: favorito.accountType,
                amount
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error en la transferencia',
            error: error.message
        });
    }
};