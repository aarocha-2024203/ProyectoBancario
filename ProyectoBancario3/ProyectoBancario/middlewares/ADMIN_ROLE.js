'use strict';

export const ADMIN_ROLE_PERMISSIONS = {
    accountLock: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar bloqueos de cuenta'
    },
    accounts: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar cuentas'
    },
    accountStatement: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar estados de cuenta'
    },
    cards: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar tarjetas'
    },
    coins: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar monedas'
    },
    loans: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar préstamos'
    },
    notifications: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar notificaciones'
    },
    transactions: {
        create: true,
        read: true,
        update: true,
        delete: true,
        description: 'Crear, leer, actualizar y eliminar transacciones'
    }
};

export const verifyAdminPermission = (entity, action) => {
    const permissions = ADMIN_ROLE_PERMISSIONS[entity];
    if (!permissions) {
        console.warn(`Entity ${entity} not found in ADMIN permissions`);
        return false;
    }
    return permissions[action] === true;
};