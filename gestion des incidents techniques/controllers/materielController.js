const { Materiel } = require('../models');

class MaterielController {
    // Obtenir tout le matériel (avec pagination et filtres)
    async getAllMateriel(req, res) {
        try {
            const { statut, search, emplacement } = req.query;
            const options = {
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            let materiel;
            let total;

            if (search) {
                // Recherche textuelle
                materiel = await Materiel.search(search, { 
                    statut, 
                    ...options 
                });
                // Pour la pagination, on fait une recherche séparée pour le count
                const searchResults = await Materiel.search(search, { statut });
                total = searchResults.length;
            } else if (statut) {
                // Filtrer par statut
                materiel = await Materiel.findByStatut(statut, options);
                total = await Materiel.count({ statut });
            } else if (emplacement) {
                // Filtrer par emplacement
                materiel = await Materiel.findByEmplacement(emplacement, options);
                total = await Materiel.count({ emplacement });
            } else {
                // Récupérer tout
                materiel = await Materiel.findAll({}, options);
                total = await Materiel.count();
            }

            res.json({
                success: true,
                data: {
                    materiel,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du matériel:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir un matériel par ID
    async getMaterielById(req, res) {
        try {
            const { id } = req.params;
            const materiel = await Materiel.findById(id);

            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            res.json({
                success: true,
                data: { materiel }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du matériel:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Créer un nouveau matériel
    async createMateriel(req, res) {
        try {
            const materielData = req.body;

            // Vérifier l'unicité du numéro de série
            const exists = await Materiel.numeroSerieExists(materielData.numero_serie);
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: 'Ce numéro de série existe déjà'
                });
            }

            const newMateriel = await Materiel.create(materielData);

            res.status(201).json({
                success: true,
                message: 'Matériel créé avec succès',
                data: { materiel: newMateriel }
            });

        } catch (error) {
            console.error('Erreur lors de la création du matériel:', error);
            
            if (error.message.includes('numéro de série')) {
                return res.status(409).json({
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

    // Mettre à jour un matériel
    async updateMateriel(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(id);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            // Vérifier l'unicité du numéro de série si modifié
            if (updateData.numero_serie && updateData.numero_serie !== materiel.numero_serie) {
                const exists = await Materiel.numeroSerieExists(updateData.numero_serie, id);
                if (exists) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ce numéro de série existe déjà'
                    });
                }
            }

            const updatedMateriel = await Materiel.update(id, updateData);

            res.json({
                success: true,
                message: 'Matériel mis à jour avec succès',
                data: { materiel: updatedMateriel }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du matériel:', error);
            
            if (error.message.includes('numéro de série')) {
                return res.status(409).json({
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

    // Supprimer un matériel
    async deleteMateriel(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(id);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            const deleted = await Materiel.delete(id);

            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer ce matériel'
                });
            }

            res.json({
                success: true,
                message: 'Matériel supprimé avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression du matériel:', error);
            
            if (error.message.includes('demandes d\'intervention')) {
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

    // Rechercher du matériel
    async searchMateriel(req, res) {
        try {
            const { q: searchTerm, statut } = req.query;
            
            const options = {
                statut,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const materiel = await Materiel.search(searchTerm, options);

            res.json({
                success: true,
                data: {
                    materiel,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche de matériel:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Changer le statut d'un matériel
    async changeStatut(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.body;

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(id);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            const updatedMateriel = await Materiel.changerStatut(id, statut);

            res.json({
                success: true,
                message: `Statut du matériel changé en ${statut}`,
                data: { materiel: updatedMateriel }
            });

        } catch (error) {
            console.error('Erreur lors du changement de statut:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir l'historique des demandes pour un matériel
    async getMaterielHistory(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.query;

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(id);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            const options = {
                statut,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const demandes = await Materiel.getHistoriqueDemandes(id, options);

            res.json({
                success: true,
                data: {
                    materiel,
                    demandes,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les statistiques d'un matériel
    async getMaterielStats(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que le matériel existe
            const materiel = await Materiel.findById(id);
            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel introuvable'
                });
            }

            const stats = await Materiel.getStatistiques(id);

            res.json({
                success: true,
                data: {
                    materiel,
                    stats
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

    // Obtenir les statistiques globales du matériel
    async getGlobalMaterielStats(req, res) {
        try {
            const statsByStatut = await Materiel.getStatistiquesParStatut();

            res.json({
                success: true,
                data: {
                    statsByStatut
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques globales:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir tous les emplacements
    async getEmplacements(req, res) {
        try {
            const emplacements = await Materiel.getEmplacements();

            res.json({
                success: true,
                data: { emplacements }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des emplacements:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le matériel par emplacement
    async getMaterielByEmplacement(req, res) {
        try {
            const { emplacement } = req.params;

            const options = {
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const materiel = await Materiel.findByEmplacement(emplacement, options);

            res.json({
                success: true,
                data: {
                    emplacement,
                    materiel,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du matériel par emplacement:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le matériel nécessitant une attention
    async getMaterielAttention(req, res) {
        try {
            const materielAttention = await Materiel.getMaterielAttention();

            res.json({
                success: true,
                data: { materielAttention }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du matériel nécessitant une attention:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le rapport de maintenance préventive
    async getMaintenanceReport(req, res) {
        try {
            const rapport = await Materiel.getRapportMaintenancePreventive();

            res.json({
                success: true,
                data: { rapport }
            });

        } catch (error) {
            console.error('Erreur lors de la génération du rapport de maintenance:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Trouver du matériel par numéro de série
    async findByNumeroSerie(req, res) {
        try {
            const { numeroSerie } = req.params;

            const materiel = await Materiel.findByNumeroSerie(numeroSerie);

            if (!materiel) {
                return res.status(404).json({
                    success: false,
                    message: 'Matériel avec ce numéro de série introuvable'
                });
            }

            res.json({
                success: true,
                data: { materiel }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche par numéro de série:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le matériel par statut
    async getMaterielByStatut(req, res) {
        try {
            const { statut } = req.params;

            const options = {
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const materiel = await Materiel.findByStatut(statut, options);
            const total = await Materiel.count({ statut });

            res.json({
                success: true,
                data: {
                    statut,
                    materiel,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du matériel par statut:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = new MaterielController();