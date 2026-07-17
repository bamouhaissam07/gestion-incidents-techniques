const express = require('express');
const router = express.Router();

// Controllers
const notificationController = require('../controllers/notificationController');

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

// Validation spécifique aux notifications
const validateNotification = [
    body('message')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Le message doit contenir entre 1 et 500 caractères'),
    body('type')
        .isIn(['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'NOUVELLE_DEMANDE', 'INTERVENTION', 'ACCEPTATION', 'AUTRE'])
        .withMessage('Type de notification invalide'),
    body('id_demande')
        .isInt({ min: 1 })
        .withMessage('ID de demande invalide'),
    body('id_destinataire')
        .isInt({ min: 1 })
        .withMessage('ID de destinataire invalide'),
    handleValidationErrors
];

/**
 * @route   GET /api/notifications
 * @desc    Obtenir toutes les notifications (filtré selon le rôle)
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?type=ASSIGNATION&lue=false&date_debut=2024-01-01&date_fin=2024-12-31&page=1&limit=10
 */
router.get('/', 
    authenticate,
    extractPagination,
    validateDateRange,
    [
        query('type')
            .optional()
            .isIn(['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'NOUVELLE_DEMANDE', 'INTERVENTION', 'ACCEPTATION', 'AUTRE'])
            .withMessage('Type de notification invalide'),
        query('lue')
            .optional()
            .isBoolean()
            .withMessage('Lue doit être true ou false'),
        query('demande_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID demande invalide'),
        handleValidationErrors
    ],
    notificationController.getAllNotifications
);

/**
 * @route   GET /api/notifications/me
 * @desc    Obtenir les notifications de l'utilisateur connecté
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?type=ASSIGNATION&lue=false&page=1&limit=10
 */
router.get('/me', 
    authenticate,
    extractPagination,
    [
        query('type')
            .optional()
            .isIn(['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'NOUVELLE_DEMANDE', 'INTERVENTION', 'ACCEPTATION', 'AUTRE'])
            .withMessage('Type de notification invalide'),
        query('lue')
            .optional()
            .isBoolean()
            .withMessage('Lue doit être true ou false'),
        handleValidationErrors
    ],
    notificationController.getMyNotifications
);

/**
 * @route   GET /api/notifications/search
 * @desc    Rechercher des notifications
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?q=searchTerm&type=ASSIGNATION&lue=false&page=1&limit=10
 */
router.get('/search', 
    authenticate,
    extractPagination,
    validateSearch,
    [
        query('type')
            .optional()
            .isIn(['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'NOUVELLE_DEMANDE', 'INTERVENTION', 'ACCEPTATION', 'AUTRE'])
            .withMessage('Type de notification invalide'),
        query('lue')
            .optional()
            .isBoolean()
            .withMessage('Lue doit être true ou false'),
        handleValidationErrors
    ],
    notificationController.searchNotifications
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtenir les statistiques des notifications
 * @access  Private (Tous les utilisateurs authentifiés)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/stats', 
    authenticate,
    validateDateRange,
    notificationController.getNotificationStats
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Obtenir le nombre de notifications non lues
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/unread-count', 
    authenticate,
    notificationController.getUnreadCount
);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.post('/mark-all-read', 
    authenticate,
    logSensitiveAction('MARK_ALL_NOTIFICATIONS_READ'),
    notificationController.markAllAsRead
);

/**
 * @route   DELETE /api/notifications/cleanup-read
 * @desc    Supprimer les notifications lues de l'utilisateur
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.delete('/cleanup-read', 
    authenticate,
    logSensitiveAction('CLEANUP_READ_NOTIFICATIONS'),
    notificationController.deleteReadNotifications
);

/**
 * @route   DELETE /api/notifications/cleanup-old
 * @desc    Nettoyer les anciennes notifications (gestionnaires seulement)
 * @access  Private (Gestionnaire uniquement)
 * @query   ?days=90
 */
router.delete('/cleanup-old', 
    authenticate,
    authorize('GESTIONNAIRE'),
    [
        query('days')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('Le nombre de jours doit être entre 1 et 365'),
        handleValidationErrors
    ],
    logSensitiveAction('CLEANUP_OLD_NOTIFICATIONS'),
    notificationController.cleanupOldNotifications
);

/**
 * @route   GET /api/notifications/demande/:demandeId
 * @desc    Obtenir les notifications d'une demande spécifique
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/demande/:demandeId', 
    authenticate,
    extractPagination,
    [
        param('demandeId')
            .isInt({ min: 1 })
            .withMessage('ID demande invalide'),
        handleValidationErrors
    ],
    notificationController.getNotificationsByDemande
);

/**
 * @route   POST /api/notifications
 * @desc    Créer une nouvelle notification
 * @access  Private (Gestionnaire uniquement)
 */
router.post('/', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateNotification,
    logSensitiveAction('CREATE_NOTIFICATION'),
    notificationController.createNotification
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Obtenir une notification par ID
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.get('/:id', 
    authenticate,
    validateId,
    notificationController.getNotificationById
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.patch('/:id/read', 
    authenticate,
    validateId,
    logSensitiveAction('MARK_NOTIFICATION_READ'),
    notificationController.markAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private (Propriétaire ou Gestionnaire)
 */
router.delete('/:id', 
    authenticate,
    validateId,
    logSensitiveAction('DELETE_NOTIFICATION'),
    notificationController.deleteNotification
);

module.exports = router;