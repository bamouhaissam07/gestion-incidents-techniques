const express = require('express');
const router = express.Router();

// Controllers
const reportController = require('../controllers/reportController');

// Middleware
const { 
    authenticate, 
    authorize, 
    extractPagination,
    logSensitiveAction 
} = require('../middleware/auth');

const {
    validateDateRange,
    handleValidationErrors
} = require('../middleware/validation');

const { body, query } = require('express-validator');

// Validation spécifique aux rapports
const validateCustomReport = [
    body('type')
        .isIn(['SYSTEM_OVERVIEW', 'TECHNICIAN_PERFORMANCE', 'INCIDENT_ANALYSIS', 'MAINTENANCE', 'SLA', 'PERFORMANCE', 'INCIDENTS', 'SATISFACTION'])
        .withMessage('Type de rapport invalide'),
    body('periode_debut')
        .optional()  // ✅ OPTIONNEL
        .isISO8601()
        .withMessage('Date de début doit être au format ISO 8601'),
    body('periode_fin')
        .optional()  // ✅ OPTIONNEL
        .isISO8601()
        .withMessage('Date de fin doit être au format ISO 8601'),
    handleValidationErrors
];

/**
 * @route   GET /api/reports/system-overview
 * @desc    Rapport général du système
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/system-overview', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    reportController.getSystemOverview
);

/**
 * @route   GET /api/reports/technician-performance
 * @desc    Rapport de performance des techniciens
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31&technicien_id=1
 */
router.get('/technician-performance', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    [
        query('technicien_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID technicien invalide'),
        handleValidationErrors
    ],
    reportController.getTechnicianPerformance
);

/**
 * @route   GET /api/reports/incident-analysis
 * @desc    Rapport d'analyse des incidents
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/incident-analysis', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    reportController.getIncidentAnalysis
);

/**
 * @route   GET /api/reports/maintenance
 * @desc    Rapport de maintenance préventive
 * @access  Private (Gestionnaire uniquement)
 */
router.get('/maintenance', 
    authenticate,
    authorize('GESTIONNAIRE'),
    reportController.getMaintenanceReport
);

/**
 * @route   GET /api/reports/activity
 * @desc    Rapport d'activité par période
 * @access  Private (Gestionnaire uniquement)
 * @query   date_debut=2024-01-01&date_fin=2024-12-31 (requis)
 */
router.get('/activity', 
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
    reportController.getActivityReport
);

/**
 * @route   GET /api/reports/sla
 * @desc    Rapport SLA (Service Level Agreement)
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/sla', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    reportController.getSLAReport
);

/**
 * @route   GET /api/reports/customer-satisfaction
 * @desc    Rapport de satisfaction client
 * @access  Private (Gestionnaire uniquement)
 * @query   ?date_debut=2024-01-01&date_fin=2024-12-31
 */
router.get('/customer-satisfaction', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateDateRange,
    reportController.getCustomerSatisfactionReport
);

/**
 * @route   POST /api/reports/generate
 * @desc    Générer et sauvegarder un rapport personnalisé
 * @access  Private (Gestionnaire uniquement)
 */
router.post('/generate', 
    authenticate,
    authorize('GESTIONNAIRE'),
    validateCustomReport,
    logSensitiveAction('GENERATE_REPORT'),
    reportController.generateCustomReport
);

/**
 * @route   GET /api/reports/saved
 * @desc    Obtenir la liste des rapports sauvegardés
 * @access  Private (Gestionnaire uniquement)
 * @query   ?page=1&limit=10
 */
router.get('/saved', 
    authenticate,
    authorize('GESTIONNAIRE'),
    extractPagination,
    reportController.getSavedReports
);

module.exports = router;
