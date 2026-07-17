const BaseModel = require('./BaseModel');

class Notification extends BaseModel {
    constructor() {
        super('notification');
        this.primaryKey = 'id_notification';
    }

    // Créer une notification
    async create(data) {
        const notificationData = {
            date_envoi: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format MySQL DATETIME
            lue: false,
            type: 'AUTRE',
            ...data
        };
        
        return await super.create(notificationData);
    }

    // Obtenir toutes les notifications avec détails
    async findAllWithDetails(options = {}) {
        let sql = `
            SELECT 
                n.id_notification,
                n.date_envoi,
                n.message,
                n.type,
                n.lue,
                n.id_demande,
                n.id_destinataire,
                di.titre as demande_titre,
                di.urgence as demande_urgence,
                di.statut as demande_statut,
                p.nom as destinataire_nom,
                p.prenom as destinataire_prenom,
                p.type_personne as destinataire_type
            FROM notification n
            INNER JOIN demande_intervention di ON n.id_demande = di.id_demande
            INNER JOIN personne p ON n.id_destinataire = p.id_personne
        `;
        
        const params = [];
        const conditions = [];
        
        // Filtres
        if (options.destinataire_id) {
            conditions.push('n.id_destinataire = ?');
            params.push(options.destinataire_id);
        }
        
        if (options.demande_id) {
            conditions.push('n.id_demande = ?');
            params.push(options.demande_id);
        }
        
        if (options.type) {
            conditions.push('n.type = ?');
            params.push(options.type);
        }
        
        if (options.lue !== undefined) {
            conditions.push('n.lue = ?');
            params.push(options.lue);
        }
        
        if (options.date_debut) {
            conditions.push('DATE(n.date_envoi) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(n.date_envoi) <= ?');
            params.push(options.date_fin);
        }
        
        // Ajouter les conditions WHERE
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Ordonner par date (plus récentes en premier)
        sql += ' ORDER BY n.date_envoi DESC';
        
        // Pagination
        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(options.limit));
            
