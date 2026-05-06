'use strict'

import mongoose from "mongoose";

const currencySchema = mongoose.Schema({
    code: {
        type: String,
        required: [true, 'El código de moneda es requerido'],
        unique: true,
        uppercase: true,
        trim: true,
        maxLength: [3, 'El código debe tener máximo 3 caracteres']
    },
    name: {
        type: String,
        required: [true, 'El nombre de la moneda es requerido'],
        trim: true,
        maxLength: [75, 'El nombre no puede exceder 75 caracteres']
    },
    symbol: {
        type: String,
        required: [true, 'El símbolo es requerido'],
        trim: true,
        maxLength: [5, 'El símbolo no puede exceder 5 caracteres']
    },
    exchangeRate: {
        type: Number,
        required: [true, 'La tasa de cambio es requerida'],
        min: [0, 'La tasa debe ser mayor a 0']
    },
    baseCurrency: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: {
            values: ['activa', 'inactiva'],
            message: 'Estado no válido'
        },
        default: 'activa'
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false
});

currencySchema.index({ status: 1 });

export default mongoose.model('Currency', currencySchema);