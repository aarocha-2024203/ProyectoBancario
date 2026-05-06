import { Schema, model } from 'mongoose';

const withdrawalSchema = Schema({
    // Siguiendo el audio: Formato String para ACC-830-001
    accountNumber: {
        type: String,
        required: [true, 'El número de cuenta es obligatorio']
    },
    amount: {
        type: Number,
        required: [true, 'El monto es obligatorio']
    },
    currencyCode: {
        type: String,
        default: ''
    },
    // Siguiendo el audio: Formato String para USR-XXXX
    userId: {
        type: String, 
        required: [true, 'El ID del usuario es requerido']
    },
    description: {
        type: String,
        default: 'Retiro en efectivo'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true, 
    versionKey: false 
});

// Índice para acelerar la búsqueda por cuenta en el historial
withdrawalSchema.index({ accountNumber: 1 });

export default model('Withdrawal', withdrawalSchema);