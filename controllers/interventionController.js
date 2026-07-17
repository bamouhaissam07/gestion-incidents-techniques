const { Intervention, DemandeIntervention, Notification } = require('../models');

class InterventionController {
    // Obtenir toutes les interventions (avec pagination et filtres)
    async getAllInterventions(req, res) {
        try {
            const { technicien_id, demande_id, probleme_resolu, date_debut, date_fin, urgence } = req.query;

            const options = {
                technicien_id,
                demande_id,
                probleme_resolu: probleme_resolu !== undefined ? probleme_resolu === 'true' : undefined,
                date_debut,
                date_fin,
                urgence,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle de l'utilisateur
            if (req.userType === 'TECHNICIEN') {
                options.technicien_id = req.userId;
            }

            const interventions = await Intervention.findAllWithDetails(options);
            const total = req.userType === 'TECHNICIEN' 
                ? await Intervention.count({ id_technicien: req.userId })
                : await Intervention.count();

            res.json({
                success: true,
                data: {
                    interventions,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des interventions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir une intervention par ID
    async getInterventionById(req, res) {
        try {
            const { id } = req.params;
            const intervention = await Intervention.findByIdWithDetails(id);

            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention introuvable'
                });
            }

            // Vérifier les permissions pour les techniciens
            if (req.userType === 'TECHNICIEN' && intervention.id_technicien !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette intervention'
                });
            }

            res.json({
                success: true,
                data: { intervention }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'intervention:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Créer une nouvelle intervention
    async createIntervention(req, res) {
        try {
            const interventionData = {
                ...req.body,
                id_technicien: req.userId // Le technicien connecté
            };

            const newIntervention = await Intervention.createInterventionComplete(interventionData);
            const fullIntervention = await Intervention.findByIdWithDetails(newIntervention.id_intervention);

            // Créer notification pour l'utilisateur et gestionnaire
            console.log('🔧 Notification nouvelle intervention...');
            try {
                // Récupérer la demande pour avoir les infos
                const demande = await DemandeIntervention.findById(interventionData.id_demande);
                
                if (demande) {
                    // Notifier l'utilisateur demandeur
                    await Notification.create({
                        message: `Une intervention a été enregistrée sur votre demande "${demande.titre}".`,
                        type: 'INTERVENTION',
                        id_demande: demande.id_demande,
                        id_destinataire: demande.id_utilisateur
                    });

                    // Notifier le gestionnaire si assigné
                    if (demande.id_gestionnaire) {
                        await Notification.create({
                            message: `Nouvelle intervention enregistrée sur la demande "${demande.titre}".`,
                            type: 'INTERVENTION',
                            id_demande: demande.id_demande,
                            id_destinataire: demande.id_gestionnaire
                        });
                    }
                    console.log('📨 Notifications intervention créées');
                }
            } catch (notifError) {
                console.error('❌ Erreur notification intervention:', notifError);
            }

            res.status(201).json({
                success: true,
                message: 'Intervention créée avec succès',
                data: { intervention: fullIntervention }
            });

        } catch (error) {
            console.error('Erreur lors de la création de l\'intervention:', error);
            
            if (error.message.includes('introuvable') || 
                error.message.includes('assignée') ||
                error.message.includes('existe déjà')) {
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
    // Mettre à jour une intervention
    async updateIntervention(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const intervention = await Intervention.findById(id);
            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention introuvable'
                });
            }

            // Vérifier les permissions pour les techniciens
            if (req.userType === 'TECHNICIEN' && intervention.id_technicien !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette intervention'
                });
            }

            await Intervention.updateInterventionComplete(id, updateData);
            const updatedIntervention = await Intervention.findByIdWithDetails(id);

            res.json({
                success: true,
                message: 'Intervention mise à jour avec succès',
                data: { intervention: updatedIntervention }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'intervention:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Supprimer une intervention
    async deleteIntervention(req, res) {
        try {
            const { id } = req.params;

            const intervention = await Intervention.findById(id);
            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention introuvable'
                });
            }

            // Vérifier les permissions pour les techniciens
            if (req.userType === 'TECHNICIEN' && intervention.id_technicien !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette intervention'
                });
            }

            await Intervention.delete(id);

            res.json({
                success: true,
                message: 'Intervention supprimée avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de l\'intervention:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir l'intervention d'une demande spécifique
    async getInterventionByDemande(req, res) {
        try {
            const { demandeId } = req.params;

            const intervention = await Intervention.findByDemandeId(demandeId);

            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune intervention trouvée pour cette demande'
                });
            }

            const fullIntervention = await Intervention.findByIdWithDetails(intervention.id_intervention);

            res.json({
                success: true,
                data: { intervention: fullIntervention }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'intervention par demande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Rechercher des interventions
    async searchInterventions(req, res) {
        try {
            const { q: searchTerm, technicien_id, probleme_resolu } = req.query;
            
            const options = {
                technicien_id: req.userType === 'TECHNICIEN' ? req.userId : technicien_id,
                probleme_resolu: probleme_resolu !== undefined ? probleme_resolu === 'true' : undefined,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const interventions = await Intervention.search(searchTerm, options);

            res.json({
                success: true,
                data: {
                    interventions,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche d\'interventions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
    // Obtenir les statistiques des interventions
    async getInterventionStats(req, res) {
        try {
            const { technicien_id, date_debut, date_fin } = req.query;

            const options = {};
            
            if (req.userType === 'TECHNICIEN') {
                options.technicien_id = req.userId;
            } else if (technicien_id) {
                options.technicien_id = technicien_id;
            }

            if (date_debut) options.date_debut = date_debut;
            if (date_fin) options.date_fin = date_fin;

            const stats = await Intervention.getStatistiques(options);

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

    // Obtenir les statistiques par technicien (gestionnaires seulement)
    async getStatsByTechnicien(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const options = {};
            if (date_debut) options.date_debut = date_debut;
            if (date_fin) options.date_fin = date_fin;

            const stats = await Intervention.getStatistiquesByTechnicien(options);

            res.json({
                success: true,
                data: { statsByTechnicien: stats }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques par technicien:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les interventions par période
    async getInterventionsByPeriod(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const interventionsByPeriod = await Intervention.getInterventionsByPeriod(date_debut, date_fin);

            res.json({
                success: true,
                data: { interventionsByPeriod }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des interventions par période:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le top des pièces les plus remplacées
    async getTopPiecesRemplacees(req, res) {
        try {
            const { limit = 10 } = req.query;

            const topPieces = await Intervention.getTopPiecesRemplacees(parseInt(limit));

            res.json({
                success: true,
                data: { topPieces }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du top des pièces:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les interventions d'un technicien
    async getInterventionsByTechnicien(req, res) {
        try {
            const { technicienId } = req.params;
            const { date_debut, date_fin, probleme_resolu } = req.query;

            // Vérifier les permissions
            if (req.userType === 'TECHNICIEN' && req.userId.toString() !== technicienId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }

            const options = {
                date_debut,
                date_fin,
                probleme_resolu: probleme_resolu !== undefined ? probleme_resolu === 'true' : undefined,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const interventions = await Intervention.getInterventionsByTechnicien(technicienId, options);

            res.json({
                success: true,
                data: {
                    interventions,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des interventions par technicien:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = new InterventionController();