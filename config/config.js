require('dotenv').config();

module.exports = {
    // Configuration du serveur
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },
    
    // Configuration JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_key_for_development_only',
        expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    
    // Configuration de la base de données
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    },
    
    // Configuration email
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@gestion-incidents.com'
    },
    
    // Configuration rate limiting — valeur élevée en dev pour ne pas bloquer les tests
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX || 100) * (process.env.NODE_ENV === 'development' ? 10 : 1)
    },
    
    // Configuration de sécurité
    security: {
        bcryptRounds: 12,
        maxLoginAttempts: 5,
        lockoutTime: 30 * 60 * 1000, // 30 minutes
        passwordMinLength: 8
    },
    
    // Configuration des uploads
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
        uploadDir: './uploads'
    },
    
    // Statuts et énumérations
    enums: {
        typePersonne: ['UTILISATEUR', 'TECHNICIEN', 'GESTIONNAIRE'],
        statutMateriel: ['EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE'],
        urgence: ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'],
        statutDemande: ['CREEE', 'ASSIGNEE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'RESOLUE', 'FERMEE'],
        typeNotification: ['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'AUTRE'],
        statutConversation: ['EN_COURS', 'ESCALADEE', 'TERMINEE']
    }
};