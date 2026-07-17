const bcrypt = require('bcryptjs');
const { generateToken, generateResetToken, verifyResetToken } = require('../middleware/auth');
const { Personne, Utilisateur, Technicien, Gestionnaire } = require('../models');
const config = require('../config/config');

class AuthController {
    // Connexion utilisateur
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Authentifier l'utilisateur
            const user = await Personne.authenticate(email, password);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // Générer le token JWT
            const token = generateToken({
                id: user.id_personne,
                email: user.email,
                type: user.type_personne
            });

            // Obtenir le profil complet
            const fullProfile = await Personne.getFullProfile(user.id_personne);

            // Réinitialiser les tentatives de connexion en cas de succès
            if (req.resetLoginAttempts) {
                req.resetLoginAttempts();
            }

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    token,
                    user: fullProfile
                }
            });

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Inscription utilisateur
    async register(req, res) {
        try {
            const { nom, prenom, email, mot_de_passe, type_personne, ...extraData } = req.body;

            // 🚨 SÉCURITÉ : Empêcher la création de gestionnaires via inscription publique
            if (type_personne === 'GESTIONNAIRE') {
                return res.status(403).json({
                    success: false,
                    message: 'La création de comptes gestionnaire n\'est pas autorisée via l\'inscription publique. Contactez votre administrateur.'
                });
            }

            // Vérifier si l'email existe déjà
            const emailExists = await Personne.emailExists(email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Hasher le mot de passe
            const salt = await bcrypt.genSalt(config.security.bcryptRounds);
            const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

            let user;

            // Créer l'utilisateur selon son type
            switch (type_personne) {
                case 'UTILISATEUR':
                    user = await Utilisateur.create({
                        nom,
                        prenom,
                        email,
                        mot_de_passe: hashedPassword,
                        poste: extraData.poste,
                        departement: extraData.departement
                    });
                    break;

                case 'TECHNICIEN':
                    user = await Technicien.create({
                        nom,
                        prenom,
                        email,
                        mot_de_passe: hashedPassword,
                        specialite: extraData.specialite,
                        disponibilite: extraData.disponibilite !== false
                    });
                    break;

                case 'GESTIONNAIRE':
                    user = await Gestionnaire.create({
                        nom,
                        prenom,
                        email,
                        mot_de_passe: hashedPassword
                    });
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Type d\'utilisateur invalide'
                    });
            }

            // Générer le token
            const token = generateToken({
                id: user.id_utilisateur || user.id_technicien || user.id_gestionnaire,
                email: user.email,
                type: user.type_personne
            });

            // Obtenir le profil complet
            const fullProfile = await Personne.getFullProfile(
                user.id_utilisateur || user.id_technicien || user.id_gestionnaire
            );

            res.status(201).json({
                success: true,
                message: 'Compte créé avec succès',
                data: {
                    token,
                    user: fullProfile
                }
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le profil de l'utilisateur connecté
    async getProfile(req, res) {
        try {
            const profile = await Personne.getFullProfile(req.userId);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profil introuvable'
                });
            }

            res.json({
                success: true,
                data: { user: profile }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Mettre à jour le profil
    async updateProfile(req, res) {
        try {
            // Champs de base (table personne)
            const baseFields = ['nom', 'prenom', 'email'];
            const updateData = {};

            console.log('🔍 DEBUG UPDATE PROFILE - Body reçu:', req.body);
            console.log('🔍 DEBUG UPDATE PROFILE - User ID:', req.userId);
            console.log('🔍 DEBUG UPDATE PROFILE - User Type:', req.userType);

            // Filtrer les champs de base
            Object.keys(req.body).forEach(key => {
                if (baseFields.includes(key)) {
                    updateData[key] = req.body[key];
                }
            });

            // Vérifier l'unicité de l'email si modifié
            if (updateData.email) {
                const emailExists = await Personne.emailExists(updateData.email, req.userId);
                if (emailExists) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cet email est déjà utilisé'
                    });
                }
            }

            // Mettre à jour les informations de base si il y en a
            if (Object.keys(updateData).length > 0) {
                await Personne.update(req.userId, updateData);
                console.log('✅ Informations de base mises à jour');
            }

            // Mettre à jour les informations spécifiques selon le type
            const typeSpecificData = {};
            let hasSpecificData = false;

            switch (req.userType) {
                case 'UTILISATEUR':
                    if (req.body.departement !== undefined) {
                        typeSpecificData.departement = req.body.departement;
                        hasSpecificData = true;
                    }
                    if (req.body.poste !== undefined) {
                        typeSpecificData.poste = req.body.poste;
                        hasSpecificData = true;
                    }
                    break;

                case 'TECHNICIEN':
                    if (req.body.specialite !== undefined) {
                        typeSpecificData.specialite = req.body.specialite;
                        hasSpecificData = true;
                    }
                    if (req.body.disponibilite !== undefined) {
                        typeSpecificData.disponibilite = req.body.disponibilite;
                        hasSpecificData = true;
                    }
                    break;

                case 'GESTIONNAIRE':
                    // Les gestionnaires n'ont pas de champs spécifiques dans ce schéma
                    break;
            }

            // Gestion spéciale du téléphone - l'ajouter à la table personne si elle existe
            if (req.body.telephone !== undefined) {
                try {
                    // Essayer d'ajouter le téléphone à la table personne
                    await Personne.update(req.userId, { telephone: req.body.telephone });
                    console.log('✅ Téléphone mis à jour dans table personne');
                } catch (phoneError) {
                    console.log('⚠️ Erreur téléphone (colonne n\'existe peut-être pas):', phoneError.message);
                    // Continuer sans erreur si la colonne n'existe pas
                }
            }

            // Mettre à jour les données spécifiques si nécessaires
            if (hasSpecificData) {
                try {
                    switch (req.userType) {
                        case 'UTILISATEUR':
                            await Utilisateur.updateProfile(req.userId, typeSpecificData);
                            console.log('✅ Données utilisateur mises à jour');
                            break;
                        case 'TECHNICIEN':
                            await Technicien.updateProfile(req.userId, typeSpecificData);
                            console.log('✅ Données technicien mises à jour');
                            break;
                    }
                } catch (specificError) {
                    console.log('⚠️ Erreur données spécifiques:', specificError.message);
                }
            }

            // Récupérer le profil mis à jour
            const updatedProfile = await Personne.getFullProfile(req.userId);

            res.json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: { user: updatedProfile }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Changer le mot de passe
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Récupérer l'utilisateur avec son mot de passe
            const user = await Personne.findById(req.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            // Vérifier le mot de passe actuel
            const isValidPassword = await Personne.verifyPassword(currentPassword, user.mot_de_passe);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Mot de passe actuel incorrect'
                });
            }

            // Mettre à jour le mot de passe
            await Personne.updatePassword(req.userId, newPassword);

            res.json({
                success: true,
                message: 'Mot de passe modifié avec succès'
            });

        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Demande de réinitialisation de mot de passe
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            const user = await Personne.findByEmail(email);
            if (!user) {
                // Ne pas révéler si l'email existe ou non
                return res.json({
                    success: true,
                    message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
                });
            }

            const resetToken = generateResetToken(user.id_personne);

            // TODO: Envoyer l'email avec le token
            // Pour le développement, on retourne le token
            res.json({
                success: true,
                message: 'Lien de réinitialisation envoyé',
                resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
            });

        } catch (error) {
            console.error('Erreur lors de la demande de réinitialisation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Réinitialiser le mot de passe
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            // Vérifier le token
            const decoded = verifyResetToken(token);

            // Mettre à jour le mot de passe
            await Personne.updatePassword(decoded.id, newPassword);

            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(400).json({
                    success: false,
                    message: 'Token de réinitialisation invalide ou expiré'
                });
            }

            console.error('Erreur lors de la réinitialisation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Vérifier la validité d'un token
    async verifyToken(req, res) {
        try {
            // Si on arrive ici, le middleware d'authentification a validé le token
            res.json({
                success: true,
                message: 'Token valide',
                data: {
                    user: req.user
                }
            });

        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Déconnexion (côté client seulement, mais utile pour les logs)
    async logout(req, res) {
        try {
            // Dans une vraie application, on pourrait blacklister le token
            res.json({
                success: true,
                message: 'Déconnexion réussie'
            });

        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // ===== NOUVEAUX ENDPOINTS ADMIN =====
    
    // Créer un gestionnaire (réservé aux gestionnaires existants)
    async createGestionnaire(req, res) {
        try {
            // Vérifier que l'utilisateur connecté est un gestionnaire
            if (req.userType !== 'GESTIONNAIRE') {
                return res.status(403).json({
                    success: false,
                    message: 'Seuls les gestionnaires peuvent créer d\'autres gestionnaires'
                });
            }

            const { nom, prenom, email, mot_de_passe } = req.body;

            // Vérifier si l'email existe déjà
            const emailExists = await Personne.emailExists(email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Créer le gestionnaire
            const salt = await bcrypt.genSalt(config.security.bcryptRounds);
            const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

            const user = await Gestionnaire.create({
                nom,
                prenom,
                email,
                mot_de_passe: hashedPassword
            });

            res.status(201).json({
                success: true,
                message: 'Gestionnaire créé avec succès',
                data: {
                    user: {
                        id: user.id_gestionnaire,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        type_personne: user.type_personne
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la création du gestionnaire:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Promouvoir un utilisateur existant comme gestionnaire  
    async promoteToGestionnaire(req, res) {
        try {
            // Vérifier que l'utilisateur connecté est un gestionnaire
            if (req.userType !== 'GESTIONNAIRE') {
                return res.status(403).json({
                    success: false,
                    message: 'Seuls les gestionnaires peuvent promouvoir d\'autres utilisateurs'
                });
            }

            const { userId } = req.params;

            // Vérifier que l'utilisateur existe
            const user = await Personne.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            // Vérifier qu'il n'est pas déjà gestionnaire
            if (user.type_personne === 'GESTIONNAIRE') {
                return res.status(400).json({
                    success: false,
                    message: 'Cet utilisateur est déjà gestionnaire'
                });
            }

            // Mettre à jour le type de personne
            await Personne.update(userId, { type_personne: 'GESTIONNAIRE' });

            // Créer l'entrée gestionnaire si nécessaire
            try {
                await Gestionnaire.addExistingPerson(userId);
            } catch (error) {
                // Ignorer si l'entrée existe déjà
                if (!error.message.includes('Duplicate')) {
                    throw error;
                }
            }

            res.json({
                success: true,
                message: 'Utilisateur promu gestionnaire avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la promotion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // ===== INSTALLATION INITIALE =====
    
    /**
     * Vérifier si l'installation initiale est nécessaire
     */
    async checkSetup(req, res) {
        try {
            const statsResult = await Personne.getStatsByType();
            const gestionnaireCount = statsResult.find(s => s.type_personne === 'GESTIONNAIRE')?.count || 0;

            res.json({
                success: true,
                data: {
                    hasGestionnaires: gestionnaireCount > 0,
                    setupRequired: gestionnaireCount === 0
                }
            });

        } catch (error) {
            console.error('Erreur lors de la vérification setup:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    /**
     * Installation initiale - Créer le premier gestionnaire
     */
    async initialSetup(req, res) {
        try {
            // Vérifier qu'aucun gestionnaire n'existe
            const statsResult = await Personne.getStatsByType();
            const gestionnaireCount = statsResult.find(s => s.type_personne === 'GESTIONNAIRE')?.count || 0;

            if (gestionnaireCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le système est déjà configuré. L\'installation initiale n\'est plus possible.'
                });
            }

            const { entreprise, gestionnaire } = req.body;

            // Validation des données
            if (!gestionnaire.nom || !gestionnaire.prenom || !gestionnaire.email || !gestionnaire.mot_de_passe) {
                return res.status(400).json({
                    success: false,
                    message: 'Informations gestionnaire incomplètes'
                });
            }

            // Vérifier l'unicité de l'email
            const emailExists = await Personne.emailExists(gestionnaire.email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Créer le gestionnaire
            const user = await Gestionnaire.create({
                nom: gestionnaire.nom,
                prenom: gestionnaire.prenom,
                email: gestionnaire.email,
                mot_de_passe: gestionnaire.mot_de_passe
            });

            // Log de l'installation
            console.log(`🏢 INSTALLATION INITIALE TERMINÉE:`);
            console.log(`   Entreprise: ${entreprise?.nom || 'Non spécifiée'}`);
            console.log(`   Gestionnaire: ${gestionnaire.prenom} ${gestionnaire.nom} (${gestionnaire.email})`);
            console.log(`   Date: ${new Date().toISOString()}`);

            res.status(201).json({
                success: true,
                message: 'Installation initiale terminée avec succès',
                data: {
                    gestionnaire: {
                        id: user.id_gestionnaire,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        type_personne: user.type_personne
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de l\'installation initiale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'installation'
            });
        }
    }
}

module.exports = new AuthController();
