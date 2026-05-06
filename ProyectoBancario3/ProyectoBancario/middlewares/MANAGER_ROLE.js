'use strict';

export const MANAGER_ROLE_PERMISSIONS = {
    accountLock: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Bloquear cuentas, ver bloqueos y cambiar estado a desbloqueado'
    },
    accounts: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Crear cuentas, ver todas, editar límites de retiro e interés'
    },
    accountStatement: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Ver y generar estados de cuenta'
    },
    cards: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Crear, leer y actualizar tarjetas (cambiar estado)'
    },
    coins: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Crear monedas y actualizar tasas de cambio (operación diaria)'
    },
    loans: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Crear, leer, validar y completar préstamos'
    },
    notifications: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Gestión completa de notificaciones'
    },
    transactions: {
        create: true,
        read: true,
        update: true,
        delete: false,
        description: 'Crear transacciones, validar y cambiar estado'
    }
};

export const verifyManagerPermission = (entity, action) => {
    const permissions = MANAGER_ROLE_PERMISSIONS[entity];
    if (!permissions) {
        console.warn(`Entity ${entity} not found in MANAGER permissions`);
        return false;
    }
    return permissions[action] === true;
};