const express = require('express');
const router = express.Router();

// Controllers
const interventionController = require('../controllers/interventionController');

// Middleware
const { 
    authenticate, 
    authorize, 
    extractPagination,
    logSensitiveAction 
} = require('../middleware/auth');

const {
    validateId,
    validateSearch,
    validateDateRange,
    handleValidationErrors
} = require('../middleware/validation');

const { body, param, query } = require('express-validator');

// Validation spécifique aux interventions
const validateIntervention = [
    body('id_demande')
        .isInt({ min: 1 })
        .withMessage('ID de demande invalide'),
    body('actions_prises')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Actions prises ne peut pas dépasser 1000 caractères'),
    body('pieces_remplacees')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Pièces remplacées ne peut pas dépasser 500 caractères'),
    body('probleme_resolu')
        .optional()
        .isBoolean()
        .withMessage('Problème résolu doit être true ou false'),
    body('date_intervention')
        .optional()
        .isISO8601()
        .withMessage('Date d\'intervention invalide (format ISO 8601)'),
    handleValidationErrors
];

const validateInterventionUpdate = [
    body('actions_prises')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Actions prises ne peut pas dépasser 1000 caractères'),
    body('pieces_remplacees')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Pièces remplacées ne peut pas dépasser 500 caractères'),
    body('probleme_resolu')
        .optional()
        .isBoolean()
        .withMessage('Problème résolu doit être true ou false'),
    body('date_intervention')
        .optional()
        .isISO8601()
        .withMessage('Date d\'intervention invalide (format ISO 8601)'),
    handleValidationErrors
];

/**
 * @route   GET /api/interventions
 * @desc    Obtenir toutes les interventions (filtré selon le rôle)
 * @access  Private (Technicien et Gestionnaire)
 * @query   ?technicien_id=1&probleme_resolu=true&date_debut=2024-01-01&date_fin=2024-12-31&page=1&limit=10
 */
router.get('/', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    extractPagination,
    validateDateRange,
    [
        query('technicien_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID technicien invalide'),
        query('demande_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID demande invalide'),
        query('probleme_resolu')
            .optional()
            .isBoolean()
            .withMessage('Problème résolu doit être true ou false'),
        handleValidationErrors
    ],
    interventionController.getAllInterventions
);

/**
 * @route   GET /api/interventions/search
 * @desc    Rechercher des interventions
 * @access  Private (Technicien et Gestionnaire)
 * @query   ?q=searchTerm&technicien_id=1&probleme_resolu=true&page=1&limit=10
 */
router.get('/search', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    extractPagination,
    validateSearch,
    [
        query('technicien_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID technicien invalide'),
        query('probleme_resolu')
            .optional()
            .isBoolean()
            .withMessage('Problème résolu doit être true ou false'),
        handleValidationErrors
    ],
    interventionController.searchInterventions
);

/**
 * @route   GET /api/interventions/stats
 * @desc    Obtenir les statistiques des interventions
 * @access  Private (Technicien et Gestionnaire)
 * @query   ?technicien_id=1&date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/stats', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    validateDateRange,
    [
        query('technicien_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID technicien invalide'),
        handleValidationErrors
    ],
    interventionController.getInterventionStats
);

/**
 * @route   GET /api/interventions/stats-by-technicien
 * @desc    Obtenir les statistiques par technicien
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/stats-by-technicien', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    interventionController.getStatsByTechnicien
);

/**
 * @route   GET /api/interventions/by-period
 * @desc    Obtenir les interventions par période
 * @access  Private (Gestionnaire uniquement)
 * @query   date_debut=2024-01-01&date_fin=2024-12-31 (requis)
 */
router.get('/by-period', 
    authenticate,
    authorize('GESTIONNAIRE'),
    [
        query('date_debut')
            .notEmpty()
            .isISO8601()
            .withMessage('Date de début requise (format ISO 8601)'),
        query('date_fin')
            .notEmpty()
            .isISO8601()
            .withMessage('Date de fin requise (format ISO 8601)'),
        handleValidationErrors
    ],
    interventionController.getInterventionsByPeriod
);

/**
 * @route   GET /api/interventions/top-pieces
 * @desc    Obtenir le top des pièces les plus remplacées
 * @access  Private (Gestionnaire uniquement)
 * @query   ?limit=10
 */
router.get('/top-pieces', 
    authenticate,
    authorize('GESTIONNAIRE'),
    [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limite doit être entre 1 et 50'),
        handleValidationErrors
    ],
    interventionController.getTopPiecesRemplacees
);
/**
 * @route   GET /api/interventions/technicien/:technicienId
 * @desc    Obtenir les interventions d'un technicien spécifique
 * @access  Private (Propriétaire technicien ou Gestionnaire)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31&probleme_resolu=true&page=1&limit=10
 */
router.get('/technicien/:technicienId', 
    authenticate,
    extractPagination,
    [
        param('technicienId')
            .isInt({ min: 1 })
            .withMessage('ID technicien invalide'),
        query('probleme_resolu')
            .optional()
            .isBoolean()
            .withMessage('Problème résolu doit être true ou false'),
        handleValidationErrors
    ],
    validateDateRange,
    interventionController.getInterventionsByTechnicien
);

/**
 * @route   GET /api/interventions/demande/:demandeId
 * @desc    Obtenir l'intervention d'une demande spécifique
 * @access  Private (Technicien et Gestionnaire)
 */
router.get('/demande/:demandeId', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    [
        param('demandeId')
            .isInt({ min: 1 })
            .withMessage('ID demande invalide'),
        handleValidationErrors
    ],
    interventionController.getInterventionByDemande
);

/**
 * @route   POST /api/interventions
 * @desc    Créer une nouvelle intervention
 * @access  Private (Technicien uniquement)
 */
router.post('/', 
    authenticate,
    authorize('TECHNICIEN'),
    validateIntervention,
    logSensitiveAction('CREATE_INTERVENTION'),
    interventionController.createIntervention
);

/**
 * @route   GET /api/interventions/:id
 * @desc    Obtenir une intervention par ID
 * @access  Private (Technicien assigné et Gestionnaire)
 */
router.get('/:id', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    validateId,
    interventionController.getInterventionById
);

/**
 * @route   PUT /api/interventions/:id
 * @desc    Mettre à jour une intervention
 * @access  Private (Technicien assigné et Gestionnaire)
 */
router.put('/:id', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    validateId,
    validateInterventionUpdate,
    logSensitiveAction('UPDATE_INTERVENTION'),
    interventionController.updateIntervention
);

/**
 * @route   DELETE /api/interventions/:id
 * @desc    Supprimer une intervention
 * @access  Private (Technicien assigné et Gestionnaire)
 */
router.delete('/:id', 
    authenticate,
    authorize('TECHNICIEN', 'GESTIONNAIRE'),
    validateId,
    logSensitiveAction('DELETE_INTERVENTION'),
    interventionController.deleteIntervention
);

module.exports = router;