'use strict'

import mongoose from "mongoose";

const accountStatementSchema  = mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'La cuenta es requerida']
    },
    //periodo inicial
    periodStart: {
        type: Date,
        required: [true, 'La fecha de inicio es requerida']
    },
    //periodo final
    periodEnd: {
        type: Date,
        required: [true, 'La fecha de fin es requerida']
    },
    //saldo inicial
    openingBalance: {
        type: Number,
        default: 0
    },
    //saldo final
    closingBalance: {
        type: Number,
        default: 0
    },
    //total de depositos
    totalDeposits: {
        type: Number,
        default: 0
    },
    //total de retiros
    totalWithdrawals: {
        type: Number,
        default: 0
    },
    //  total de transferencias enviadas
    totalTransfersSent: {
        type: Number,
        default: 0
    },
    // total de transferencias recibidas
    totalTransfersReceived: {
        type: Number,
        default: 0
    },
    // total de pagos de servicios
    interestEarned: {
        type: Number,
        default: 0
    },
    // total de pagos de servicios
    feesCharged: {
        type: Number,
        default: 0
    },
    // fecha de generacion del estado de cuenta
    generationDate: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true,
    versionKey: false
});

accountStatementSchema.index({ accountId: 1 });
accountStatementSchema.index({ periodStart: 1, periodEnd: 1 });
accountStatementSchema.index({ generationDate: -1 });

export default mongoose.model('AccountStatement', accountStatementSchema);
