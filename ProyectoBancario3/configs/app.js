'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';

// Ensure models are registered before DB sync
import '../src/users/user.model.js';
import '../src/auth/role.model.js';

import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';

import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import userRoute from '../src/Clientes/clientes.routes.js';
import productoRoute from '../src/Productos/producto.routes.js';
import cuentasRoutes from '../src/Cuenta/cuentas.routes.js';
import transactionRoutes from '../src/Transacciones/transaction.routes.js';
import favoritosRoute from '../src/Favoritos/favoritos.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);
  app.use(`${BASE_PATH}/clientes`, userRoute);
  app.use(`${BASE_PATH}/productos`, productoRoute);
  app.use(`${BASE_PATH}/transactions`, transactionRoutes);
  app.use(`${BASE_PATH}/Cuenta`, cuentasRoutes);
  app.use(`${BASE_PATH}/favoritos`, favoritosRoute);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'Proyecto Bancario Authentication Service',
    });
  });

  app.use(notFound);
};

export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT;
  app.set('trust proxy', 1);

  try {
    await dbConnection();

    // Seed essential data (roles)
    const { seedRoles } = await import('../helpers/role-seed.js');
    await seedRoles();

    // Ensure admin user has ADMIN_ROLE
    const { ensureAdminUser } = await import('../helpers/admin-seed.js');
    await ensureAdminUser();

    middlewares(app);
    routes(app);

    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Proyecto Bancario Auth Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
    });
  } catch (err) {
    console.error(`Error starting Proyecto Bancario Auth Server: ${err.message}`);
    process.exit(1);
  }
};
