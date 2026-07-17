const cors = require('cors');
const config = require('../config/config');

// Configuration CORS sécurisée
const corsOptions = {
    // Origines autorisées (à configurer selon l'environnement)
    origin: (origin, callback) => {
        // En développement, autoriser toutes les origines
        if (config.server.environment === 'development') {
            return callback(null, true);
        }
        
        // En production, définir les domaines autorisés
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'https://votre-domaine.com',
            'https://www.votre-domaine.com'
        ];
        
        // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par la politique CORS'));
        }
    },
    
    // Méthodes HTTP autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    // Headers autorisés
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],
    
    // Headers exposés au client
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'Link'
    ],
    
    // Autoriser les cookies/credentials
    credentials: true,
    
    // Cache du preflight en secondes
    maxAge: 86400, // 24 heures
    
    // Répondre aux requêtes OPTIONS preflight
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Middleware CORS personnalisé avec gestion d'erreurs
const corsHandler = (req, res, next) => {
    cors(corsOptions)(req, res, (err) => {
        if (err) {
            console.error('Erreur CORS:', err.message);
            return res.status(403).json({
                success: false,
                message: 'Accès refusé par la politique CORS',
                origin: req.get('Origin') || 'inconnu'
            });
        }
        next();
    });
};

// Middleware pour gérer les requêtes preflight complexes
const preflightHandler = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
};

module.exports = {
    corsHandler,
    preflightHandler,
    corsOptions
};