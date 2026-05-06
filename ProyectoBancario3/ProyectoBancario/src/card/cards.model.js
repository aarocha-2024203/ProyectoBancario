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
        required: [true, 'El numero de tarjeta es requerido'],
        unique: true,
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
        required: [true, 'El CVV es requerido'],
        trim: true,
        match: [/^\d{3,4}$/, 'El CVV debe tener 3 o 4 digitos']
    },
    //fecha de emision
    issueDate: {
        type: Date,
        default: Date.now
    },
    //fecha de vencimiento
    expirationDate: {
        type: Date,
        required: [true, 'La fecha de vencimiento es requerida']
    },
    //limite de credito (solo para tarjetas de credito)
    creditLimit: {
        type: Number,
        min: [0, 'El límite debe ser positivo']
    },
    //saldo disponible (solo para tarjetas de credito)
    availableBalance: {
        type: Number,
        default: 0,
        required: [true, 'El saldo disponible es requerido'],
        min: [100, 'El saldo disponible debe ser al menos 100']
    },
    status: {
        type: String,
        enum: {
            values: ['activa', 'bloqueada', 'vencida', 'cancelada'],
            message: 'Estado no válido'
        },
        default: 'activa'
    },
    pin: {
        type: String,
        required: [true, 'El PIN es requerido'],
        trim: true,
        match: [/^\d{4}$/, 'El PIN debe tener 4 digitos']
    }
}, {
    timestamps: true,
    versionKey: false
});

cardSchema.index({ userId: 1 });
cardSchema.index({ status: 1 });

export default mongoose.model('Card', cardSchema);
