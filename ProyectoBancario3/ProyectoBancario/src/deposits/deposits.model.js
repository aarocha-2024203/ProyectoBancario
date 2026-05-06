'use strict';

import mongoose from 'mongoose';

const depositSchema = mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'El numero de cuenta es requerido'],
        trim: true,
        match: [/^[A-Z]{3}-\d{3}-\d{4}$/, 'El numero de cuenta debe tener formato ABC-000-0000']
    },
    amount: {
        type: Number,
        required: [true, 'El monto es requerido'],
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    currencyCode: {
        type: String,
        required: [true, 'El codigo de moneda es requerido'],
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'El codigo de moneda debe tener formato ABC']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'Descripcion no puede exceder 200 caracteres'],
        default: 'Deposito en cuenta'
    },
    status: {
        type: String,
        enum: {
            values: ['exitosa', 'reversada'],
            message: 'Estado no valido'
        },
        default: 'exitosa'
    },
    previousBalance: {
        type: Number,
        default: 0
    },
    newBalance: {
        type: Number,
        default: 0
    },
    executedByUserId: {
        type: String,
        required: [true, 'El usuario que ejecuta el deposito es requerido']
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    reversedAt: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

depositSchema.index({ accountNumber: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ createdAt: -1 });

export default mongoose.model('Deposit', depositSchema);
