'use strict'

import mongoose from "mongoose";
const transactionSchema = mongoose.Schema({
    //cuenta de origen
    sourceAccountNumber: {
        type: String,
        trim: true
    },

    //cuenta de destino
    destinationAccountNumber: {
        type: String,
        trim: true
    },
    //tipo de transaccion
    transactionType: {
        type: String,
        required: [true, 'El tipo de transaccion es requerido'],
        enum: {
            values: ['deposito', 'retiro', 'transferencia', 'pago_servicio', 'pago_prestamo'],
            message: 'Tipo de transacción no válido'
        }
    },
    //monto
    amount: {
        type: Number,
        required: [true, 'El monto es requerido'],
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    //codigo de moneda
    currencyCode: {
        type: String,
        required: [true, 'Currency code is required'],
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Currency code must have format ABC']
    },
    //fecha de transaccion
    transactionDate: {
        type: Date,
        default: Date.now
    },
    //descripcion
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'Descripcion no puede exceder 200 caracteres']
    },
    status: {
        type: String,
        enum: {
            values: ['exitosa', 'pendiente', 'rechazada', 'reversada'],
            message: 'Status no válido'
        },
        default: 'exitosa'
    },
    //balance antes de la transaccion
    previousBalance: {
        type: Number,
        default: 0
    },
    //balance despues de la transaccion
    newBalance: {
        type: Number,
        default: 0
    },
    //usuario que ejecuta la transaccion
    executedByUserId: {
        type: String,
        required: [true, 'Executing user is required']
    },
    //marca si la transaccion queda guardada en favoritos
    favorito: {
        type: Boolean,
        default: false
    },
    //alias para favoritos
    alias: {
        type: String,
        trim: true,
        maxLength: [80, 'El alias no puede exceder 80 caracteres'],
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

transactionSchema.index({ sourceAccountNumber: 1 });
transactionSchema.index({ destinationAccountNumber: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ executedByUserId: 1, favorito: 1 });

export default mongoose.model('Transaction', transactionSchema);
