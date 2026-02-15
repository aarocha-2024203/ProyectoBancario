'use strict';

import { Router } from 'express';
import {
    getFavoritos,
    getFavoritoById,
    createFavorito,
    updateFavorito,
    deleteFavorito,
    transferFromFavorito
} from './favoritos.controller.js';

const router = Router();

// Listar favoritos del usuario
router.get('/', getFavoritos);

// Obtener favorito por ID
router.get('/:id', getFavoritoById);

// Crear favorito
router.post('/', createFavorito);

// Actualizar alias del favorito
router.put('/:id', updateFavorito);

// Eliminar favorito (soft delete)
router.delete('/:id', deleteFavorito);

// Transferencia rápida desde favorito
router.post('/transfer/from-favorito', transferFromFavorito);

export default router;
