const express = require('express');
const router = express.Router();

// Controllers
const materielController = require('../controllers/materielController');

// Middleware
const { 
    authenticate, 
    authorize, 
    extractPagination,
    logSensitiveAction 
} = require('../middleware/auth');

const {
    validateMateriel,
    validateMaterielUpdate,
    validateId,
    validateSearch,
    validateStatutFilter,
    handleValidationErrors
} = require('../middleware/validation');

const { body } = require('express-validator');

/**
 * @route   GET /api/materiel
 * @desc    Obtenir tout le matériel (avec pagination et filtres)
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?statut=EN_SERVICE|EN_PANNE|EN_MAINTENANCE|HORS_SERVICE&search=term&emplacement=location&page=1&limit=10
 */
router.get('/', 
    authenticate,
    extractPagination,
    validateStatutFilter,
    materielController.getAllMateriel
);

/**
 * @route   GET /api/materiel/search
 * @desc    Rechercher du matériel
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?q=searchTerm&statut=EN_SERVICE&page=1&limit=10
 */
router.get('/search', 
    authenticate,
    extractPagination,
    validateSearch,
    validateStatutFilter,
    materielController.searchMateriel
);

/**
 * @route   GET /api/materiel/stats
 * @desc    Obtenir les statistiques globales du matériel
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/stats', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    materielController.getGlobalMaterielStats
);

/**
 * @route   GET /api/materiel/emplacements
 * @desc    Obtenir tous les emplacements
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/emplacements', 
    authenticate,
    materielController.getEmplacements
);

/**
 * @route   GET /api/materiel/attention
 * @desc    Obtenir le matériel nécessitant une attention (en panne/maintenance)
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/attention', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    materielController.getMaterielAttention
);

/**
 * @route   GET /api/materiel/maintenance-report
 * @desc    Obtenir le rapport de maintenance préventive
 * @access  Private (Gestionnaire uniquement)
 */
router.get('/maintenance-report', 
    authenticate,
    authorize('GESTIONNAIRE'),
    materielController.getMaintenanceReport
);

/**
 * @route   GET /api/materiel/statut/:statut
 * @desc    Obtenir le matériel par statut
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/statut/:statut', 
    authenticate,
    extractPagination,
    [
        // Validation du paramètre statut
        require('express-validator').param('statut')
            .isIn(['EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE'])
            .withMessage('Statut invalide'),
        handleValidationErrors
    ],
    materielController.getMaterielByStatut
);

/**
 * @route   GET /api/materiel/emplacement/:emplacement
 * @desc    Obtenir le matériel par emplacement
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/emplacement/:emplacement', 
    authenticate,
    extractPagination,
    materielController.getMaterielByEmplacement
);

/**
 * @route   GET /api/materiel/numero-serie/:numeroSerie
 * @desc    Trouver du matériel par numéro de série
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/numero-serie/:numeroSerie', 
    authenticate,
    materielController.findByNumeroSerie
);

/**
 * @route   POST /api/materiel
 * @desc    Créer un nouveau matériel
 * @access  Private (Gestionnaire uniquement)
 */
router.post('/', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateMateriel,
    logSensitiveAction('CREATE_MATERIEL'),
    materielController.createMateriel
);

/**
 * @route   GET /api/materiel/:id
 * @desc    Obtenir un matériel par ID
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/:id', 
    authenticate,
    validateId,
    materielController.getMaterielById
);

/**
 * @route   PUT /api/materiel/:id
 * @desc    Mettre à jour un matériel
 * @access  Private (Gestionnaire uniquement)
 */
router.put('/:id', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateId,
    validateMaterielUpdate,
    logSensitiveAction('UPDATE_MATERIEL'),
    materielController.updateMateriel
);

/**
 * @route   DELETE /api/materiel/:id
 * @desc    Supprimer un matériel
 * @access  Private (Gestionnaire uniquement)
 */
router.delete('/:id', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateId,
    logSensitiveAction('DELETE_MATERIEL'),
    materielController.deleteMateriel
);

/**
 * @route   PATCH /api/materiel/:id/statut
 * @desc    Changer le statut d'un matériel
 * @access  Private (Gestionnaire et Technicien)
 */
router.patch('/:id/statut', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    validateId,
    [
        body('statut')
            .isIn(['EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE'])
            .withMessage('Statut invalide'),
        handleValidationErrors
    ],
    logSensitiveAction('CHANGE_MATERIEL_STATUS'),
    materielController.changeStatut
);

/**
 * @route   GET /api/materiel/:id/history
 * @desc    Obtenir l'historique des demandes pour un matériel
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/:id/history', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    validateId,
    extractPagination,
    materielController.getMaterielHistory
);

/**
 * @route   GET /api/materiel/:id/stats
 * @desc    Obtenir les statistiques d'un matériel
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/:id/stats', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    validateId,
    materielController.getMaterielStats
);

module.exports = router;