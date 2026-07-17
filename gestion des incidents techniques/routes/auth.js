const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');

// Middleware
const { authenticate, loginRateLimit, logSensitiveAction } = require('../middleware/auth');
const {
    validateLogin,
    validateRegister,
    validatePasswordChange
} = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: gestionnaire@test.com
 *         password:
 *           type: string
 *           example: password123
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Connexion réussie
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               $ref: '#/components/schemas/Personne'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de tentatives de connexion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', 
    loginRateLimit(),
    validateLogin,
    logSensitiveAction('LOGIN'),
    authController.login
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - mot_de_passe
 *               - type_personne
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 8
 *                 example: motdepasse123
 *               type_personne:
 *                 type: string
 *                 enum: [UTILISATEUR, TECHNICIEN, GESTIONNAIRE]
 *                 example: UTILISATEUR
 *               poste:
 *                 type: string
 *                 example: Développeur
 *               departement:
 *                 type: string
 *                 example: Informatique
 *               specialite:
 *                 type: string
 *                 example: Réseau
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', 
    validateRegister,
    logSensitiveAction('REGISTER'),
    authController.register
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     description: Retourne les informations du profil utilisateur
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Personne'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', 
    authenticate,
    authController.getProfile
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     description: Met à jour les informations du profil
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               poste:
 *                 type: string
 *                 example: Développeur Senior
 *               departement:
 *                 type: string
 *                 example: IT
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       401:
 *         description: Non authentifié
 *       409:
 *         description: Email déjà utilisé
 */
router.put('/profile', 
    authenticate,
    logSensitiveAction('UPDATE_PROFILE'),
    authController.updateProfile
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Changer le mot de passe
 *     description: Change le mot de passe de l'utilisateur connecté
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: ancienMotDePasse
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: nouveauMotDePasse123
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Mot de passe actuel incorrect
 *       401:
 *         description: Non authentifié
 */
router.post('/change-password', 
    authenticate,
    validatePasswordChange,
    logSensitiveAction('CHANGE_PASSWORD'),
    authController.changePassword
);

/**
 * @swagger
 * /api/auth/request-reset:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     description: Envoie un email de réinitialisation (en développement, retourne le token)
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Lien de réinitialisation envoyé
 */
router.post('/request-reset', 
    loginRateLimit(3, 15 * 60 * 1000),
    authController.requestPasswordReset
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec un token
 *     description: Réinitialise le mot de passe avec un token de réinitialisation
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: nouveauMotDePasse123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password', 
    logSensitiveAction('RESET_PASSWORD'),
    authController.resetPassword
);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Vérifier la validité du token
 *     description: Vérifie si le token JWT est toujours valide
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *       401:
 *         description: Token invalide ou expiré
 */
router.get('/verify', 
    authenticate,
    authController.verifyToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     description: Déconnecte l'utilisateur (côté client)
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post('/logout', 
    authenticate,
    logSensitiveAction('LOGOUT'),
    authController.logout
);

// ===== ROUTES ADMIN GESTIONNAIRES =====

/**
 * @swagger
 * /api/auth/admin/create-gestionnaire:
 *   post:
 *     summary: Créer un nouveau gestionnaire (Admin seulement)
 *     description: Permet à un gestionnaire de créer un autre gestionnaire
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom  
 *               - email
 *               - mot_de_passe
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Martin
 *               prenom:
 *                 type: string  
 *                 example: Sophie
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sophie.martin@company.com
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 8
 *                 example: securePassword123
 *     responses:
 *       201:
 *         description: Gestionnaire créé avec succès
 *       403:
 *         description: Accès refusé - seuls les gestionnaires peuvent créer d'autres gestionnaires
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/admin/create-gestionnaire', 
    authenticate,
    logSensitiveAction('CREATE_GESTIONNAIRE'),
    authController.createGestionnaire
);

/**
 * @swagger
 * /api/auth/admin/promote/{userId}:
 *   post:
 *     summary: Promouvoir un utilisateur comme gestionnaire
 *     description: Permet à un gestionnaire de promouvoir un utilisateur existant
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur à promouvoir
 *     responses:
 *       200:
 *         description: Utilisateur promu gestionnaire avec succès
 *       403:
 *         description: Accès refusé - seuls les gestionnaires peuvent promouvoir
 *       404:
 *         description: Utilisateur introuvable
 *       400:
 *         description: L'utilisateur est déjà gestionnaire
 */
router.post('/admin/promote/:userId', 
    authenticate,
    logSensitiveAction('PROMOTE_TO_GESTIONNAIRE'),
    authController.promoteToGestionnaire
);

// ===== INSTALLATION INITIALE =====

/**
 * @swagger
 * /api/auth/check-setup:
 *   get:
 *     summary: Vérifier si l'installation initiale est nécessaire
 *     description: Vérifie s'il existe des gestionnaires dans le système
 *     tags: [Installation]
 *     responses:
 *       200:
 *         description: Statut de l'installation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasGestionnaires:
 *                       type: boolean
 *                       description: True si des gestionnaires existent
 *                     setupRequired:
 *                       type: boolean
 *                       description: True si l'installation initiale est nécessaire
 */
router.get('/check-setup', authController.checkSetup);

/**
 * @swagger
 * /api/auth/initial-setup:
 *   post:
 *     summary: Installation initiale du système
 *     description: Crée le premier gestionnaire lors du déploiement
 *     tags: [Installation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gestionnaire
 *             properties:
 *               entreprise:
 *                 type: object
 *                 properties:
 *                   nom:
 *                     type: string
 *                     example: TechCorp Solutions
 *                   secteur:
 *                     type: string
 *                     example: Informatique
 *               gestionnaire:
 *                 type: object
 *                 required:
 *                   - nom
 *                   - prenom
 *                   - email
 *                   - mot_de_passe
 *                 properties:
 *                   nom:
 *                     type: string
 *                     example: Martin
 *                   prenom:
 *                     type: string
 *                     example: Sophie
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: sophie.martin@techcorp.com
 *                   poste:
 *                     type: string
 *                     example: Directrice IT
 *                   telephone:
 *                     type: string
 *                     example: +33 1 23 45 67 89
 *                   mot_de_passe:
 *                     type: string
 *                     minLength: 8
 *                     example: SecurePassword123
 *     responses:
 *       201:
 *         description: Installation initiale terminée
 *       400:
 *         description: Système déjà configuré ou données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/initial-setup', authController.initialSetup);

module.exports = router;