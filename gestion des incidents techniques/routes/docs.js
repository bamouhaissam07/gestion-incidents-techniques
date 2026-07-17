const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const { specs } = require('../config/swagger');

// Configuration des options Swagger UI
const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
    },
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; }
    `,
    customSiteTitle: 'API Gestion des Incidents - Documentation'
};

// Route pour la documentation Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, swaggerOptions));

// Route pour obtenir le JSON de spécification OpenAPI
router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

module.exports = router;