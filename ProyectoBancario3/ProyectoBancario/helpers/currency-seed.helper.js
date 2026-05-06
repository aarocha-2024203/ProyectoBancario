'use strict'

import Currency from '../src/coins/coins.model.js';

const COMMON_CURRENCIES = [
    { code: 'GTQ', name: 'Quetzal', symbol: 'Q', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'MXN', name: 'Peso mexicano', symbol: '$', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'COP', name: 'Peso colombiano', symbol: '$', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'USD', name: 'Dolar estadounidense', symbol: '$', exchangeRate: 1, baseCurrency: true, status: 'activa' },
    { code: 'EUR', name: 'Euro', symbol: 'EUR', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'HNL', name: 'Lempira', symbol: 'L', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'PEN', name: 'Sol peruano', symbol: 'S/', exchangeRate: 1, baseCurrency: false, status: 'activa' },
    { code: 'JPY', name: 'Yen japones', symbol: 'JPY', exchangeRate: 1, baseCurrency: false, status: 'activa' }
];

export const seedCommonCurrencies = async () => {
    try {
        let created = 0;

        for (const currencyData of COMMON_CURRENCIES) {
            const existingCurrency = await Currency.findOne({ code: currencyData.code });
            if (existingCurrency) continue;

            await Currency.create(currencyData);
            created++;
        }

        if (created > 0) {
            console.log(`Monedas base creadas: ${created}`);
        } else {
            console.log('Monedas base ya estaban registradas');
        }
    } catch (error) {
        console.error('Error al seedear monedas base:', error.message);
        throw error;
    }
};
