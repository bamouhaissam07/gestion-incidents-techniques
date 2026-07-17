const { body, param, query, validationResult } = require('express-validator');
const config = require('../config/config');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
    console.log('🔍 Validation middleware - Body:', req.body);
    console.log('🔍 Validation middleware - Params:', req.params);
    
    const errors = validationResult(req);
    console.log('🔍 Erreurs de validation:', errors.array());
    
    if (!errors.isEmpty()) {
        console.log('❌ Validation échouée:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    console.log('✅ Validation réussie');
    next();
};

// Validations pour l'authentification
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Adresse email invalide')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Mot de passe requis'),
    handleValidationErrors
];

const validateRegister = [
    body('nom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('email')
        .isEmail()
        .withMessage('Adresse email invalide')
        .normalizeEmail(),
    body('mot_de_passe')
        .isLength({ min: config.security.passwordMinLength })
        .withMessage(`Le mot de passe doit contenir au moins ${config.security.passwordMinLength} caractères`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
    body('type_personne')
        .isIn(config.enums.typePersonne)
        .withMessage('Type de personne invalide'),
    handleValidationErrors
];

const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mot de passe actuel requis'),
    body('newPassword')
        .isLength({ min: config.security.passwordMinLength })
        .withMessage(`Le nouveau mot de passe doit contenir au moins ${config.security.passwordMinLength} caractères`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
    handleValidationErrors
];

// Validations pour les utilisateurs
const validateUtilisateur = [
    body('nom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('email')
        .isEmail()
        .withMessage('Adresse email invalide')
        .normalizeEmail(),
    body('poste')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Le poste ne peut pas dépasser 100 caractères'),
    body('departement')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Le département ne peut pas dépasser 100 caractères'),
    handleValidationErrors
];

const validateUtilisateurUpdate = [
    body('poste')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Le poste ne peut pas dépasser 100 caractères'),
    body('departement')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Le département ne peut pas dépasser 100 caractères'),
    handleValidationErrors
];

// Validations pour les techniciens
const validateTechnicien = [
    body('nom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('prenom')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('email')
        .isEmail()
        .withMessage('Adresse email invalide')
        .normalizeEmail(),
    body('specialite')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La spécialité ne peut pas dépasser 100 caractères'),
    body('disponibilite')
        .optional()
        .isBoolean()
        .withMessage('La disponibilité doit être true ou false'),
    handleValidationErrors
];

const validateTechnicienUpdate = [
    body('specialite')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La spécialité ne peut pas dépasser 100 caractères'),
    body('disponibilite')
        .optional()
        .isBoolean()
        .withMessage('La disponibilité doit être true ou false'),
    handleValidationErrors
];

// Validations pour le matériel
const validateMateriel = [
    body('nom')
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('Le nom du matériel doit contenir entre 1 et 150 caractères'),
    body('numero_serie')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Le numéro de série doit contenir entre 1 et 100 caractères'),
    body('description')
        .optional()
        .trim(),
    body('emplacement')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('L\'emplacement ne peut pas dépasser 150 caractères'),
    body('statut')
        .optional()
        .isIn(config.enums.statutMateriel)
        .withMessage('Statut de matériel invalide'),
    handleValidationErrors
];

const validateMaterielUpdate = [
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('Le nom du matériel doit contenir entre 1 et 150 caractères'),
    body('numero_serie')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Le numéro de série doit contenir entre 1 et 100 caractères'),
    body('description')
        .optional()
        .trim(),
    body('emplacement')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('L\'emplacement ne peut pas dépasser 150 caractères'),
    body('statut')
        .optional()
        .isIn(config.enums.statutMateriel)
        .withMessage('Statut de matériel invalide'),
    handleValidationErrors
];

// Validations pour les demandes d'intervention
const validateDemandeIntervention = [
    body('titre')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Le titre doit contenir entre 1 et 200 caractères'),
    body('description')
        .optional()
        .trim(),
    body('nature_technique')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('La nature technique ne peut pas dépasser 150 caractères'),
    body('categorie')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La catégorie ne peut pas dépasser 100 caractères'),
    body('urgence')
        .optional()
        .isIn(config.enums.urgence)
        .withMessage('Niveau d\'urgence invalide'),
    body('id_materiel')
        .isInt({ min: 1 })
        .withMessage('ID de matériel invalide'),
    handleValidationErrors
];

const validateDemandeUpdate = [
    body('titre')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Le titre doit contenir entre 1 et 200 caractères'),
    body('description')
        .optional()
        .trim(),
    body('nature_technique')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('La nature technique ne peut pas dépasser 150 caractères'),
    body('categorie')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La catégorie ne peut pas dépasser 100 caractères'),
    body('urgence')
        .optional()
        .isIn(config.enums.urgence)
        .withMessage('Niveau d\'urgence invalide'),
    handleValidationErrors
];

const validateStatusChange = [
    body('statut')
        .isIn(config.enums.statutDemande)
        .withMessage('Statut invalide'),
    body('raison_refus')
        .if(body('statut').equals('REFUSEE'))
        .notEmpty()
        .withMessage('Raison de refus requise'),
    handleValidationErrors
];

const validateAssignation = [
    body('technicien_id')
        .isInt({ min: 1 })
        .withMessage('ID de technicien invalide'),
    handleValidationErrors
];

// Validations pour les paramètres d'URL
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalide'),
    handleValidationErrors
];

// Validations pour les requêtes de recherche
const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Le terme de recherche doit contenir au moins 2 caractères'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Numéro de page invalide'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite invalide (1-100)'),
    handleValidationErrors
];

// Validations pour les dates
const validateDateRange = [
    query('date_debut')
        .optional()
        .isISO8601()
        .withMessage('Date de début invalide (format ISO 8601)'),
    query('date_fin')
        .optional()
        .isISO8601()
        .withMessage('Date de fin invalide (format ISO 8601)'),
    handleValidationErrors
];

// Validation pour les filtres de statut
const validateStatutFilter = [
    query('statut')
        .optional()
        .isIn([...config.enums.statutDemande, ...config.enums.statutMateriel])
        .withMessage('Statut de filtre invalide'),
    handleValidationErrors
];

// Validation pour les filtres d'urgence
const validateUrgenceFilter = [
    query('urgence')
        .optional()
        .isIn(config.enums.urgence)
        .withMessage('Niveau d\'urgence de filtre invalide'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validatePasswordChange,
    validateUtilisateur,
    validateUtilisateurUpdate,
    validateTechnicien,
    validateTechnicienUpdate,
    validateMateriel,
    validateMaterielUpdate,
    validateDemandeIntervention,
    validateDemandeUpdate,
    validateStatusChange,
    validateAssignation,
    validateId,
    validateSearch,
    validateDateRange,
    validateStatutFilter,
    validateUrgenceFilter
};