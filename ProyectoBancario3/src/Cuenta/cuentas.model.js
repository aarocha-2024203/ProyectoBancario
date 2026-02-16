'use strict';
 
import mongoose from 'mongoose';
 
const cuentaSchema = mongoose.Schema({
    numeroCuenta: {
        type: String,
        required: [true, 'El número de cuenta es requerido'],
        unique: true,
        trim: true,
        uppercase: true,
        maxLength: [20, 'El número de cuenta no puede exceder 20 caracteres']
    },
    tipoCuenta: {
        type: String,
        required: [true, 'El tipo de cuenta es requerido'],
        enum: {
            values: ['AHORRO', 'CORRIENTE', 'PLAZO_FIJO', 'NOMINA', 'JUVENIL'],
            message: 'Tipo de cuenta no válido'
        },
        uppercase: true
    },
    moneda: {
        type: String,
        required: [true, 'La moneda es requerida'],
        enum: {
            values: ['GTQ', 'USD'],
            message: 'Moneda no válida'
        },
        default: 'GTQ',
        uppercase: true
    },
    saldo: {
        type: Number,
        required: [true, 'El saldo inicial es requerido'],
        min: [0, 'El saldo no puede ser negativo al crear la cuenta'],
        default: 0
    },
    saldoDisponible: {
        type: Number,
        default: 0
    },
    cliente: {
        type: String,  // ← CAMBIO AQUÍ
        required: [true, 'El cliente es requerido'],
        index: true
    },
    fechaApertura: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: {
            values: ['ACTIVA', 'INACTIVA', 'BLOQUEADA', 'CANCELADA'],
            message: 'Estado no válido'
        },
        default: 'ACTIVA',
        uppercase: true
    },
    tasaInteres: {
        type: Number,
        min: [0, 'La tasa de interés no puede ser negativa'],
        default: 0
    },
    limiteSobregiro: {
        type: Number,
        min: [0, 'El límite de sobregiro no puede ser negativo'],
        default: 0
    },
    ultimoMovimiento: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false
});
 
// Índices para búsquedas frecuentes
cuentaSchema.index({ numeroCuenta: 1 });
cuentaSchema.index({ cliente: 1 });
cuentaSchema.index({ tipoCuenta: 1 });
cuentaSchema.index({ estado: 1 });
cuentaSchema.index({ moneda: 1 });
 
export default mongoose.model('Cuenta', cuentaSchema);