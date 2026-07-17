const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des middlewares personnalisés
const {
    corsHandler,
    preflightHandler,
    errorHandler,
    notFoundHandler,
    sanitizeInput,
    payloadSizeLimit,
    requestLogger,
    securityHeaders
} = require('./middleware');

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const materielRoutes = require('./routes/materiel');
const demandeRoutes = require('./routes/demandes');
const interventionRoutes = require('./routes/interventions');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

// Import de la configuration
const config = require('./config/config');
const { testConnection } = require('./config/database');

// Créer l'application Express
const app = express();

// Trust proxy (nécessaire si derrière un reverse proxy comme Nginx)
app.set('trust proxy', 1);

// Middleware de sécurité Helmet (doit être en premier)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Headers de sécurité personnalisés
app.use(securityHeaders);

// Middleware CORS
app.use(corsHandler);

// Gestion des requêtes preflight
app.use(preflightHandler);

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Exclure certaines routes du rate limiting
        const excludedPaths = ['/api/health', '/api/ping'];
        return excludedPaths.some(path => req.path.startsWith(path));
    }
});

app.use(globalLimiter);

// Limitation de la taille des payloads
app.use(payloadSizeLimit('10mb'));

// Middleware de parsing
app.use(express.json({ 
    limit: '10mb',
    strict: true
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Sanitization des entrées
app.use(sanitizeInput);

// Logging des requêtes (seulement en développement)
if (config.server.environment === 'development') {
    app.use(requestLogger);
}

// Routes de santé et informations système
app.get('/api/health', async (req, res) => {
    try {
        // Tester la connexion à la base de données
        const dbConnected = await testConnection();
        
        res.json({
            success: true,
            message: 'API fonctionnelle',
            timestamp: new Date().toISOString(),
            environment: config.server.environment,
            database: dbConnected ? 'connected' : 'disconnected',
            version: require('./package.json').version
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Service indisponible',
            timestamp: new Date().toISOString(),
            database: 'error'
        });
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ 
        success: true, 
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

// Route d'information sur l'API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API de Gestion des Incidents Techniques',
        version: require('./package.json').version,
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            materiel: '/api/materiel',
            demandes: '/api/demandes',
            interventions: '/api/interventions',
            notifications: '/api/notifications',
            reports: '/api/reports'
        },
        timestamp: new Date().toISOString()
    });
});

// Routes principales de l'API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materiel', materielRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Redirection de la racine vers l'API
app.get('/', (req, res) => {
    res.redirect('/api');
});

// Middleware pour les routes non trouvées (doit être après toutes les routes)
app.use(notFoundHandler);

// Middleware de gestion d'erreurs global (doit être en dernier)
app.use(errorHandler);

module.exports = app;