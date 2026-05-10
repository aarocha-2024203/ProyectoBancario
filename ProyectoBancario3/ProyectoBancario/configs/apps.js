'use strict'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { seedCommonCurrencies } from '../helpers/currency-seed.helper.js';
import { setupSwagger } from './swagger.js'; // ← NUEVO

import currencyRoutes from '../src/coins/coins.routes.js';
import accountsRoutes from '../src/accounts/accounts.routes.js';
import transactionRoutes from '../src/transaction/transaction.routes.js';
import cardRoutes from '../src/card/cards.routes.js';
import loanRoutes from '../src/loan/loans.routes.js';
import notificationRoutes from '../src/notifications/notifications.routes.js';
import accountStatementsRoutes from '../src/accountStatement/accountStatements.routes.js';
import accountLockRoutes from '../src/accountLock/accountLock.routes.js';
import withdrawalRoutes from '../src/withdrawal/withdrawal.routes.js';
import benefitsRoutes from '../src/benefits/benefits.routes.js';
import depositsRoutes from '../src/deposits/deposits.routes.js';
import { startUnlockScheduler } from '../helpers/unlock-scheduler.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
}

const routes = (app) => {
    app.use(`${BASE_PATH}/coins`, currencyRoutes);
    app.use(`${BASE_PATH}/accounts`, accountsRoutes);
    app.use(`${BASE_PATH}/transaction`, transactionRoutes);
    app.use(`${BASE_PATH}/cards`, cardRoutes);
    app.use(`${BASE_PATH}/loan`, loanRoutes);
    app.use(`${BASE_PATH}/notifications`, notificationRoutes);
    app.use(`${BASE_PATH}/accountStatements`, accountStatementsRoutes);
    app.use(`${BASE_PATH}/accountLocks`, accountLockRoutes);
    app.use(`${BASE_PATH}/withdrawal`, withdrawalRoutes);
    app.use(`${BASE_PATH}/service`, benefitsRoutes);
    app.use(`${BASE_PATH}/deposits`, depositsRoutes);

    app.get(`${BASE_PATH}/Health`, (request, response) => {
        response.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'Sistema Bancario API'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    });
}

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;
    app.set('trust proxy', 1);

    try {
        await dbConnection();
        await seedCommonCurrencies();
        startUnlockScheduler(); // ← agrega aquí
        middlewares(app);
        setupSwagger(app);
        routes(app);

        app.listen(PORT, () => {
            console.log(`Sistema Bancario Admin Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log(`Swagger docs:  http://localhost:${PORT}${BASE_PATH}/docs`);
        });
    } catch (error) {
        console.error(`Error starting Admin Server: ${error.message}`);
        process.exit(1);
    }
}