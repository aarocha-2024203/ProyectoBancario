'use strict'

import mongoose from "mongoose";

const accountLockSchema  = mongoose.Schema({
    accountId: {
        type: String, // Cambiado a String para el formato ACC-830-001
        required: [true, 'La cuenta es requerida']
    },
    userId: {
        type: String, // Cambiado a String para el formato USR-001
        required: [true, 'El usuario es requerido']
    },
    lockReason: {
        type: String,
        required: [true, 'El motivo del bloqueo es requerido'],
        enum: {
            values: ['fraude', 'deuda', 'seguridad', 'solicitud_cliente', 'inactividad'],
            message: 'Motivo de bloqueo no válido'
        }
    },
    description: {
        type: String,
        trim: true
    },
    lockDate: {
        type: Date,
        default: Date.now
    },
    unlockDate: {
        type: Date
    },
    lockedBy: {
        type: String // También debe ser String si quien bloquea es un USR-
    },
    unlockedBy: {
  type: String,
  validate: {
    validator: function(v) {
      if (!v) return true; // permite null/undefined
      return v === 'sistema' || v.startsWith('usr_');
    },
    message: 'El ID del desbloqueador debe empezar con usr_ o ser "sistema"'
  }
},
    status: {
        type: String,
        enum: {
            values: ['bloqueado', 'desbloqueado'],
            message: 'Estado no válido'
        },
        default: 'bloqueado'
    },
    automatic: {
        type: Boolean,
        default: false
    },
    failedAttempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

accountLockSchema.index({ accountId: 1 });
accountLockSchema.index({ userId: 1 });
accountLockSchema.index({ status: 1 });
accountLockSchema.index({ lockDate: -1 });

export default mongoose.model('AccountLock', accountLockSchema);