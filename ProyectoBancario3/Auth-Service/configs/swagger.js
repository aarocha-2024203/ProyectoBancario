import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auth Service API - Sistema Bancario',
            version: '1.0.0',
            description: 'API de autenticación y gestión de usuarios del Sistema Bancario',
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
                    description: 'Ingresa el token JWT obtenido en /auth/login',
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
    console.log(`Swagger Auth-Service: http://localhost:${process.env.PORT}/api/v1/docs`);
};