const { DemandeIntervention, Materiel, Technicien, Gestionnaire, Notification } = require('../models');

class DemandeController {
    // Obtenir toutes les demandes (avec pagination et filtres)
    async getAllDemandes(req, res) {
        try {
            const {
                statut,
                urgence,
                utilisateur_id,
                technicien_id,
                gestionnaire_id,
                materiel_id,
                categorie,
                date_debut,
                date_fin
            } = req.query;

            const options = {
                statut,
                urgence,
                utilisateur_id,
                technicien_id,
                gestionnaire_id,
                materiel_id,
                categorie,
                date_debut,
                date_fin,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle de l'utilisateur
            if (req.userType === 'UTILISATEUR') {
                options.utilisateur_id = req.userId;
            } else if (req.userType === 'TECHNICIEN') {
                // Les techniciens voient leurs demandes assignées + toutes les demandes créées
                if (!options.technicien_id && !options.statut) {
                    options.technicien_id = req.userId;
                }
            }

            const demandes = await DemandeIntervention.findAllWithDetails(options);

            // Compter le total pour la pagination
            let total;
            if (req.userType === 'UTILISATEUR') {
                total = await DemandeIntervention.count({ id_utilisateur: req.userId });
            } else if (req.userType === 'TECHNICIEN' && !Object.keys(req.query).length) {
                total = await DemandeIntervention.count({ id_technicien: req.userId });
            } else {
                total = await DemandeIntervention.count();
            }

            res.json({
                success: true,
                data: {
                    demandes,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des demandes:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir une demande par ID
    async getDemandeById(req, res) {
        try {
            console.log('🔍 === DEBUG RÉCUPÉRATION DEMANDE ===');
            console.log('📝 ID demandé:', req.params.id);
            console.log('👤 User ID:', req.userId, 'Type:', req.userType);

            const { id } = req.params;
            
            console.log('⏳ Appel de findByIdWithDetails...');
            const demande = await DemandeIntervention.findByIdWithDetails(id);
            
            console.log('📄 Résultat demande:', demande ? 'TROUVÉE' : 'NULL');
            if (demande) {
                console.log('📊 Détails:', {
                    id_demande: demande.id_demande,
                    titre: demande.titre,
                    id_utilisateur: demande.id_utilisateur,
                    statut: demande.statut
                });
            }

            if (!demande) {
                console.log('❌ Demande introuvable - retour 404');
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            // Vérifier les permissions
            console.log('🔒 Vérification permissions:', {
                userType: req.userType,
                userId: req.userId,
                demandeUserId: demande.id_utilisateur,
                isOwner: demande.id_utilisateur === req.userId
            });

            if (req.userType === 'UTILISATEUR' && demande.id_utilisateur !== req.userId) {
                console.log('❌ Accès refusé - pas le propriétaire');
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette demande'
                });
            }

            console.log('✅ Accès autorisé - retour des données');
            res.json({
                success: true,
                data: { demande }
            });

        } catch (error) {
            console.error('❌ ERREUR getDemandeById:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Créer une nouvelle demande d'intervention
    async createDemande(req, res) {
        try {
            const demandeData = {
                ...req.body,
                id_utilisateur: req.userType === 'UTILISATEUR' ? req.userId : req.body.id_utilisateur
            };

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(demandeData.id_materiel);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel spécifié introuvable'
                });
            }

            // Pour les utilisateurs normaux, s'assurer qu'ils ne peuvent créer que pour eux-mêmes
            if (req.userType === 'UTILISATEUR') {
                demandeData.id_utilisateur = req.userId;
            }

            const newDemande = await DemandeIntervention.create(demandeData);

            // Récupérer la demande complète
            const fullDemande = await DemandeIntervention.findByIdWithDetails(newDemande.id);

            // Créer notification pour TOUS les gestionnaires
            console.log('📢 Notification nouvelle demande créée...');
            try {
                // Récupérer tous les gestionnaires
                const gestionnaires = await Gestionnaire.findAll();
                console.log('👥 Gestionnaires trouvés:', gestionnaires.length);
                
                for (const gestionnaire of gestionnaires) {
                    await Notification.create({
                        message: `Nouvelle demande d'intervention: "${demandeData.titre}" (${demandeData.urgence})`,
                        type: 'NOUVELLE_DEMANDE',
                        id_demande: newDemande.id,
                        id_destinataire: gestionnaire.id_gestionnaire
                    });
                }
                console.log('📨 Notifications gestionnaires créées');
            } catch (notifError) {
                console.error('❌ Erreur notification nouvelle demande:', notifError);
            }

            res.status(201).json({
                success: true,
                message: 'Demande d\'intervention créée avec succès',
                data: { demande: fullDemande }
            });

        } catch (error) {
            console.error('Erreur lors de la création de la demande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Mettre à jour une demande d'intervention
    async updateDemande(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(id);
            if (!demande) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            // Vérifier les permissions
            if (req.userType === 'UTILISATEUR') {
                if (demande.id_utilisateur !== req.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès non autorisé à cette demande'
                    });
                }
                
                // Les utilisateurs ne peuvent modifier que certains champs
                if (demande.statut !== 'CREEE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Impossible de modifier une demande déjà traitée'
                    });
                }
            }

            const updatedDemande = await DemandeIntervention.update(id, updateData);

            // Récupérer la demande complète mise à jour
            const fullDemande = await DemandeIntervention.findByIdWithDetails(id);

            res.json({
                success: true,
                message: 'Demande d\'intervention mise à jour avec succès',
                data: { demande: fullDemande }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la demande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Supprimer une demande d'intervention
    async deleteDemande(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(id);
            if (!demande) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            // Vérifier les permissions
            if (req.userType === 'UTILISATEUR' && demande.id_utilisateur !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette demande'
                });
            }

            const deleted = await DemandeIntervention.delete(id);

            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer cette demande'
                });
            }

            res.json({
                success: true,
                message: 'Demande d\'intervention supprimée avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de la demande:', error);
            
            if (error.message.includes('déjà traitée')) {
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

    // Changer le statut d'une demande
    async changeStatut(req, res) {
        try {
            console.log('🔄 === DEBUG CHANGE STATUT ===');
            console.log('📝 ID demande:', req.params.id);
            console.log('👤 User:', req.userId, req.userType);
            console.log('📊 Body:', req.body);

            const { id } = req.params;
            const { statut, raison_refus } = req.body;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(id);
            console.log('📋 Demande trouvée:', demande);
            
            if (!demande) {
                console.log('❌ Demande introuvable');
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            console.log('🔍 Vérification permissions pour statut:', statut);

            // Vérifications des permissions selon le statut demandé
            if (statut === 'ACCEPTEE' && req.userType !== 'TECHNICIEN') {
                console.log('❌ Permission refusée: ACCEPTEE par non-technicien');
                return res.status(403).json({
                    success: false,
                    message: 'Seul un technicien peut accepter une demande'
                });
            }

            if (statut === 'EN_COURS' && req.userType !== 'TECHNICIEN') {
                console.log('❌ Permission refusée: EN_COURS par non-technicien');
                return res.status(403).json({
                    success: false,
                    message: 'Seul un technicien peut commencer une intervention'
                });
            }

            if (statut === 'RESOLUE' && req.userType !== 'TECHNICIEN') {
                console.log('❌ Permission refusée: RESOLUE par non-technicien');
                return res.status(403).json({
                    success: false,
                    message: 'Seul un technicien peut marquer une demande comme résolue'
                });
            }

            if (statut === 'REFUSEE') {
                console.log('🔍 Vérification REFUS - technicien:', req.userId, 'demande assignée à:', demande.id_technicien);
                // Un gestionnaire peut toujours refuser
                // Un technicien peut refuser seulement si c'est assigné à lui
                if (req.userType === 'GESTIONNAIRE') {
                    console.log('✅ REFUS autorisé - gestionnaire');
                    // OK - gestionnaire peut refuser
                } else if (req.userType === 'TECHNICIEN' && demande.id_technicien === req.userId) {
                    console.log('✅ REFUS autorisé - technicien assigné');
                    // OK - technicien peut refuser sa propre assignation
                } else {
                    console.log('❌ REFUS interdit - technicien non assigné ou autre rôle');
                    return res.status(403).json({
                        success: false,
                        message: 'Seul le technicien assigné ou un gestionnaire peut refuser une demande'
                    });
                }
            }

            if (statut === 'FERMEE') {
                if (req.userType !== 'GESTIONNAIRE' &&
                    !(req.userType === 'UTILISATEUR' && demande.id_utilisateur === req.userId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Seul le demandeur ou un gestionnaire peut fermer une demande'
                    });
                }
                if (req.userType === 'UTILISATEUR' && demande.id_utilisateur !== req.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Seul le demandeur ou un gestionnaire peut fermer une demande'
                    });
                }
            }

            // Vérifier que le technicien peut modifier cette demande
            if (req.userType === 'TECHNICIEN' && 
                demande.id_technicien && 
                demande.id_technicien !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cette demande est assignée à un autre technicien'
                });
            }

            if (req.userType === 'TECHNICIEN' &&
                ['ACCEPTEE', 'EN_COURS', 'RESOLUE'].includes(statut) &&
                demande.id_technicien !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cette demande doit vous etre assignee avant traitement'
                });
            }

            const updatedDemande = await DemandeIntervention.changerStatut(id, statut, {
                raison_refus
            });

            // Créer les notifications automatiques selon le statut
            console.log('📢 Création notifications automatiques...');
            console.log('🔄 Statut:', statut, 'User:', req.userType, 'UserID:', req.userId);
            
            try {
                switch (statut) {
                    case 'ACCEPTEE':
                        // Technicien accepte → Notifier gestionnaire et utilisateur
                        console.log('✅ Demande acceptée par technicien');
                        
                        // Notifier le gestionnaire
                        if (demande.id_gestionnaire) {
                            await Notification.create({
                                message: `Le technicien a accepté la demande "${demande.titre}".`,
                                type: 'ACCEPTATION',
                                id_demande: parseInt(id),
                                id_destinataire: demande.id_gestionnaire
                            });
                            console.log('📨 Notification gestionnaire créée');
                        }
                        
                        // Notifier l'utilisateur demandeur
                        await Notification.create({
                            message: `Votre demande "${demande.titre}" a été acceptée et va être traitée.`,
                            type: 'ACCEPTATION',
                            id_demande: parseInt(id),
                            id_destinataire: demande.id_utilisateur
                        });
                        console.log('📨 Notification utilisateur créée');
                        break;

                    case 'REFUSEE':
                        // Technicien refuse → Notifier gestionnaire et utilisateur
                        console.log('❌ Demande refusée par technicien');
                        
                        // Notifier le gestionnaire
                        if (demande.id_gestionnaire) {
                            await Notification.create({
                                message: `Le technicien a refusé la demande "${demande.titre}". Raison: ${raison_refus || 'Non spécifiée'}`,
                                type: 'REFUS',
                                id_demande: parseInt(id),
                                id_destinataire: demande.id_gestionnaire
                            });
                        }
                        
                        // Notifier l'utilisateur demandeur
                        await Notification.create({
                            message: `Votre demande "${demande.titre}" a été refusée. Raison: ${raison_refus || 'Non spécifiée'}`,
                            type: 'REFUS',
                            id_demande: parseInt(id),
                            id_destinataire: demande.id_utilisateur
                        });
                        break;

                    case 'RESOLUE':
                        // Technicien résout → Notifier gestionnaire et utilisateur
                        console.log('✅ Demande résolue par technicien');
                        
                        // Notifier le gestionnaire
                        if (demande.id_gestionnaire) {
                            await Notification.create({
                                message: `La demande "${demande.titre}" a été résolue par le technicien.`,
                                type: 'RESOLUTION',
                                id_demande: parseInt(id),
                                id_destinataire: demande.id_gestionnaire
                            });
                        }
                        
                        // Notifier l'utilisateur demandeur
                        await Notification.create({
                            message: `Votre demande "${demande.titre}" a été résolue ! Vous pouvez la fermer si vous êtes satisfait.`,
                            type: 'RESOLUTION',
                            id_demande: parseInt(id),
                            id_destinataire: demande.id_utilisateur
                        });
                        break;

                    case 'FERMEE':
                        // Demande fermée → Notifier selon qui ferme
                        console.log('🔒 Demande fermée');
                        
                        if (req.userType === 'UTILISATEUR') {
                            // Utilisateur ferme → Notifier gestionnaire
                            if (demande.id_gestionnaire) {
                                await Notification.create({
                                    message: `L'utilisateur a fermé la demande "${demande.titre}".`,
                                    type: 'CLOTURE',
                                    id_demande: parseInt(id),
                                    id_destinataire: demande.id_gestionnaire
                                });
                            }
                        } else if (req.userType === 'GESTIONNAIRE') {
                            // Gestionnaire ferme → Notifier utilisateur
                            await Notification.create({
                                message: `Votre demande "${demande.titre}" a été fermée par la gestion.`,
                                type: 'CLOTURE',
                                id_demande: parseInt(id),
                                id_destinataire: demande.id_utilisateur
                            });
                        }
                        break;
                }
            } catch (notifError) {
                console.error('❌ Erreur création notifications:', notifError);
                // Ne pas faire échouer la demande si les notifications échouent
            }

            // Récupérer la demande complète mise à jour
            const fullDemande = await DemandeIntervention.findByIdWithDetails(id);

            res.json({
                success: true,
                message: `Statut de la demande changé en ${statut}`,
                data: { demande: fullDemande }
            });

        } catch (error) {
            console.error('Erreur lors du changement de statut:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Assigner une demande à un technicien (gestionnaires seulement)
    async assignerDemande(req, res) {
        try {
            const { id } = req.params;
            const { technicien_id } = req.body;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(id);
            if (!demande) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            // Assigner la demande
            await DemandeIntervention.assignerTechnicien(id, technicien_id, req.userId);

            // Créer notification pour le technicien assigné
            console.log('🔔 Notification assignation technicien...');
            try {
                await Notification.create({
                    message: `Une nouvelle demande "${demande.titre}" vous a été assignée.`,
                    type: 'ASSIGNATION',
                    id_demande: parseInt(id),
                    id_destinataire: technicien_id
                });
                console.log('📨 Notification assignation créée');
            } catch (notifError) {
                console.error('❌ Erreur notification assignation:', notifError);
            }

            // Récupérer la demande mise à jour
            const fullDemande = await DemandeIntervention.findByIdWithDetails(id);

            res.json({
                success: true,
                message: 'Demande assignée avec succès',
                data: { demande: fullDemande }
            });

        } catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
            
            if (error.message.includes('introuvable') || 
                error.message.includes('disponible') ||
                error.message.includes('assignée')) {
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

    // Rechercher des demandes
    async searchDemandes(req, res) {
        try {
            const { q: searchTerm, statut, urgence } = req.query;
            
            const options = {
                statut,
                urgence,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle
            if (req.userType === 'UTILISATEUR') {
                options.utilisateur_id = req.userId;
            }

            const demandes = await DemandeIntervention.search(searchTerm, options);

            res.json({
                success: true,
                data: {
                    demandes,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche de demandes:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les statistiques générales des demandes
    async getDemandesStats(req, res) {
        try {
            const stats = await DemandeIntervention.getStatistiquesGenerales();
            const statsByPriorite = await DemandeIntervention.getDemandesParPriorite();
            const statsByStatut = await DemandeIntervention.getDemandesParStatut();

            res.json({
                success: true,
                data: {
                    general: stats,
                    byPriorite: statsByPriorite,
                    byStatut: statsByStatut
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les demandes en retard
    async getDemandesEnRetard(req, res) {
        try {
            const demandesEnRetard = await DemandeIntervention.getDemandesEnRetard();

            res.json({
                success: true,
                data: { demandesEnRetard }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des demandes en retard:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le tableau de bord des demandes pour l'utilisateur connecté
    async getDashboard(req, res) {
        try {
            let dashboardData = {};

            switch (req.userType) {
                case 'UTILISATEUR':
                    dashboardData = await DemandeIntervention.getTableauBordUtilisateur(req.userId);
                    break;

                case 'TECHNICIEN':
                    dashboardData = await DemandeIntervention.getTableauBordTechnicien(req.userId);
                    break;

                case 'GESTIONNAIRE':
                    dashboardData = {
                        ...await DemandeIntervention.getStatistiquesGenerales(),
                        demandesEnRetard: await DemandeIntervention.getDemandesEnRetard()
                    };
                    break;
            }

            res.json({
                success: true,
                data: { dashboard: dashboardData }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du tableau de bord:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir toutes les catégories utilisées
    async getCategories(req, res) {
        try {
            console.log('🏷️ === RÉCUPÉRATION CATÉGORIES ===');
            const categories = await DemandeIntervention.getCategories();
            console.log('📝 Catégories trouvées:', categories);
            console.log('📊 Nombre de catégories:', categories.length);

            res.json({
                success: true,
                data: { categories }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des catégories:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les demandes par statut
    async getDemandesByStatut(req, res) {
        try {
            const { statut } = req.params;

            const options = {
                statut,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle
            if (req.userType === 'UTILISATEUR') {
                options.utilisateur_id = req.userId;
            } else if (req.userType === 'TECHNICIEN') {
                options.technicien_id = req.userId;
            }

            const demandes = await DemandeIntervention.findAllWithDetails(options);
            const total = await DemandeIntervention.count({ statut });

            res.json({
                success: true,
                data: {
                    statut,
                    demandes,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des demandes par statut:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les demandes d'un utilisateur spécifique
    async getDemandesUtilisateur(req, res) {
        try {
            const { userId } = req.params;

            // Vérifier les permissions
            if (req.userType === 'UTILISATEUR' && req.userId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }

            const options = {
                utilisateur_id: userId,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const demandes = await DemandeIntervention.findAllWithDetails(options);
            const total = await DemandeIntervention.count({ id_utilisateur: userId });

            res.json({
                success: true,
                data: {
                    demandes,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des demandes utilisateur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = new DemandeController();
