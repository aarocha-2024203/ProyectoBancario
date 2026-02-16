import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from './producto.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { isAdmin } from '../../middlewares/validation.js';



const router = Router();

// Público para logueados (Clientes y Admins pueden ver qué comprar)
router.get('/', [validateJWT], getProducts);

// Privado: Solo Admins pueden gestionar el catálogo
router.post('/', [validateJWT, isAdmin], createProduct);
router.put('/:id', [validateJWT, isAdmin], updateProduct);
router.delete('/:id', [validateJWT, isAdmin], deleteProduct);

export default router;