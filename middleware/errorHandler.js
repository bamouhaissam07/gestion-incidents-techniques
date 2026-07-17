const config = require('../config/config');

// Classe personnalisée pour les erreurs d'API
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Middleware principal de gestion d'erreurs
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Logger l'erreur (en production, utiliser un service de logging comme Winston)
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.userId || 'anonymous',
        timestamp: new Date().toISOString()
    });

    // Erreur de validation Mongoose/Sequelize
    if (err.name === 'ValidationError') {
        const message = 'Erreur de validation des données';
        error = new ApiError(400, message);
    }

    // Erreur de clé dupliquée (MySQL)
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Ressource déjà existante';
        error = new ApiError(409, message);
    }

    // Erreur de contrainte de clé étrangère (MySQL)
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = 'Référence vers une ressource inexistante';
        error = new ApiError(400, message);
    }

    // Erreur de JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token d\'accès invalide';
        error = new ApiError(401, message);
    }

    // Token JWT expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token d\'accès expiré';
        error = new ApiError(401, message);
    }

    // Erreur de cast (ID invalide)
    if (err.name === 'CastError') {
        const message = 'Identifiant invalide';
        error = new ApiError(400, message);
    }

    // Erreur de connexion à la base de données
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        const message = 'Erreur de connexion à la base de données';
        error = new ApiError(503, message);
    }

    // Erreur de fichier trop volumineux
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'Fichier trop volumineux';
        error = new ApiError(413, message);
    }

    // Erreur de syntaxe JSON
    if (err.type === 'entity.parse.failed') {
        const message = 'Format JSON invalide';
        error = new ApiError(400, message);
    }

    // Erreur de limite de taux
    if (err.message && err.message.includes('Too many requests')) {
        const message = 'Trop de requêtes, veuillez réessayer plus tard';
        error = new ApiError(429, message);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur interne du serveur',
        ...(config.server.environment === 'development' && { 
            stack: err.stack,
            error: err 
        }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    });
};

// Middleware pour gérer les routes non trouvées
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.originalUrl} introuvable`;
    const error = new ApiError(404, message);
    next(error);
};

// Middleware pour gérer les erreurs asynchrones
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Gestionnaire d'erreurs non gérées (uncaught exceptions)
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error('Error:', err.name, err.message);
        console.error('Stack:', err.stack);
        
        process.exit(1);
    });
};

// Gestionnaire de rejets de promesses non gérées
const handleUnhandledRejection = (server) => {
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error('Error:', err.name, err.message);
        
        if (server) {
            server.close(() => {
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
};

// Gestionnaire d'arrêt gracieux
const handleGracefulShutdown = (server) => {
    const gracefulShutdown = (signal) => {
        console.log(`\n${signal} reçu. Arrêt gracieux en cours...`);
        
        if (server) {
            server.close(() => {
                console.log('💀 Serveur fermé');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Middleware de validation d'entrée sécurisée
const sanitizeInput = (req, res, next) => {
    // Supprimer les champs potentiellement dangereux
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key of dangerousFields) {
            delete obj[key];
        }
        
        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                obj[key] = sanitizeObject(obj[key]);
            }
        }
        
        return obj;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

// Middleware pour limiter la taille des payloads
const payloadSizeLimit = (limit = '10mb') => {
    return (req, res, next) => {
        const contentLength = req.get('content-length');
        
        if (contentLength) {
            const sizeInBytes = parseInt(contentLength);
            const limitInBytes = parseSize(limit);
            
            if (sizeInBytes > limitInBytes) {
                const error = new ApiError(413, `Payload trop volumineux. Maximum autorisé: ${limit}`);
                return next(error);
            }
        }
        
        next();
    };
};

// Fonction utilitaire pour parser la taille
const parseSize = (size) => {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return value * units[unit];
};

// Middleware de logging des requêtes (pour debugging)
const requestLogger = (req, res, next) => {
    if (config.server.environment === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
        
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Body:', JSON.stringify(req.body, null, 2));
        }
    }
    
    next();
};

// Middleware de sécurité pour les headers
const securityHeaders = (req, res, next) => {
    // Supprimer les headers qui révèlent des informations sur le serveur
    res.removeHeader('X-Powered-By');
    
    // Ajouter des headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CSP pour les API (restrictif)
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    
    next();
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler,
    handleUncaughtException,
    handleUnhandledRejection,
    handleGracefulShutdown,
    sanitizeInput,
    payloadSizeLimit,
    requestLogger,
    securityHeaders
};