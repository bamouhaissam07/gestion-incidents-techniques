// Point d'entrée pour tous les middlewares
const auth = require('./auth');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const corsHandler = require('./corsHandler');

module.exports = {
    // Middlewares d'authentification et autorisation
    ...auth,
    
    // Middlewares de validation
    ...validation,
    
    // Middlewares de gestion d'erreurs
    ...errorHandler,
    
    // Middlewares CORS
    ...corsHandler
};