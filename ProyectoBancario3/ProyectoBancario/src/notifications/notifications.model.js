'use strict'

import mongoose from "mongoose";

const notificationSchema = mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'El usuario es requerido']
    },
    // tipo de notificacion (alerta, confirmacion, informativa, seguridad)
    notificationType: {
        type: String,
        required: [true, 'El tipo de notificación es requerido'],
        enum: {
            values: ['alerta', 'confirmacion', 'informativa', 'seguridad'],
            message: 'Tipo de notificación no válido'
        }
    },
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxLength: [100, 'El título no puede exceder 100 caracteres']
    },
    message: {
        type: String,
        required: [true, 'El mensaje es requerido'],
        trim: true
    },
    channel: {
        type: String,
        enum: {
            values: ['email', 'sms'],
            message: 'Canal no válido'
        },
        default: 'email'
    },
    sentDate: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readDate: {
        type: Date
    },
    relatedTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    priority: {
        type: String,
        enum: {
            values: ['baja', 'media', 'alta'],
            message: 'Prioridad no válida'
        },
        default: 'media'
    },
        status: {
        type: String,
        enum: {
            values: ['activa', 'inactiva'],
            message: 'Estado no válido'
        },
        default: 'activa'
    }
}, {
    timestamps: true,
    versionKey: false
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ sentDate: -1 });
notificationSchema.index({ priority: 1 });

export default mongoose.model('Notification', notificationSchema);
