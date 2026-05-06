'use strict';

export const ATM_ROLE_PERMISSIONS = {
    accountLock: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver cuentas bloqueadas'
    },
    accounts: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver cuentas asignadas al ATM'
    },
    accountStatement: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: consultar estados de cuenta'
    },
    cards: {
        create: false,
        read: false,
        update: false,
        delete: false,
        description: 'Sin acceso: uso limitado a ATM'
    },
    coins: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: consultar tasas de cambio'
    },
    loans: {
        create: false,
        read: true,
        update: false,
        delete: false,
        description: 'Solo lectura: ver préstamos de clientes'
    },
    notifications: {
        create: true,
        read: true,
        update: false,
        delete: false,
        description: 'Crear notificaciones de transacciones'
    },
    transactions: {
        create: true,
        read: true,
        update: false,
        delete: false,
        description: 'Crear retiros y depósitos, leer transacciones del ATM'
    }
};

export const verifyATMPermission = (entity, action) => {
    const permissions = ATM_ROLE_PERMISSIONS[entity];
    if (!permissions) {
        console.warn(`Entity ${entity} not found in ATM permissions`);
        return false;
    }
    return permissions[action] === true;
};