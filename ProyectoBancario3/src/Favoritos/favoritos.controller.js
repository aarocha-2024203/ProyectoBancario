'use strict';

import Favorito from './favoritos.model.js';


export const createFavorito = async (req, res) => {
    try {
        const { accountNumber, accountType, alias } = req.body;

        if (!accountNumber || !accountType || !alias) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        const favorito = new Favorito({
            user: req.user.id,
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
            user: req.user.id,
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
            user: req.user.id,
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

        const favorito = await Favorito.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { alias },
            { new: true }
        );

        if (!favorito) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
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

        const favorito = await Favorito.findOne({
            _id: id,
            user: req.user.id
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
            user: req.user.id,
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
