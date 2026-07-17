const { Personne, Utilisateur, Technicien, Gestionnaire } = require('../models');
const db = require('../config/database'); // Ajout pour les requêtes directes

// 🔄 Fonction pour changer le rôle d'un utilisateur
const changeUserRole = async (userId, oldRole, newRole, updateData) => {
    console.log(`🔄 Changement de rôle: User ${userId} ${oldRole} → ${newRole}`);
    
    try {
        // Utiliser une transaction pour garantir la cohérence
        await db.transaction(async (connection) => {
            // 1. Supprimer l'ancienne entrée spécifique
            switch (oldRole) {
                case 'UTILISATEUR':
                    await connection.query('DELETE FROM utilisateur WHERE id_utilisateur = ?', [userId]);
                    console.log(`🗑️ Supprimé entrée utilisateur pour ID ${userId}`);
                    break;
                case 'TECHNICIEN':
                    await connection.query('DELETE FROM technicien WHERE id_technicien = ?', [userId]);
                    console.log(`🗑️ Supprimé entrée technicien pour ID ${userId}`);
                    break;
                case 'GESTIONNAIRE':
                    await connection.query('DELETE FROM gestionnaire WHERE id_gestionnaire = ?', [userId]);
                    console.log(`🗑️ Supprimé entrée gestionnaire pour ID ${userId}`);
                    break;
            }

            // 2. Mettre à jour le type dans la table personne
            const updateResult = await connection.query('UPDATE personne SET type_personne = ? WHERE id_personne = ?', [newRole, userId]);
            console.log(`🔄 Mise à jour personne result:`, updateResult);

            // 3. Créer la nouvelle entrée spécifique
            switch (newRole) {
                case 'UTILISATEUR':
                    await connection.query(
                        'INSERT INTO utilisateur (id_utilisateur, poste, departement) VALUES (?, ?, ?)',
                        [userId, updateData.poste || null, updateData.departement || null]
                    );
                    console.log(`➕ Créé entrée utilisateur pour ID ${userId}`);
                    break;
                case 'TECHNICIEN':
                    await connection.query(
                        'INSERT INTO technicien (id_technicien, specialite, disponibilite) VALUES (?, ?, ?)',
                        [userId, updateData.specialite || null, updateData.disponibilite !== false]
                    );
                    console.log(`➕ Créé entrée technicien pour ID ${userId}`);
                    break;
                case 'GESTIONNAIRE':
                    await connection.query(
                        'INSERT INTO gestionnaire (id_gestionnaire) VALUES (?)',
                        [userId]
                    );
                    console.log(`➕ Créé entrée gestionnaire pour ID ${userId}`);
                    break;
            }
            
            console.log(`✅ Rôle changé avec succès: User ${userId} ${oldRole} → ${newRole}`);
        });
    } catch (error) {
        console.error(`❌ Erreur changement de rôle User ${userId}:`, error);
        throw error;
    }
};

// 📝 Fonction pour mise à jour normale (sans changement de rôle)
const updateUserNormal = async (userId, userType, updateData) => {
    console.log(`📝 Mise à jour normale User ${userId} (${userType})`);
    
    // Séparer les données de base et spécifiques
    const baseFields = ['nom', 'prenom', 'email'];
    const baseData = {};
    const specificData = {};

    Object.keys(updateData).forEach(key => {
        if (baseFields.includes(key)) {
            baseData[key] = updateData[key];
        } else if (key !== 'type_personne') { // Exclure type_personne car pas de changement
            specificData[key] = updateData[key];
        }
    });

    // Mettre à jour les informations de base
    if (Object.keys(baseData).length > 0) {
        console.log(`📝 Mise à jour données de base:`, baseData);
        await Personne.update(userId, baseData);
    }

    // Mettre à jour les informations spécifiques selon le type
    if (Object.keys(specificData).length > 0) {
        console.log(`📝 Mise à jour données spécifiques:`, specificData);
        switch (userType) {
            case 'UTILISATEUR':
                await Utilisateur.updateProfile(userId, specificData);
                break;
            case 'TECHNICIEN':
                await Technicien.updateProfile(userId, specificData);
                break;
            case 'GESTIONNAIRE':
                // Les gestionnaires n'ont généralement pas de champs spécifiques
                break;
        }
    }
};

