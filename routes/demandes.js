const express = require('express');
const router = express.Router();

// Controllers
const demandeController = require('../controllers/demandeController');

// Middleware
const { 
    authenticate, 
    authorize, 
    authorizeOwnerOrRole,
    extractPagination,
    logSensitiveAction 
} = require('../middleware/auth');

const {
    validateDemandeIntervention,
    validateDemandeUpdate,
    validateStatusChange,
    validateAssignation,
    validateId,
    validateSearch,
    validateStatutFilter,
    validateUrgenceFilter,
    validateDateRange
} = require('../middleware/validation');

/**
 * @route   GET /api/demandes
 * @desc    Obtenir toutes les demandes (filtré selon le rôle)
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?statut=CREEE&urgence=HAUTE&page=1&limit=10&date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/', 
    authenticate,
    extractPagination,
    validateStatutFilter,
    validateUrgenceFilter,
    validateDateRange,
    demandeController.getAllDemandes
);

/**
 * @route   GET /api/demandes/search
 * @desc    Rechercher des demandes
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?q=searchTerm&statut=CREEE&urgence=HAUTE&page=1&limit=10
 */
router.get('/search', 
    authenticate,
    extractPagination,
    validateSearch,
    validateStatutFilter,
    validateUrgenceFilter,
    demandeController.searchDemandes
);

/**
 * @route   GET /api/demandes/stats
 * @desc    Obtenir les statistiques des demandes
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/stats', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    demandeController.getDemandesStats
);

/**
 * @route   GET /api/demandes/dashboard
 * @desc    Obtenir le tableau de bord des demandes pour l'utilisateur connecté
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/dashboard', 
    authenticate,
    demandeController.getDashboard
);

/**
 * @route   GET /api/demandes/categories
 * @desc    Obtenir toutes les catégories utilisées
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/categories', 
    authenticate,
    demandeController.getCategories
);

/**
 * @route   GET /api/demandes/retard
 * @desc    Obtenir les demandes en retard
 * @access  Private (Gestionnaire et Technicien)
 */
router.get('/retard', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    demandeController.getDemandesEnRetard
);

/**
 * @route   GET /api/demandes/statut/:statut
 * @desc    Obtenir les demandes par statut
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/statut/:statut', 
    authenticate,
    extractPagination,
    [
        require('express-validator').param('statut')
            .isIn(['CREEE', 'ASSIGNEE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'RESOLUE', 'FERMEE'])
            .withMessage('Statut invalide'),
        require('../middleware/validation').handleValidationErrors
    ],
    demandeController.getDemandesByStatut
);

/**
 * @route   GET /api/demandes/utilisateur/:userId
 * @desc    Obtenir les demandes d'un utilisateur spécifique
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.get('/utilisateur/:userId', 
    authenticate,
    extractPagination,
    [
        require('express-validator').param('userId')
            .isInt({ min: 1 })
            .withMessage('ID utilisateur invalide'),
        require('../middleware/validation').handleValidationErrors
    ],
    demandeController.getDemandesUtilisateur
);

/**
 * @route   POST /api/demandes
 * @desc    Créer une nouvelle demande d'intervention
 * @access  Private (Utilisateur et Gestionnaire)
 */
router.post('/', 
    authenticate,
    authorize('UTILISATEUR', 'GESTIONNAIRE'),
    validateDemandeIntervention,
    logSensitiveAction('CREATE_DEMANDE'),
    demandeController.createDemande
);

/**
 * @route   GET /api/demandes/:id
 * @desc    Obtenir une demande par ID
 * @access  Private (Propriétaire, Technicien assigné, ou Gestionnaire)
 */
router.get('/:id', 
    authenticate,
    validateId,
    demandeController.getDemandeById
);

/**
 * @route   PUT /api/demandes/:id
 * @desc    Mettre à jour une demande d'intervention
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.put('/:id', 
    authenticate,
    validateId,
    validateDemandeUpdate,
    logSensitiveAction('UPDATE_DEMANDE'),
    demandeController.updateDemande
);

/**
 * @route   DELETE /api/demandes/:id
 * @desc    Supprimer une demande d'intervention
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.delete('/:id', 
    authenticate,
    validateId,
    logSensitiveAction('DELETE_DEMANDE'),
    demandeController.deleteDemande
);

/**
 * @route   PATCH /api/demandes/:id/statut
 * @desc    Changer le statut d'une demande
 * @access  Private (Selon le statut : Technicien pour accepter/résoudre, Gestionnaire pour assigner/refuser)
 */
router.patch('/:id/statut', 
    authenticate,
    validateId,
    validateStatusChange,
    logSensitiveAction('CHANGE_DEMANDE_STATUS'),
    demandeController.changeStatut
);

/**
 * @route   POST /api/demandes/:id/assigner
 * @desc    Assigner une demande à un technicien
 * @access  Private (Gestionnaire uniquement)
 */
router.post('/:id/assigner', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateId,
    validateAssignation,
    logSensitiveAction('ASSIGN_DEMANDE'),
    demandeController.assignerDemande
);

module.exports = router;