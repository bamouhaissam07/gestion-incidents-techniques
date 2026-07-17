const BaseModel = require('./BaseModel');

class Technicien extends BaseModel {
    constructor() {
        super('technicien');
        this.primaryKey = 'id_technicien';
    }

    // Créer un technicien (avec création de la personne associée)
    async create(data) {
        return await this.executeTransaction(async (connection) => {
            // Créer d'abord la personne
            const personneData = {
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                mot_de_passe: data.mot_de_passe,
                type_personne: 'TECHNICIEN'
            };
            
            const [personneResult] = await connection.execute(
                `INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne) 
                 VALUES (?, ?, ?, ?, ?)`,
                [personneData.nom, personneData.prenom, personneData.email, 
                 personneData.mot_de_passe, personneData.type_personne]
            );
            
            // Ensuite créer le technicien
            const technicienData = {
                id_technicien: personneResult.insertId,
                specialite: data.specialite || null,
                disponibilite: data.disponibilite !== undefined ? data.disponibilite : true
            };
            
            await connection.execute(
                'INSERT INTO technicien (id_technicien, specialite, disponibilite) VALUES (?, ?, ?)',
                [technicienData.id_technicien, technicienData.specialite, technicienData.disponibilite]
            );
            
            return {
                id_technicien: personneResult.insertId,
                ...personneData,
                ...technicienData
            };
        });
    }

    // Obtenir tous les techniciens avec leurs informations personnelles
    async findAllWithPersonne(options = {}) {
        let sql = `
            SELECT 
                t.id_technicien,
                t.specialite,
                t.disponibilite,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM technicien t
            INNER JOIN personne p ON t.id_technicien = p.id_personne
        `;
        
        const params = [];
        
        // Filtrer par disponibilité si spécifié
        if (options.disponible !== undefined) {
            sql += ' WHERE t.disponibilite = ?';
            params.push(options.disponible);
        }
        
        // Ordonner
        sql += ' ORDER BY t.disponibilite DESC, p.nom, p.prenom';
        
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

    // Trouver un technicien par ID avec ses informations personnelles
    async findByIdWithPersonne(id) {
        const sql = `
            SELECT 
                t.id_technicien,
                t.specialite,
                t.disponibilite,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM technicien t
            INNER JOIN personne p ON t.id_technicien = p.id_personne
            WHERE t.id_technicien = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || null;
    }

    // Obtenir les techniciens disponibles
    async findAvailable(specialite = null) {
        let sql = `
            SELECT 
                t.id_technicien,
                t.specialite,
                p.nom,
                p.prenom,
                p.email
            FROM technicien t
            INNER JOIN personne p ON t.id_technicien = p.id_personne
            WHERE t.disponibilite = true
        `;
        
        const params = [];
        
        if (specialite) {
            sql += ' AND t.specialite = ?';
            params.push(specialite);
        }
        
        sql += ' ORDER BY p.nom, p.prenom';
        
        return await this.customQuery(sql, params);
    }

    // Changer la disponibilité d'un technicien
    async setDisponibilite(id, disponibilite) {
        return await this.update(id, { disponibilite });
    }

    // Obtenir les interventions assignées à un technicien
    async getDemandesAssignees(id, options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.urgence,
                di.statut,
                di.date_creation,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            WHERE di.id_technicien = ?
        `;
        
        const params = [id];
        
        // Filtrer par statut si spécifié
        if (options.statut) {
            sql += ' AND di.statut = ?';
            params.push(options.statut);
        }
        
        // Ordonner par urgence et date
        sql += ' ORDER BY FIELD(di.urgence, "CRITIQUE", "HAUTE", "MOYENNE", "BASSE"), di.date_creation';
        
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

    // Obtenir les interventions réalisées par un technicien
    async getInterventionsRealisees(id, options = {}) {
        let sql = `
            SELECT 
                i.id_intervention,
                i.date_intervention,
                i.actions_prises,
                i.pieces_remplacees,
                i.probleme_resolu,
                di.titre as demande_titre,
                di.urgence,
                m.nom as materiel_nom
            FROM intervention i
            INNER JOIN demande_intervention di ON i.id_demande = di.id_demande
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            WHERE i.id_technicien = ?
        `;
        
        const params = [id];
        
        // Filtrer par période si spécifiée
        if (options.dateDebut) {
            sql += ' AND i.date_intervention >= ?';
            params.push(options.dateDebut);
        }
        
        if (options.dateFin) {
            sql += ' AND i.date_intervention <= ?';
            params.push(options.dateFin);
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

    // Obtenir les statistiques d'un technicien
    async getStatistics(id) {
        const sql = `
            SELECT 
                COUNT(DISTINCT di.id_demande) as demandes_assignees,
                COUNT(DISTINCT i.id_intervention) as interventions_realisees,
                SUM(CASE WHEN di.statut = 'RESOLUE' THEN 1 ELSE 0 END) as demandes_resolues,
                SUM(CASE WHEN i.probleme_resolu = true THEN 1 ELSE 0 END) as problemes_resolus,
                AVG(CASE 
                    WHEN di.date_cloture IS NOT NULL 
                    THEN DATEDIFF(di.date_cloture, di.date_creation) 
                    ELSE NULL 
                END) as duree_moyenne_resolution
            FROM demande_intervention di
            LEFT JOIN intervention i ON di.id_demande = i.id_demande
            WHERE di.id_technicien = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || {};
    }

    // Rechercher des techniciens par spécialité
    async findBySpecialite(specialite, options = {}) {
        let sql = `
            SELECT 
                t.id_technicien,
                t.specialite,
                t.disponibilite,
                p.nom,
                p.prenom,
                p.email
            FROM technicien t
            INNER JOIN personne p ON t.id_technicien = p.id_personne
            WHERE t.specialite = ?
        `;
        
        const params = [specialite];
        
        if (options.disponibleUniquement) {
            sql += ' AND t.disponibilite = true';
        }
        
        sql += ' ORDER BY t.disponibilite DESC, p.nom, p.prenom';
        
        return await this.customQuery(sql, params);
    }

    // Obtenir toutes les spécialités
    async getSpecialites() {
        const sql = `
            SELECT DISTINCT specialite 
            FROM technicien 
            WHERE specialite IS NOT NULL 
            ORDER BY specialite
        `;
        
        const results = await this.customQuery(sql);
        return results.map(row => row.specialite);
    }

    // Mettre à jour le profil d'un technicien
    async updateProfile(id, data) {
        const allowedFields = ['specialite', 'disponibilite'];
        const updateData = {};
        
        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = data[key];
            }
        });
        
        if (Object.keys(updateData).length === 0) {
            return await this.findByIdWithPersonne(id);
        }
        
        await this.update(id, updateData);
        return await this.findByIdWithPersonne(id);
    }

    // Supprimer un technicien
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier s'il y a des demandes assignées
            const [demandes] = await connection.execute(
                'SELECT COUNT(*) as count FROM demande_intervention WHERE id_technicien = ? AND statut IN ("ASSIGNEE", "EN_COURS")',
                [id]
            );
            
            if (demandes[0].count > 0) {
                throw new Error('Impossible de supprimer le technicien : des demandes lui sont encore assignées');
            }
            
            // Supprimer le technicien
            await connection.execute('DELETE FROM technicien WHERE id_technicien = ?', [id]);
            
            // Supprimer la personne
            await connection.execute('DELETE FROM personne WHERE id_personne = ?', [id]);
            
            return true;
        });
    }
}

module.exports = new Technicien();