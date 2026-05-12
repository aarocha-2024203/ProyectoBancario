'use strict'

import mongoose from "mongoose";

const cardSchema = mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'El usuario es requerido'],
        match: [/^usr_[A-Za-z0-9]+$/, 'Formato de userId invalido']
    },
    cardNumber: {
        type: String,
        unique: true,
        sparse: true, // permite null para tarjetas pendientes
        trim: true,
        match: [/^\d{16}$/, 'El numero de tarjeta debe tener 16 digitos']
    },
    cardType: {
        type: String,
        required: [true, 'El tipo de tarjeta es requerido'],
        enum: {
            values: ['debito', 'credito'],
            message: 'Tipo de tarjeta no válido'
        }
    },
    cvv: {
        type: String,
        trim: true,
        match: [/^\d{3,4}$/, 'El CVV debe tener 3 o 4 digitos']
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    expirationDate: {
        type: Date,
    },
    creditLimit: {
        type: Number,
        min: [0, 'El límite debe ser positivo']
    },
    availableBalance: {
        type: Number,
        default: 0,
        min: [0, 'El saldo disponible debe ser positivo']
    },
    status: {
        type: String,
        enum: {
            values: ['activa', 'bloqueada', 'vencida', 'cancelada', 'pendiente', 'rechazada'],
            message: 'Estado no válido'
        },
        default: 'pendiente'
    },
    pin: {
        type: String,
        trim: true,
        match: [/^\d{4}$/, 'El PIN debe tener 4 digitos']
    },
    // Campo para la nota de solicitud del usuario
    requestNote: {
        type: String,
        trim: true,
        default: ''
    },
    // Nota del admin al aprobar o rechazar
    adminNote: {
        type: String,
        trim: true,
        default: ''
    },
    franchise: {
        type: String,
        enum: {
            values: ['VISA', 'MASTERCARD', 'AMEX'],
            message: 'Franquicia no válida'
        },
        default: 'VISA'
    }
}, {
    timestamps: true,
    versionKey: false
});

cardSchema.index({ userId: 1 });
cardSchema.index({ status: 1 });

export default mongoose.model('Card', cardSchema);