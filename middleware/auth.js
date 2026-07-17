const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Personne } = require('../models');

// Générer un token JWT
const generateToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: 'gestion-incidents-api'
    });
};

// Vérifier un token JWT
const verifyToken = (token) => {
    return jwt.verify(token, config.jwt.secret);
};

// Middleware d'authentification
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
        }
        
        const token = authHeader.substring(7); // Enlever 'Bearer '
        
        // Vérifier le token
        const decoded = verifyToken(token);
        
        // Récupérer les informations complètes de l'utilisateur
        const user = await Personne.getFullProfile(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur introuvable'
            });
        }
        
        // Ajouter les informations utilisateur à la requête
        req.user = user;
        req.userId = user.id_personne;
        req.userType = user.type_personne;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }
        
        console.error('Erreur d\'authentification:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

// Middleware de vérification des rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }
        
        if (!roles.includes(req.userType)) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé pour ce rôle'
            });
        }
        
        next();
    };
};

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres données
const authorizeOwnerOrRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }
        
        const resourceUserId = req.params.id || req.params.userId;
        
        // L'utilisateur peut accéder à ses propres données
        if (req.userId.toString() === resourceUserId.toString()) {
            return next();
        }
        
        // Ou avoir un des rôles autorisés
        if (roles.includes(req.userType)) {
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
        });
    };
};

// Middleware optionnel d'authentification (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            const user = await Personne.getFullProfile(decoded.id);
            
            if (user) {
                req.user = user;
                req.userId = user.id_personne;
                req.userType = user.type_personne;
            }
        }
        
        next();
    } catch (error) {
        // En cas d'erreur, continuer sans authentification
        next();
    }
};

// Fonction pour créer un token de réinitialisation de mot de passe
const generateResetToken = (userId) => {
    return jwt.sign(
        { 
            id: userId, 
            type: 'password_reset' 
        }, 
        config.jwt.secret, 
        { 
            expiresIn: '1h' // Token valide 1 heure
        }
    );
};

// Fonction pour vérifier un token de réinitialisation
const verifyResetToken = (token) => {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'password_reset') {
        throw new Error('Type de token invalide');
    }
    
    return decoded;
};

// Middleware de limitation du taux de requêtes pour les connexions
const loginRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const email = req.body.email;
        const key = `${ip}:${email}`;
        
        const now = Date.now();
        const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };
        
        // Réinitialiser si la fenêtre de temps est écoulée
        if (now > userAttempts.resetTime) {
            userAttempts.count = 0;
            userAttempts.resetTime = now + windowMs;
        }
        
        // Vérifier si la limite est dépassée
        if (userAttempts.count >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Trop de tentatives de connexion. Réessayez plus tard.',
                retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
            });
        }
        
        // Incrémenter le compteur
        userAttempts.count++;
        attempts.set(key, userAttempts);
        
        // Ajouter une fonction pour réinitialiser en cas de succès
        req.resetLoginAttempts = () => {
            attempts.delete(key);
        };
        
        next();
    };
};

// Middleware pour extraire les informations de pagination
const extractPagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 éléments
    const offset = (page - 1) * limit;
    
    req.pagination = {
        page,
        limit,
        offset
    };
    
    next();
};

// Middleware pour logger les actions sensibles
const logSensitiveAction = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Logger l'action si succès (status 2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[${new Date().toISOString()}] Action: ${action}, User: ${req.userId} (${req.userType}), IP: ${req.ip}`);
            }
            
            return originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    authorize,
    authorizeOwnerOrRole,
    optionalAuth,
    generateResetToken,
    verifyResetToken,
    loginRateLimit,
    extractPagination,
    logSensitiveAction
};