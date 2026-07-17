const BaseModel = require('./BaseModel');

class Materiel extends BaseModel {
    constructor() {
        super('materiel');
        this.primaryKey = 'id_materiel';
    }

    // Trouver du matériel par numéro de série
    async findByNumeroSerie(numeroSerie) {
        return await this.findOne({ numero_serie: numeroSerie });
    }

    // Vérifier si le numéro de série existe déjà
    async numeroSerieExists(numeroSerie, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM materiel WHERE numero_serie = ?';
        const params = [numeroSerie];
        
        if (excludeId) {
            sql += ' AND id_materiel != ?';
            params.push(excludeId);
        }
        
        const result = await this.customQuery(sql, params);
        return result[0].count > 0;
    }

    // Obtenir le matériel par statut
    async findByStatut(statut, options = {}) {
        let sql = `
            SELECT * FROM materiel 
            WHERE statut = ?
            ORDER BY nom
        `;
        
        const params = [statut];
        
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

    // Rechercher du matériel
    async search(searchTerm, options = {}) {
        let sql = `
            SELECT * FROM materiel 
            WHERE (nom LIKE ? OR description LIKE ? OR numero_serie LIKE ? OR emplacement LIKE ?)
        `;
        
        const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
        
        // Filtrer par statut si spécifié
        if (options.statut) {
            sql += ' AND statut = ?';
            params.push(options.statut);
        }
        
        // Ordonner
        sql += ' ORDER BY nom';
        
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

    // Changer le statut du matériel
    async changerStatut(id, nouveauStatut) {
        return await this.update(id, { statut: nouveauStatut });
    }

    // Obtenir l'historique des demandes pour un matériel
    async getHistoriqueDemandes(id, options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.urgence,
                di.statut,
                di.date_creation,
                di.date_cloture,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom
            FROM demande_intervention di
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            LEFT JOIN technicien t ON di.id_technicien = t.id_technicien
            LEFT JOIN personne t_tech ON t.id_technicien = t_tech.id_personne
            WHERE di.id_materiel = ?
        `;
        
        const params = [id];
        
        // Filtrer par statut si spécifié
        if (options.statut) {
            sql += ' AND di.statut = ?';
            params.push(options.statut);
        }
        
        // Ordonner par date de création (plus récentes en premier)
        sql += ' ORDER BY di.date_creation DESC';
        
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

    // Obtenir les statistiques d'un matériel
    async getStatistiques(id) {
        const sql = `
            SELECT 
                COUNT(*) as total_demandes,
                SUM(CASE WHEN statut = 'CREEE' THEN 1 ELSE 0 END) as demandes_creees,
                SUM(CASE WHEN statut IN ('ASSIGNEE', 'EN_COURS') THEN 1 ELSE 0 END) as demandes_en_cours,
                SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) as demandes_resolues,
                SUM(CASE WHEN statut = 'REFUSEE' THEN 1 ELSE 0 END) as demandes_refusees,
                SUM(CASE WHEN urgence = 'CRITIQUE' THEN 1 ELSE 0 END) as demandes_critiques,
                COUNT(DISTINCT DATE(date_creation)) as jours_avec_demandes
            FROM demande_intervention 
            WHERE id_materiel = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || {};
    }

    // Obtenir les statistiques par statut de matériel
    async getStatistiquesParStatut() {
        const sql = `
            SELECT 
                statut,
                COUNT(*) as count
            FROM materiel 
            GROUP BY statut
            ORDER BY statut
        `;
        
        return await this.customQuery(sql);
    }

    // Obtenir le matériel par emplacement
    async findByEmplacement(emplacement, options = {}) {
        let sql = `
            SELECT * FROM materiel 
            WHERE emplacement = ?
            ORDER BY nom
        `;
        
        const params = [emplacement];
        
        // Pagination
        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(options.limit));
        }
        
        return await this.customQuery(sql, params);
    }

    // Obtenir tous les emplacements
    async getEmplacements() {
        const sql = `
            SELECT DISTINCT emplacement 
            FROM materiel 
            WHERE emplacement IS NOT NULL 
            ORDER BY emplacement
        `;
        
        const results = await this.customQuery(sql);
        return results.map(row => row.emplacement);
    }

    // Obtenir le matériel nécessitant une attention (en panne ou en maintenance)
    async getMaterielAttention() {
        const sql = `
            SELECT 
                m.id_materiel,
                m.nom,
                m.numero_serie,
                m.emplacement,
                m.statut,
                COUNT(di.id_demande) as demandes_ouvertes
            FROM materiel m
            LEFT JOIN demande_intervention di ON m.id_materiel = di.id_materiel 
                AND di.statut IN ('CREEE', 'ASSIGNEE', 'EN_COURS')
            WHERE m.statut IN ('EN_PANNE', 'EN_MAINTENANCE')
            GROUP BY m.id_materiel, m.nom, m.numero_serie, m.emplacement, m.statut
            ORDER BY demandes_ouvertes DESC, m.nom
        `;
        
        return await this.customQuery(sql);
    }

    // Créer du matériel avec validation
    async create(data) {
        // Vérifier l'unicité du numéro de série
        const exists = await this.numeroSerieExists(data.numero_serie);
        if (exists) {
            throw new Error('Ce numéro de série existe déjà');
        }
        
        return await super.create(data);
    }

    // Mettre à jour avec validation
    async update(id, data) {
        // Vérifier l'unicité du numéro de série si modifié
        if (data.numero_serie) {
            const exists = await this.numeroSerieExists(data.numero_serie, id);
            if (exists) {
                throw new Error('Ce numéro de série existe déjà');
            }
        }
        
        return await super.update(id, data);
    }

    // Supprimer du matériel
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier s'il y a des demandes associées
            const [demandes] = await connection.execute(
                'SELECT COUNT(*) as count FROM demande_intervention WHERE id_materiel = ?',
                [id]
            );
            
            if (demandes[0].count > 0) {
                throw new Error('Impossible de supprimer ce matériel : des demandes d\'intervention lui sont associées');
            }
            
            // Supprimer le matériel
            const [result] = await connection.execute(
                'DELETE FROM materiel WHERE id_materiel = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        });
    }

    // Rapport de maintenance préventive
    async getRapportMaintenancePreventive() {
        const sql = `
            SELECT 
                m.id_materiel,
                m.nom,
                m.numero_serie,
                m.emplacement,
                m.statut,
                COUNT(CASE WHEN di.date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as demandes_30j,
                COUNT(CASE WHEN di.date_creation >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 END) as demandes_90j,
                MAX(di.date_creation) as derniere_demande
            FROM materiel m
            LEFT JOIN demande_intervention di ON m.id_materiel = di.id_materiel
            GROUP BY m.id_materiel
            HAVING demandes_30j > 2 OR demandes_90j > 5 OR m.statut IN ('EN_PANNE', 'EN_MAINTENANCE')
            ORDER BY demandes_30j DESC, demandes_90j DESC
        `;
        
        return await this.customQuery(sql);
    }
}

module.exports = new Materiel();