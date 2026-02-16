'use strict';

import { Router } from 'express';
import {
    getCuentas,
    getCuentaById,
    createCuenta,
    updateCuenta,
    deleteCuenta
} from './cuentas.controller.js';

const router = Router();

// Rutas principales para cuentas
router.get('/', getCuentas);              // Listar cuentas (con paginación y filtros)
router.get('/:id', getCuentaById);        // Obtener una cuenta específica
router.post('/', createCuenta);           // Crear nueva cuenta
router.put('/:id', updateCuenta);         // Actualizar datos de la cuenta (no saldo)
router.delete('/:id', deleteCuenta);      // Cancelar cuenta (soft delete)

export default router;