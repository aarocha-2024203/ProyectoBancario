'use strict';

import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del producto/servicio es requerido'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'La categoría es requerida (ej. Calzado, Barbería, etc.)'],
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    stock: {
        type: Number,
        default: 1, // Para servicios puede ser 1, para productos varía
        min: [0, 'El stock no puede ser negativo']
    },
    type: {
        type: String,
        enum: ['PRODUCTO', 'SERVICIO'],
        default: 'PRODUCTO'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('Product', productSchema);