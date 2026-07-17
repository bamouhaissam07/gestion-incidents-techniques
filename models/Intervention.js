const BaseModel = require('./BaseModel');

class Intervention extends BaseModel {
    constructor() {
        super('intervention');
        this.primaryKey = 'id_intervention';
    }

    // Créer une intervention (compte-rendu technique)
    async create(data) {
        // Valeurs par défaut
        const interventionData = {
            date_intervention: new Date(),
            probleme_resolu: false,
            ...data
        };
        
        return await super.create(interventionData);
    }

    // Obtenir toutes les interventions avec détails complets
    async findAllWithDetails(options = {}) {
        let sql = `
            SELECT 
                i.id_intervention,
                i.date_intervention,
                i.actions_prises,
                i.pieces_remplacees,
                i.probleme_resolu,
                i.id_demande,
                i.id_technicien,
                di.titre as demande_titre,
                di.description as demande_description,
                di.urgence as demande_urgence,
                di.statut as demande_statut,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie,
                m.emplacement as materiel_emplacement,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom,
                tech.specialite as technicien_specialite,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                u.departement as utilisateur_departement
            FROM intervention i
            INNER JOIN demande_intervention di ON i.id_demande = di.id_demande
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            INNER JOIN technicien tech ON i.id_technicien = tech.id_technicien
            INNER JOIN personne t_tech ON tech.id_technicien = t_tech.id_personne
        `;
        
        const params = [];
        const conditions = [];
        
        // Filtres
        if (options.intervention_id) {
            conditions.push('i.id_intervention = ?');
            params.push(options.intervention_id);
        }

        if (options.technicien_id) {
            conditions.push('i.id_technicien = ?');
            params.push(options.technicien_id);
        }
        
        if (options.demande_id) {
            conditions.push('i.id_demande = ?');
            params.push(options.demande_id);
        }
        
        if (options.probleme_resolu !== undefined) {
            conditions.push('i.probleme_resolu = ?');
            params.push(options.probleme_resolu);
        }
        
        if (options.date_debut) {
            conditions.push('DATE(i.date_intervention) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(i.date_intervention) <= ?');
            params.push(options.date_fin);
        }
        
        if (options.urgence) {
            conditions.push('di.urgence = ?');
            params.push(options.urgence);
        }
        
        // Ajouter les conditions WHERE
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Ordonner
        sql += ' ORDER BY i.date_intervention DESC';
        
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

    // Obtenir une intervention par ID avec tous les détails
    async findByIdWithDetails(id) {
        const results = await this.findAllWithDetails({ intervention_id: id, limit: 1 });
        return results[0] || null;
    }

    // Trouver l'intervention d'une demande spécifique
    async findByDemandeId(demandeId) {
        const sql = `
            SELECT * FROM intervention 
            WHERE id_demande = ?
        `;
        
        const results = await this.customQuery(sql, [demandeId]);
        return results[0] || null;
    }

    // Obtenir les interventions d'un technicien
    async getInterventionsByTechnicien(technicienId, options = {}) {
        const filterOptions = {
            technicien_id: technicienId,
            ...options
        };
        
        return await this.findAllWithDetails(filterOptions);
    }

    // Créer une intervention complète avec mise à jour de la demande
    async createInterventionComplete(data) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier que la demande existe et est assignée au technicien
            const [demande] = await connection.execute(
                'SELECT statut, id_technicien FROM demande_intervention WHERE id_demande = ?',
                [data.id_demande]
            );
            
            if (!demande[0]) {
                throw new Error('Demande d\'intervention introuvable');
            }
            
            if (demande[0].id_technicien !== data.id_technicien) {
                throw new Error('Cette demande n\'est pas assignée à ce technicien');
            }
            
            if (!['ASSIGNEE', 'ACCEPTEE', 'EN_COURS'].includes(demande[0].statut)) {
                throw new Error('Impossible de créer une intervention pour cette demande');
            }
            
            // Vérifier qu'il n'y a pas déjà d'intervention pour cette demande
            const [existingIntervention] = await connection.execute(
                'SELECT id_intervention FROM intervention WHERE id_demande = ?',
                [data.id_demande]
            );
            
            if (existingIntervention[0]) {
                throw new Error('Une intervention existe déjà pour cette demande');
            }
            
            // Créer l'intervention
            const [result] = await connection.execute(
                `INSERT INTO intervention (date_intervention, actions_prises, pieces_remplacees, probleme_resolu, id_demande, id_technicien) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.date_intervention || new Date(),
                    data.actions_prises || null,
                    data.pieces_remplacees || null,
                    data.probleme_resolu || false,
                    data.id_demande,
                    data.id_technicien
                ]
            );
            
            // Mettre à jour le statut de la demande
            const nouveauStatut = data.probleme_resolu ? 'RESOLUE' : 'EN_COURS';
            const datesCloture = data.probleme_resolu ? 'NOW()' : 'NULL';
            
            await connection.execute(
                `UPDATE demande_intervention 
                 SET statut = ?, date_cloture = ${datesCloture} 
                 WHERE id_demande = ?`,
                [nouveauStatut, data.id_demande]
            );
            
            return {
                id_intervention: result.insertId,
                ...data
            };
        });
    }

    // Mettre à jour une intervention avec gestion du statut de la demande
    async updateInterventionComplete(id, data) {
        return await this.executeTransaction(async (connection) => {
            // Récupérer l'intervention actuelle
            const [intervention] = await connection.execute(
                'SELECT id_demande, probleme_resolu FROM intervention WHERE id_intervention = ?',
                [id]
            );
            
            if (!intervention[0]) {
                throw new Error('Intervention introuvable');
            }
            
            // Mettre à jour l'intervention
            const updateFields = [];
            const updateValues = [];
            
            if (data.actions_prises !== undefined) {
                updateFields.push('actions_prises = ?');
                updateValues.push(data.actions_prises);
            }
            
            if (data.pieces_remplacees !== undefined) {
                updateFields.push('pieces_remplacees = ?');
                updateValues.push(data.pieces_remplacees);
            }
            
            if (data.probleme_resolu !== undefined) {
                updateFields.push('probleme_resolu = ?');
                updateValues.push(data.probleme_resolu);
            }
            
            if (data.date_intervention !== undefined) {
                updateFields.push('date_intervention = ?');
                updateValues.push(data.date_intervention);
            }
            
            if (updateFields.length > 0) {
                updateValues.push(id);
                await connection.execute(
                    `UPDATE intervention SET ${updateFields.join(', ')} WHERE id_intervention = ?`,
                    updateValues
                );
            }
            
            // Mettre à jour le statut de la demande si le problème est résolu/non résolu
            if (data.probleme_resolu !== undefined && 
                data.probleme_resolu !== intervention[0].probleme_resolu) {
                
                const nouveauStatut = data.probleme_resolu ? 'RESOLUE' : 'EN_COURS';
                const dateClotureClause = data.probleme_resolu ? 'date_cloture = NOW()' : 'date_cloture = NULL';
                
                await connection.execute(
                    `UPDATE demande_intervention 
                     SET statut = ?, ${dateClotureClause} 
                     WHERE id_demande = ?`,
                    [nouveauStatut, intervention[0].id_demande]
                );
            }
            
            return true;
        });
    }

    // Obtenir les statistiques des interventions
    async getStatistiques(options = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_interventions,
                SUM(CASE WHEN probleme_resolu = true THEN 1 ELSE 0 END) as problemes_resolus,
                SUM(CASE WHEN probleme_resolu = false THEN 1 ELSE 0 END) as problemes_non_resolus,
                AVG(CASE 
                    WHEN di.date_cloture IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, di.date_creation, i.date_intervention) 
                    ELSE NULL 
                END) as delai_moyen_intervention_heures,
                COUNT(CASE WHEN i.pieces_remplacees IS NOT NULL AND i.pieces_remplacees != '' THEN 1 END) as interventions_avec_pieces
            FROM intervention i
            INNER JOIN demande_intervention di ON i.id_demande = di.id_demande
        `;
        
        const params = [];
        const conditions = [];
        
        if (options.technicien_id) {
            conditions.push('i.id_technicien = ?');
            params.push(options.technicien_id);
        }
        
        if (options.date_debut) {
            conditions.push('DATE(i.date_intervention) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(i.date_intervention) <= ?');
            params.push(options.date_fin);
        }
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        const results = await this.customQuery(sql, params);
        return results[0] || {};
    }

    // Obtenir les statistiques par technicien
    async getStatistiquesByTechnicien(options = {}) {
        let sql = `
            SELECT 
                i.id_technicien,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom,
                tech.specialite,
                COUNT(*) as total_interventions,
                SUM(CASE WHEN i.probleme_resolu = true THEN 1 ELSE 0 END) as problemes_resolus,
                AVG(CASE 
                    WHEN di.date_cloture IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, di.date_creation, i.date_intervention) 
                    ELSE NULL 
                END) as delai_moyen_heures
            FROM intervention i
            INNER JOIN demande_intervention di ON i.id_demande = di.id_demande
            INNER JOIN technicien tech ON i.id_technicien = tech.id_technicien
            INNER JOIN personne t_tech ON tech.id_technicien = t_tech.id_personne
        `;
        
        const params = [];
        const conditions = [];
        
        if (options.date_debut) {
            conditions.push('DATE(i.date_intervention) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(i.date_intervention) <= ?');
            params.push(options.date_fin);
        }
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += `
            GROUP BY i.id_technicien, t_tech.nom, t_tech.prenom, tech.specialite
            ORDER BY problemes_resolus DESC, total_interventions DESC
        `;
        
        return await this.customQuery(sql, params);
    }

    // Obtenir les interventions par période
    async getInterventionsByPeriod(dateDebut, dateFin) {
        const sql = `
            SELECT 
                DATE(i.date_intervention) as date,
                COUNT(*) as total_interventions,
                SUM(CASE WHEN i.probleme_resolu = true THEN 1 ELSE 0 END) as problemes_resolus,
                COUNT(DISTINCT i.id_technicien) as techniciens_actifs
            FROM intervention i
            WHERE DATE(i.date_intervention) BETWEEN ? AND ?
            GROUP BY DATE(i.date_intervention)
            ORDER BY date
        `;
        
        return await this.customQuery(sql, [dateDebut, dateFin]);
    }

    // Rechercher des interventions
    async search(searchTerm, options = {}) {
        let sql = `
            SELECT 
                i.id_intervention,
                i.date_intervention,
                i.actions_prises,
                i.pieces_remplacees,
                i.probleme_resolu,
                di.titre as demande_titre,
                di.urgence,
                m.nom as materiel_nom,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom
            FROM intervention i
            INNER JOIN demande_intervention di ON i.id_demande = di.id_demande
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN technicien tech ON i.id_technicien = tech.id_technicien
            INNER JOIN personne t_tech ON tech.id_technicien = t_tech.id_personne
            WHERE (i.actions_prises LIKE ? OR i.pieces_remplacees LIKE ? OR di.titre LIKE ? OR m.nom LIKE ?)
        `;
        
        const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
        
        // Filtres additionnels
        if (options.technicien_id) {
            sql += ' AND i.id_technicien = ?';
            params.push(options.technicien_id);
        }
        
        if (options.probleme_resolu !== undefined) {
            sql += ' AND i.probleme_resolu = ?';
            params.push(options.probleme_resolu);
        }
        
        sql += ' ORDER BY i.date_intervention DESC';
        
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

    // Supprimer une intervention
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Récupérer l'intervention et la demande associée
            const [intervention] = await connection.execute(
                `SELECT i.id_demande, di.statut 
                 FROM intervention i 
                 INNER JOIN demande_intervention di ON i.id_demande = di.id_demande 
                 WHERE i.id_intervention = ?`,
                [id]
            );
            
            if (!intervention[0]) {
                throw new Error('Intervention introuvable');
            }
            
            // Supprimer l'intervention
            const [result] = await connection.execute(
                'DELETE FROM intervention WHERE id_intervention = ?',
                [id]
            );
            
            // Remettre la demande en statut ASSIGNEE si elle était RESOLUE ou EN_COURS
            if (['RESOLUE', 'EN_COURS'].includes(intervention[0].statut)) {
                await connection.execute(
                    'UPDATE demande_intervention SET statut = "ASSIGNEE", date_cloture = NULL WHERE id_demande = ?',
                    [intervention[0].id_demande]
                );
            }
            
            return result.affectedRows > 0;
        });
    }

    // Obtenir le top des pièces les plus remplacées
    async getTopPiecesRemplacees(limit = 10) {
        const sql = `
            SELECT 
                pieces_remplacees,
                COUNT(*) as frequency,
                COUNT(DISTINCT id_technicien) as techniciens_concernes
            FROM intervention 
            WHERE pieces_remplacees IS NOT NULL 
                AND pieces_remplacees != ''
                AND pieces_remplacees != 'Aucune'
            GROUP BY pieces_remplacees
            ORDER BY frequency DESC
            LIMIT ?
        `;
        
        return await this.customQuery(sql, [limit]);
    }
}

module.exports = new Intervention();