            if (options.offset) {
                sql += ' OFFSET ?';
                params.push(parseInt(options.offset));
            }
        }
        
        return await this.customQuery(sql, params);
    }

    // Obtenir les notifications d'un utilisateur
    async getNotificationsUtilisateur(userId, options = {}) {
        const filterOptions = {
            destinataire_id: userId,
            ...options
        };
        
        return await this.findAllWithDetails(filterOptions);
    }

    // Marquer une notification comme lue
    async marquerCommelue(id, userId) {
        // Vérifier que la notification appartient à l'utilisateur
        const notification = await this.findById(id);
        if (!notification || notification.id_destinataire !== userId) {
            throw new Error('Notification introuvable ou accès non autorisé');
        }
        
        return await this.update(id, { lue: true });
    }

    // Marquer toutes les notifications d'un utilisateur comme lues
    async marquerToutesLues(userId) {
        const sql = `
            UPDATE notification 
            SET lue = true 
            WHERE id_destinataire = ? AND lue = false
        `;
        
        const result = await this.customQuery(sql, [userId]);
        return result.affectedRows || 0;
    }

    // Compter les notifications non lues d'un utilisateur
    async compterNonLues(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM notification 
            WHERE id_destinataire = ? AND lue = false
        `;
        
        const result = await this.customQuery(sql, [userId]);
        return result[0].count;
    }

    // Créer une notification d'assignation
    async creerNotificationAssignation(demandeId, technicienId, gestionnaireId) {
        const message = `Une nouvelle demande d'intervention vous a été assignée.`;
        
        return await this.create({
            message,
            type: 'ASSIGNATION',
            id_demande: demandeId,
            id_destinataire: technicienId
        });
    }

    // Créer une notification de refus
    async creerNotificationRefus(demandeId, utilisateurId, raison) {
        const message = `Votre demande d'intervention a été refusée. Raison: ${raison}`;
        
        return await this.create({
            message,
            type: 'REFUS',
            id_demande: demandeId,
            id_destinataire: utilisateurId
        });
    }

    // Créer une notification de résolution
    async creerNotificationResolution(demandeId, utilisateurId) {
        const message = `Votre demande d'intervention a été résolue par notre équipe technique.`;
        
        return await this.create({
            message,
            type: 'RESOLUTION',
            id_demande: demandeId,
            id_destinataire: utilisateurId
        });
    }

    // Créer une notification de clôture
    async creerNotificationCloture(demandeId, destinataireId) {
        const message = `Une demande d'intervention a été fermée.`;
        
        return await this.create({
            message,
            type: 'CLOTURE',
            id_demande: demandeId,
            id_destinataire: destinataireId
        });
    }

    // Obtenir les statistiques des notifications
    async getStatistiques(options = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_notifications,
                SUM(CASE WHEN lue = true THEN 1 ELSE 0 END) as notifications_lues,
                SUM(CASE WHEN lue = false THEN 1 ELSE 0 END) as notifications_non_lues,
                SUM(CASE WHEN type = 'ASSIGNATION' THEN 1 ELSE 0 END) as assignations,
                SUM(CASE WHEN type = 'REFUS' THEN 1 ELSE 0 END) as refus,
                SUM(CASE WHEN type = 'RESOLUTION' THEN 1 ELSE 0 END) as resolutions,
                SUM(CASE WHEN type = 'CLOTURE' THEN 1 ELSE 0 END) as clotures
            FROM notification
        `;
        
        const params = [];
        const conditions = [];
        
        if (options.destinataire_id) {
            conditions.push('id_destinataire = ?');
            params.push(options.destinataire_id);
        }
        
        if (options.date_debut) {
            conditions.push('DATE(date_envoi) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(date_envoi) <= ?');
            params.push(options.date_fin);
        }
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        const results = await this.customQuery(sql, params);
        return results[0] || {};
    }

    // Nettoyer les anciennes notifications (plus de X jours)
    async nettoyerAnciennes(joursAGarder = 90) {
        const sql = `
            DELETE FROM notification 
            WHERE date_envoi < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        
        const result = await this.customQuery(sql, [joursAGarder]);
        return result.affectedRows || 0;
    }

    // Rechercher des notifications
    async search(searchTerm, options = {}) {
        let sql = `
            SELECT 
                n.id_notification,
                n.date_envoi,
                n.message,
                n.type,
                n.lue,
                di.titre as demande_titre,
                p.nom as destinataire_nom,
                p.prenom as destinataire_prenom
            FROM notification n
            INNER JOIN demande_intervention di ON n.id_demande = di.id_demande
            INNER JOIN personne p ON n.id_destinataire = p.id_personne
            WHERE (n.message LIKE ? OR di.titre LIKE ?)
        `;
        
        const params = [`%${searchTerm}%`, `%${searchTerm}%`];
        
        // Filtres additionnels
        if (options.destinataire_id) {
            sql += ' AND n.id_destinataire = ?';
            params.push(options.destinataire_id);
        }
        
        if (options.type) {
            sql += ' AND n.type = ?';
            params.push(options.type);
        }
        
        if (options.lue !== undefined) {
            sql += ' AND n.lue = ?';
            params.push(options.lue);
        }
        
        sql += ' ORDER BY n.date_envoi DESC';
        
        // Pagination
        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(options.limit));
            
            if (options.offset) {
                sql += ' OFFSET ?';
                params.push(parseInt(options.offset));
            }
        }
        
        return await this.customQuery(sql, params);
    }

    // Supprimer les notifications d'un utilisateur
    async supprimerParUtilisateur(userId, options = {}) {
        let sql = 'DELETE FROM notification WHERE id_destinataire = ?';
        const params = [userId];
        
        // Optionnel: supprimer seulement les notifications lues
        if (options.seulementLues) {
            sql += ' AND lue = true';
        }
        
        // Optionnel: supprimer par type
        if (options.type) {
            sql += ' AND type = ?';
            params.push(options.type);
        }
        
        const result = await this.customQuery(sql, params);
        return result.affectedRows || 0;
    }
}

module.exports = new Notification();