'use strict';

import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxLength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: [50, 'El username no puede exceder 50 caracteres']
    },
    dpi: {
        type: String,
        required: [true, 'El DPI es requerido'],
        unique: true,
        trim: true,
        maxLength: [20, 'El DPI no puede exceder 20 caracteres']
    },
    address: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true,
        maxLength: [200, 'La dirección no puede exceder 200 caracteres']
    },
    phone: {
        type: String,
        required: [true, 'El celular es requerido'],
        trim: true,
        maxLength: [15, 'El celular no puede exceder 15 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El correo es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Correo no válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida']
    },
    jobName: {
        type: String,
        required: [true, 'El nombre de trabajo es requerido'],
        trim: true,
        maxLength: [100, 'El nombre de trabajo no puede exceder 100 caracteres']
    },
    monthlyIncome: {
        type: Number,
        required: [true, 'Los ingresos mensuales son requeridos'],
        min: [100, 'Los ingresos deben ser mayores o iguales a Q100']
    },
    role: {
        type: String,
        enum: {
            values: ['ADMIN', 'CLIENT'],
            message: 'Rol no válido'
        },
        default: 'CLIENT'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ dpi: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);