'use strict';

export const USER_ROLE_PERMISSIONS = {
    accountLock: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver si su cuenta está bloqueada',
        restriction: 'Solo su propia cuenta'
    },
    accounts: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver sus propias cuentas',
        restriction: 'Solo sus cuentas'
    },
    accountStatement: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver estados de sus cuentas',
        restriction: 'Solo sus estados'
    },
    cards: {
        create: false,
        read: false,
        update: false,
        delete: false,
        description: 'Sin acceso directo en este rol',
        restriction: 'N/A'
    },
    coins: {
        create: false,
        read: false,
        update: false,
        delete: false,
        description: 'Sin acceso: consulta a través de transacciones',
        restriction: 'N/A'
    },
    loans: {
        create: true,
        read: true,
        update: false,
        delete: false,
        description: 'Solicitar préstamos y ver sus propias solicitudes',
        restriction: 'Solo sus propios préstamos'
    },
    notifications: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: recibir y ver notificaciones',
        restriction: 'Solo sus notificaciones'
    },
    transactions: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver sus propias transacciones',
        restriction: 'Solo sus transacciones'
    }
};

export const verifyUserPermission = (entity, action) => {
    const permissions = USER_ROLE_PERMISSIONS[entity];
    if (!permissions) {
        console.warn(`Entity ${entity} not found in USER permissions`);
        return false;
    }
    return permissions[action] === true;
};

/**
 * Helper para validar que el usuario solo accede a sus propios datos
 * Usar en los controllers para verificar userId
 */
export const validateUserRestrictions = (requestUserId, targetUserId) => {
    return requestUserId === targetUserId;
};