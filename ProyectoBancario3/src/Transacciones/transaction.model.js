'use strict';

import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        required: true,
        default: () => `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    type: {
        type: String,
        enum: {
            values: ['TRANSFER', 'DEPOSIT', 'PAYMENT', 'PURCHASE', 'REVERSAL'],
            message: 'Tipo de transacción no válido'
        },
        required: [true, 'El tipo de transacción es requerido']
    },
    fromAccount: {
        type: String,
        ref: 'Account',
        required: function() {
            return this.type === 'TRANSFER' || this.type === 'PAYMENT' || this.type === 'PURCHASE';
        }
    },
    toAccount: {
        type: String,
        ref: 'Account',
        required: function() {
            return this.type === 'TRANSFER' || this.type === 'DEPOSIT';
        }
    },
    amount: {
        type: Number,
        required: [true, 'El monto es requerido'],
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'COMPLETED', 'REVERSED', 'FAILED'],
            message: 'Estado no válido'
        },
        default: 'COMPLETED'
    },
    originalTransactionId: {
        type: String,
        ref: 'Transaction',
        required: function() {
            return this.type === 'REVERSAL';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // 30 días en segundos (TTL index)
    }
}, {
    timestamps: true,
    versionKey: false
});

transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ fromAccount: 1 });
transactionSchema.index({ toAccount: 1 });
transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ 'createdAt': 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Transaction', transactionSchema);