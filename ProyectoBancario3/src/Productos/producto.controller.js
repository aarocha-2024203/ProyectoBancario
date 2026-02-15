'use strict';

import Product from './producto.model.js';

// Crear producto (Solo ADMIN)
export const createProduct = async (req, res) => {
    try {
        const data = req.body;
        const product = new Product(data);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Producto/Servicio creado con éxito',
            product
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Listar todos (Para ADMIN y CLIENTE)
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Actualizar (Solo ADMIN)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });
        
        if (!updatedProduct) return res.status(404).json({ message: 'No encontrado' });

        res.status(200).json({ success: true, updatedProduct });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Eliminar (Soft Delete - Solo ADMIN)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndUpdate(id, { isActive: false });
        res.status(200).json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};