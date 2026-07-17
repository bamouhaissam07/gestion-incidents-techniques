const { Notification, DemandeIntervention } = require('../models');

class NotificationController {
    // Obtenir toutes les notifications (filtré selon le rôle)
    async getAllNotifications(req, res) {
        try {
            const { type, lue, date_debut, date_fin, demande_id } = req.query;

            const options = {
                type,
                lue: lue !== undefined ? lue === 'true' : undefined,
                date_debut,
                date_fin,
                demande_id,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Les utilisateurs ne voient que leurs propres notifications
            if (req.userType !== 'GESTIONNAIRE') {
                options.destinataire_id = req.userId;
            }

            const notifications = await Notification.findAllWithDetails(options);

            // Compter le total pour la pagination
            const total = req.userType === 'GESTIONNAIRE' 
                ? await Notification.count()
                : await Notification.count({ id_destinataire: req.userId });

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir une notification par ID
    async getNotificationById(req, res) {
        try {
            const { id } = req.params;
            
            const notification = await Notification.findById(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification introuvable'
                });
            }

            // Vérifier les permissions (sauf gestionnaires)
            if (req.userType !== 'GESTIONNAIRE' && notification.id_destinataire !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette notification'
                });
            }

            // Récupérer les détails complets
            const notifications = await Notification.findAllWithDetails({ limit: 1 });
            const fullNotification = notifications.find(n => n.id_notification == id);

            res.json({
                success: true,
                data: { notification: fullNotification || notification }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de la notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Créer une notification (gestionnaires seulement)
    async createNotification(req, res) {
        try {
            const { message, type, id_demande, id_destinataire } = req.body;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(id_demande);
            if (!demande) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention spécifiée introuvable'
                });
            }

            const newNotification = await Notification.create({
                message,
                type,
                id_demande,
                id_destinataire
            });

            // Récupérer la notification complète
            const notifications = await Notification.findAllWithDetails({ limit: 1 });
            const fullNotification = notifications.find(n => n.id_notification == newNotification.id);

            res.status(201).json({
                success: true,
                message: 'Notification créée avec succès',
                data: { notification: fullNotification || newNotification }
            });

        } catch (error) {
            console.error('Erreur lors de la création de la notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Marquer une notification comme lue
    async markAsRead(req, res) {
        try {
            const { id } = req.params;

            const notification = await Notification.findById(id);
            if (!notification) {
                return res.status(404).json({ success: false, message: 'Notification introuvable' });
            }
            if (req.userType !== 'GESTIONNAIRE' && notification.id_destinataire !== req.userId) {
                return res.status(403).json({ success: false, message: 'Accès non autorisé à cette notification' });
            }

            await Notification.update(id, { lue: true });

            res.json({
                success: true,
                message: 'Notification marquée comme lue'
            });

        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
            
            if (error.message.includes('introuvable') || error.message.includes('autorisé')) {
                return res.status(403).json({
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

    // Marquer toutes les notifications comme lues
    async markAllAsRead(req, res) {
        try {
            const count = await Notification.marquerToutesLues(req.userId);

            res.json({
                success: true,
                message: `${count} notification(s) marquée(s) comme lues`
            });

        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir le nombre de notifications non lues
    async getUnreadCount(req, res) {
        try {
            const count = await Notification.compterNonLues(req.userId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });

        } catch (error) {
            console.error('Erreur lors du comptage des notifications non lues:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les notifications de l'utilisateur connecté
    async getMyNotifications(req, res) {
        try {
            const { type, lue } = req.query;

            const options = {
                type,
                lue: lue !== undefined ? lue === 'true' : undefined,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            const notifications = await Notification.getNotificationsUtilisateur(req.userId, options);
            const total = await Notification.count({ id_destinataire: req.userId });

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit,
                        total,
                        pages: Math.ceil(total / req.pagination.limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de mes notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
    // Supprimer une notification
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;

            const notification = await Notification.findById(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification introuvable'
                });
            }

            // Vérifier les permissions (propriétaire ou gestionnaire)
            if (req.userType !== 'GESTIONNAIRE' && notification.id_destinataire !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cette notification'
                });
            }

            await Notification.delete(id);

            res.json({
                success: true,
                message: 'Notification supprimée avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Rechercher des notifications
    async searchNotifications(req, res) {
        try {
            const { q: searchTerm, type, lue } = req.query;
            
            const options = {
                type,
                lue: lue !== undefined ? lue === 'true' : undefined,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle
            if (req.userType !== 'GESTIONNAIRE') {
                options.destinataire_id = req.userId;
            }

            const notifications = await Notification.search(searchTerm, options);

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche de notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les statistiques des notifications
    async getNotificationStats(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const options = {};
            
            // Filtrer selon le rôle
            if (req.userType !== 'GESTIONNAIRE') {
                options.destinataire_id = req.userId;
            }

            if (date_debut) options.date_debut = date_debut;
            if (date_fin) options.date_fin = date_fin;

            const stats = await Notification.getStatistiques(options);

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

    // Supprimer les notifications lues (nettoyage)
    async deleteReadNotifications(req, res) {
        try {
            const count = await Notification.supprimerParUtilisateur(req.userId, { 
                seulementLues: true 
            });

            res.json({
                success: true,
                message: `${count} notification(s) supprimée(s)`
            });

        } catch (error) {
            console.error('Erreur lors de la suppression des notifications lues:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Nettoyer les anciennes notifications (gestionnaires seulement)
    async cleanupOldNotifications(req, res) {
        try {
            const { days = 90 } = req.query;

            const count = await Notification.nettoyerAnciennes(parseInt(days));

            res.json({
                success: true,
                message: `${count} ancienne(s) notification(s) supprimée(s)`,
                data: { deletedCount: count }
            });

        } catch (error) {
            console.error('Erreur lors du nettoyage des notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Obtenir les notifications d'une demande spécifique
    async getNotificationsByDemande(req, res) {
        try {
            const { demandeId } = req.params;

            // Vérifier que la demande existe
            const demande = await DemandeIntervention.findById(demandeId);
            if (!demande) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande d\'intervention introuvable'
                });
            }

            const options = {
                demande_id: demandeId,
                limit: req.pagination.limit,
                offset: req.pagination.offset
            };

            // Filtrer selon le rôle
            if (req.userType !== 'GESTIONNAIRE') {
                options.destinataire_id = req.userId;
            }

            const notifications = await Notification.findAllWithDetails(options);

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page: req.pagination.page,
                        limit: req.pagination.limit
                    }
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des notifications par demande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = new NotificationController();
