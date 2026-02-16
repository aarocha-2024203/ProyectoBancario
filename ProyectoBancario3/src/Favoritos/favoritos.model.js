'use strict';

import mongoose from 'mongoose';

const favoritosSchema = mongoose.Schema({
    user: {
        type: String,  // Ahora acepta el ID de PostgreSQL
        required: [true, 'El usuario es requerido'],
        index: true
    },
    accountNumber: {
        type: String,
        required: [true, 'El número de cuenta es requerido'],
        trim: true,
        maxLength: [30, 'El número de cuenta no puede exceder 30 caracteres']
    },
    accountType: {
        type: String,
        required: [true, 'El tipo de cuenta es requerido'],
        enum: {
            values: ['AHORRO', 'MONETARIA', 'CORRIENTE'],
            message: 'Tipo de cuenta no válido'
        }
    },
    alias: {
        type: String,
        required: [true, 'El alias es requerido'],
        trim: true,
        maxLength: [50, 'El alias no puede exceder 50 caracteres']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Índices
favoritosSchema.index({ user: 1 });
favoritosSchema.index({ accountNumber: 1 });
favoritosSchema.index({ user: 1, accountNumber: 1 }, { unique: true });

export default mongoose.model('Favorito', favoritosSchema);