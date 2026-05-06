import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ProyectoBancario API - Sistema Bancario',
            version: '1.0.0',
            description: 'API principal del Sistema Bancario: cuentas, transacciones, tarjetas, préstamos, depósitos, retiros y más',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/api/v1`,
                description: 'Servidor de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el token JWT obtenido en Auth-Service /auth/login',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Swagger ProyectoBancario: http://localhost:${process.env.PORT}/api/v1/docs`);
};