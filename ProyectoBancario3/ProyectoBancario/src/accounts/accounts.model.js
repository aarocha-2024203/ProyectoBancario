'use strict'

import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
    //numero de cuenta
    accountNumber: {
        type: String,
        required: [true, 'El numero de cuenta es requerido'],
        unique: true,
        trim: true,
        match: [/^[A-Z]{3}-\d{3}-\d{4}$/, 'El numero de cuenta debe tener formato ABC-000-0000']
    },
    //tipo de cuenta
    accountType: {
        type: String,
        required: [true, 'El tipo de cuenta es requerido'],
        enum: {
            values: ['ahorro', 'corriente', 'nomina'],
            message: 'Tipo de cuenta no valido'
        }
    },
    //saldo
    balance: {
        type: Number,
        default: 0.00,
        min: [0, 'El saldo no puede ser negativo']
    },
    //fecha de apertura
    openingDate: {
        type: Date,
        required: [true, 'La fecha de apertura es requerida'],
        default: Date.now
    },
    //estado de la cuenta
    status: {
        type: String,
        enum: {
            values: ['activa', 'inactiva', 'bloqueada'],
            message: 'Estado no valido'
        },
        default: 'activa'
    },
    //limite_retiro_diario
    dailyWithdrawalLimit: {
        type: Number,
        min: [0, 'El limite debe ser positivo']
    },
    //interes_anual
    annualInterestRate: {
        type: Number,
        min: [0, 'El interes debe ser positivo'],
        max: [100, 'El interes no puede exceder 100%']
    },
    currencyCode: {
        type: String,
        required: [true, 'El codigo de moneda es requerido'],
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'El codigo de moneda debe tener formato ABC']
    },
    //nombre del titular
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    //username del titular
    username: {
        type: String,
        required: [true, 'El username es requerido'],
        trim: true
    },
    //dpi de 13 digitos
    dpi: {
        type: String,
        required: [true, 'El DPI es requerido'],
        trim: true,
        match: [/^\d{13}$/, 'El DPI debe tener 13 digitos']
    },
    //direccion del titular
    address: {
        type: String,
        required: [true, 'La direccion es requerida'],
        trim: true
    },
    //celular del titular
    phone: {
        type: String,
        required: [true, 'El celular es requerido'],
        trim: true,
        match: [/^\d{8}$/, 'El celular debe tener 8 digitos']
    },
    //nombre del trabajo
    jobName: {
        type: String,
        required: [true, 'El nombre del trabajo es requerido'],
        trim: true
    },
    //ingreso mensual
    monthlyIncome: {
        type: Number,
        required: [true, 'El ingreso mensual es requerido'],
        min: [0, 'El ingreso mensual no puede ser negativo']
    },
    userId: {
        type: String,
        required: [true, 'El usuario es requerido']
    }
}, {
    timestamps: true,
    versionKey: false
});

accountSchema.index({ userId: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ accountType: 1 });

export default mongoose.model('Account', accountSchema);
