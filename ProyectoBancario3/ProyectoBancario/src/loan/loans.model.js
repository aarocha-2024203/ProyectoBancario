'use strict'

import mongoose from "mongoose";

const loanSchema  = mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'El usuario es requerido']
    },
    // numero de cuenta para desembolso
    accountNumber: {
        type: String,
        required: [true, 'El número de cuenta es requerido']
    },
    // id de cuenta para pagos
    requestedAmount: {
        type: Number,
        required: [true, 'El monto solicitado es requerido'],
        min: [0, 'El monto debe ser positivo']
    },
    // monto aprobado 
    approvedAmount: {
        type: Number,
        min: [0, 'El monto debe ser positivo']
    },
    // tasa de interes
    interestRate: {
        type: Number,
        min: [0, 'La tasa debe ser positiva'],
        max: [100, 'La tasa no puede exceder 100%']
    },
    // plazo en meses
    termMonths: {
        type: Number,
        min: [1, 'El plazo debe ser al menos 1 mes']
    },
    // cuota mensual
    monthlyPayment: {
        type: Number,
        min: [0, 'La cuota debe ser positiva']
    },
    // saldo pendiente
    outstandingBalance: {
        type: Number,
        default: 0
    },
    // fecha de solicitud
    requestDate: {
        type: Date,
        default: Date.now
    },
    // fecha de aprobacion
    approvalDate: {
        type: Date
    },
    // fecha de pago
    disbursementDate: {
        type: Date
    },
    // estado
    status: {
        type: String,
        enum: {
            values: ['solicitado', 'aprobado', 'rechazado', 'desembolsado', 'pagado', 'vencido'],
            message: 'Estado no válido'
        },
        default: 'solicitado'
    },
    // motivo del prestamo
    loanPurpose: {
        type: String,
        trim: true,
        maxLength: [200, 'El motivo no puede exceder 200 caracteres']
    },
    // id del usuario que aprueba el prestamo
    approvedByUserId: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
});

loanSchema.index({ userId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ requestDate: -1 });

export default mongoose.model('Loan', loanSchema);
