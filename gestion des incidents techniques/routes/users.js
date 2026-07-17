const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../controllers/userController');

// Middleware
const { 
    authenticate, 
    authorize, 
    authorizeOwnerOrRole,
    extractPagination,
    logSensitiveAction 
} = require('../middleware/auth');

const {
    validateUtilisateur,
    validateUtilisateurUpdate,
    validateTechnicien,
    validateTechnicienUpdate,
    validateId,
    validateSearch
} = require('../middleware/validation');

/**
 * @route   GET /api/users
 * @desc    Obtenir tous les utilisateurs (avec pagination et filtres)
 * @access  Private (Gestionnaire uniquement)
 * @query   ?type=UTILISATEUR|TECHNICIEN|GESTIONNAIRE&search=term&page=1&limit=10
 */
router.get('/', 
    authenticate,
    authorize('GESTIONNAIRE'),
    extractPagination,
    userController.getAllUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Rechercher des utilisateurs
 * @access  Private (Gestionnaire uniquement)
 * @query   ?q=searchTerm&type=UTILISATEUR|TECHNICIEN|GESTIONNAIRE&page=1&limit=10
 */
router.get('/search', 
    authenticate,
    authorize('GESTIONNAIRE'),
    extractPagination,
    validateSearch,
    userController.searchUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Obtenir les statistiques des utilisateurs par type
 * @access  Private (Gestionnaire uniquement)
 */
router.get('/stats', 
    authenticate,
    authorize('GESTIONNAIRE'),
    userController.getUserStats
);

/**
 * @route   GET /api/users/technicians/available
 * @desc    Obtenir tous les techniciens disponibles
 * @access  Private (Gestionnaire et Technicien)
 * @query   ?specialite=specialite
 */
router.get('/technicians/available', 
    authenticate,
    authorize('GESTIONNAIRE', 'TECHNICIEN'),
    userController.getAvailableTechnicians
);

/**
 * @route   GET /api/users/departments
 * @desc    Obtenir tous les départements existants
 * @access  Private (Gestionnaire uniquement)
 */
router.get('/departments', 
    authenticate,
    authorize('GESTIONNAIRE'),
    userController.getDepartments
);

/**
 * @route   GET /api/users/specialities
 * @desc    Obtenir toutes les spécialités des techniciens
 * @access  Private (Gestionnaire uniquement)
 */
router.get('/specialities', 
    authenticate,
    authorize('GESTIONNAIRE'),
    userController.getSpecialities
);

/**
 * @route   POST /api/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (Gestionnaire uniquement)
 */
router.post('/', 
    authenticate,
    authorize('GESTIONNAIRE'),
    (req, res, next) => {
        // Choisir la validation selon le type d'utilisateur
        const { type_personne } = req.body;
        
        if (type_personne === 'TECHNICIEN') {
            return validateTechnicien[0](req, res, next);
        } else {
            return validateUtilisateur[0](req, res, next);
        }
    },
    logSensitiveAction('CREATE_USER'),
    userController.createUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.get('/:id', 
    authenticate,
    validateId,
    authorizeOwnerOrRole('GESTIONNAIRE'),
    userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.put('/:id', 
    authenticate,
    validateId,
    authorizeOwnerOrRole('GESTIONNAIRE'),
    (req, res, next) => {
        // Validation légère pour les mises à jour
        validateUtilisateurUpdate[0](req, res, next);
    },
    logSensitiveAction('UPDATE_USER'),
    userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Gestionnaire uniquement)
 */
router.delete('/:id', 
    authenticate,
    validateId,
    authorize('GESTIONNAIRE'),
    logSensitiveAction('DELETE_USER'),
    userController.deleteUser
);

/**
 * @route   GET /api/users/:id/dashboard
 * @desc    Obtenir le tableau de bord d'un utilisateur
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.get('/:id/dashboard', 
    authenticate,
    validateId,
    authorizeOwnerOrRole('GESTIONNAIRE'),
    userController.getUserDashboard
);

/**
 * @route   PATCH /api/users/:id/availability
 * @desc    Changer la disponibilité d'un technicien
 * @access  Private (Propriétaire technicien ou Gestionnaire)
 */
router.patch('/:id/availability', 
    authenticate,
    validateId,
    (req, res, next) => {
        // Vérifier que c'est le technicien lui-même ou un gestionnaire
        if (req.userType === 'GESTIONNAIRE' || 
            (req.userType === 'TECHNICIEN' && req.userId.toString() === req.params.id)) {
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
        });
    },
    logSensitiveAction('TOGGLE_AVAILABILITY'),
    userController.toggleTechnicianAvailability
);

module.exports = router;