class UserController {
    // Obtenir tous les utilisateurs (filtrable par type)
    async getAllUsers(req, res) {
        try {
            const { type, search, page, limit } = req.query;
            const options = {
                limit: req.pagination.limit,
                offset: req.pagination.offset,
                orderBy: 'p.nom, p.prenom'
            };

            let users;

            if (search) {
                users = await Personne.search(search, type, options);
            } else if (type) {
                users = await Personne.findByType(type);
            } else {
                // Récupérer tous les utilisateurs avec leurs informations complètes
                users = await Personne.customQuery(`
                    SELECT 
                        p.id_personne,
                        p.nom,
                        p.prenom,
                        p.email,
                        p.type_personne,
                        p.date_creation,
                        u.poste,
                        u.departement,
                        t.specialite,
                        t.disponibilite
                    FROM personne p
                    LEFT JOIN utilisateur u ON p.id_personne = u.id_utilisateur
                    LEFT JOIN technicien t ON p.id_personne = t.id_technicien
                    ORDER BY p.nom, p.prenom
                    LIMIT ? OFFSET ?
                `, [options.limit, options.offset]);
            }

            // Compter le total pour la pagination
            const total = await Personne.count(type ? { type_personne: type } : {});

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir un utilisateur par ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await Personne.getFullProfile(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Créer un nouvel utilisateur (réservé aux gestionnaires)
    async createUser(req, res) {
        try {
            const { type_personne, ...userData } = req.body;

            // Vérifier si l'email existe déjà
            const emailExists = await Personne.emailExists(userData.email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            let newUser;

            // Créer l'utilisateur selon son type
            switch (type_personne) {
                case 'UTILISATEUR':
                    newUser = await Utilisateur.create(userData);
                    break;

                case 'TECHNICIEN':
                    newUser = await Technicien.create(userData);
                    break;

                case 'GESTIONNAIRE':
                    newUser = await Gestionnaire.create(userData);
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Type d\'utilisateur invalide'
                    });
            }

            // Récupérer le profil complet créé
            const fullProfile = await Personne.getFullProfile(
                newUser.id_utilisateur || newUser.id_technicien || newUser.id_gestionnaire
            );

            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: { user: fullProfile }
            });

        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Mettre à jour un utilisateur
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            console.log(`🔧 === DÉBUT MODIFICATION UTILISATEUR ID: ${id} ===`);
            console.log('📝 Données reçues:', JSON.stringify(updateData, null, 2));

            // Vérifier que l'utilisateur existe
            const user = await Personne.findById(id);
            if (!user) {
                console.log(`❌ Utilisateur ${id} introuvable`);
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            console.log(`👤 Utilisateur actuel:`, JSON.stringify(user, null, 2));

            // Vérifier l'unicité de l'email si modifié
            if (updateData.email) {
                const emailExists = await Personne.emailExists(updateData.email, id);
                if (emailExists) {
                    console.log(`❌ Email ${updateData.email} déjà utilisé`);
                    return res.status(409).json({
                        success: false,
                        message: 'Cet email est déjà utilisé'
                    });
                }
            }

            // 🚀 GESTION DU CHANGEMENT DE RÔLE
            const oldRole = user.type_personne;
            const newRole = updateData.type_personne;

            console.log(`🔄 Comparaison rôles: "${oldRole}" → "${newRole}"`);

            if (newRole && newRole !== oldRole) {
                console.log(`🔄 CHANGEMENT DE RÔLE DÉTECTÉ!`);
                // Changer de rôle nécessite une logique spéciale
                await changeUserRole(id, oldRole, newRole, updateData);
            } else {
                console.log(`📝 Mise à jour normale (pas de changement de rôle)`);
                // Mise à jour normale sans changement de rôle
                await updateUserNormal(id, user.type_personne, updateData);
            }

            // Récupérer le profil mis à jour
            const updatedProfile = await Personne.getFullProfile(id);
            console.log(`✅ Profil mis à jour:`, JSON.stringify(updatedProfile, null, 2));
            console.log(`🔧 === FIN MODIFICATION UTILISATEUR ID: ${id} ===`);

            res.json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
                data: { user: updatedProfile }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Supprimer un utilisateur
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que l'utilisateur existe
            const user = await Personne.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            // Empêcher l'auto-suppression
            if (parseInt(id) === req.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vous ne pouvez pas supprimer votre propre compte'
                });
            }

            // Supprimer selon le type
            let deleted = false;
            switch (user.type_personne) {
                case 'UTILISATEUR':
                    deleted = await Utilisateur.delete(id);
                    break;

                case 'TECHNICIEN':
                    deleted = await Technicien.delete(id);
                    break;

                case 'GESTIONNAIRE':
                    deleted = await Gestionnaire.delete(id);
                    break;
            }

            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer cet utilisateur'
                });
            }

            res.json({
                success: true,
                message: 'Utilisateur supprimé avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            
            if (error.message.includes('demandes')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les statistiques des utilisateurs par type
    async getUserStats(req, res) {
        try {
            const stats = await Personne.getStatsByType();

            res.json({
                success: true,
                data: { stats }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Rechercher des utilisateurs
    async searchUsers(req, res) {
        try {
            const { q: searchTerm, type } = req.query;
            
            const options = {
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const users = await Personne.search(searchTerm, type, options);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Changer le statut de disponibilité d'un technicien
    async toggleTechnicianAvailability(req, res) {
        try {
            const { id } = req.params;
            const { disponibilite } = req.body;

            // Vérifier que c'est bien un technicien
            const user = await Personne.findById(id);
            if (!user || user.type_personne !== 'TECHNICIEN') {
                return res.status(404).json({
                    success: false,
                    message: 'Technicien introuvable'
                });
            }

            // Mettre à jour la disponibilité
            await Technicien.setDisponibilite(id, disponibilite);

            // Récupérer le profil mis à jour
            const updatedProfile = await Personne.getFullProfile(id);

            res.json({
                success: true,
                message: `Technicien ${disponibilite ? 'disponible' : 'indisponible'}`,
                data: { user: updatedProfile }
            });

        } catch (error) {
            console.error('Erreur lors du changement de disponibilité:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir tous les techniciens disponibles
    async getAvailableTechnicians(req, res) {
        try {
            const { specialite } = req.query;
            
            const technicians = await Technicien.findAvailable(specialite);

            res.json({
                success: true,
                data: { technicians }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des techniciens disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les départements existants
    async getDepartments(req, res) {
        try {
            const departments = await Utilisateur.getDepartements();

            res.json({
                success: true,
                data: { departments }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des départements:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les spécialités des techniciens
    async getSpecialities(req, res) {
        try {
            const specialities = await Technicien.getSpecialites();

            res.json({
                success: true,
                data: { specialities }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des spécialités:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le tableau de bord d'un utilisateur
    async getUserDashboard(req, res) {
        try {
            const { id } = req.params;
            
            // Vérifier que l'utilisateur existe
            const user = await Personne.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            let dashboardData = {};

            // Récupérer les données spécifiques selon le type
            switch (user.type_personne) {
                case 'UTILISATEUR':
                    dashboardData = {
                        ...await Utilisateur.getStatistics(id),
                        demandes_recentes: await Utilisateur.getDemandesIntervention(id, { limit: 5 })
                    };
                    break;

                case 'TECHNICIEN':
                    dashboardData = {
                        ...await Technicien.getStatistics(id),
                        demandes_assignees: await Technicien.getDemandesAssignees(id, { limit: 5 }),
                        interventions_recentes: await Technicien.getInterventionsRealisees(id, { limit: 5 })
                    };
                    break;

                case 'GESTIONNAIRE':
                    dashboardData = {
                        ...await Gestionnaire.getStatistiquesGlobales(),
                        demandes_en_attente: await Gestionnaire.getDemandesEnAttente({ limit: 10 }),
                        demandes_traitees: await Gestionnaire.getDemandesTraitees(id, { limit: 5 })
                    };
                    break;
            }

            res.json({
                success: true,
                data: {
                    user: user,
                    dashboard: dashboardData
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du tableau de bord:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = new UserController();