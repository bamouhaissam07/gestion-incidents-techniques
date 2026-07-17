const BaseModel = require('./BaseModel');

class Gestionnaire extends BaseModel {
    constructor() {
        super('gestionnaire');
        this.primaryKey = 'id_gestionnaire';
    }

    // Créer un gestionnaire (avec création de la personne associée)
    async create(data) {
        return await this.executeTransaction(async (connection) => {
            // Créer d'abord la personne
            const personneData = {
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                mot_de_passe: data.mot_de_passe,
                type_personne: 'GESTIONNAIRE'
            };
            
            const [personneResult] = await connection.execute(
                `INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne) 
                 VALUES (?, ?, ?, ?, ?)`,
                [personneData.nom, personneData.prenom, personneData.email, 
                 personneData.mot_de_passe, personneData.type_personne]
            );
            
            // Ensuite créer le gestionnaire
            const gestionnaireData = {
                id_gestionnaire: personneResult.insertId
            };
            
            await connection.execute(
                'INSERT INTO gestionnaire (id_gestionnaire) VALUES (?)',
                [gestionnaireData.id_gestionnaire]
            );
            
            return {
                id_gestionnaire: personneResult.insertId,
                ...personneData,
                ...gestionnaireData
            };
        });
    }

    // Ajouter le profil gestionnaire d'une personne dÃ©jÃ  existante.
    async addExistingPerson(personId) {
        return await this.executeTransaction(async (connection) => {
            await connection.execute(
                'INSERT INTO gestionnaire (id_gestionnaire) VALUES (?)',
                [personId]
            );
            return { id_gestionnaire: personId };
        });
    }

    // Obtenir tous les gestionnaires avec leurs informations personnelles
    async findAllWithPersonne(options = {}) {
        let sql = `
            SELECT 
                g.id_gestionnaire,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM gestionnaire g
            INNER JOIN personne p ON g.id_gestionnaire = p.id_personne
            ORDER BY p.nom, p.prenom
        `;
        
        const params = [];
        
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

    // Trouver un gestionnaire par ID avec ses informations personnelles
    async findByIdWithPersonne(id) {
        const sql = `
            SELECT 
                g.id_gestionnaire,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM gestionnaire g
            INNER JOIN personne p ON g.id_gestionnaire = p.id_personne
            WHERE g.id_gestionnaire = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || null;
    }

    // Obtenir les demandes traitées par un gestionnaire
    async getDemandesTraitees(id, options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.urgence,
                di.statut,
                di.date_creation,
                di.date_cloture,
                di.raison_refus,
                m.nom as materiel_nom,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            LEFT JOIN technicien t ON di.id_technicien = t.id_technicien
            LEFT JOIN personne t_tech ON t.id_technicien = t_tech.id_personne
            WHERE di.id_gestionnaire = ?
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

    // Obtenir les demandes en attente d'assignation
    async getDemandesEnAttente(options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.nature_technique,
                di.categorie,
                di.urgence,
                di.date_creation,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                u.departement as utilisateur_departement
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            WHERE di.statut = 'CREEE' AND di.id_gestionnaire IS NULL
        `;
        
        const params = [];
        
        // Filtrer par urgence si spécifié
        if (options.urgence) {
            sql += ' AND di.urgence = ?';
            params.push(options.urgence);
        }
        
        // Ordonner par urgence puis par date de création
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

    // Assigner une demande à un technicien
    async assignerDemande(gestionnaireId, demandeId, technicienId) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier que la demande existe et n'est pas déjà assignée
            const [demande] = await connection.execute(
                'SELECT statut FROM demande_intervention WHERE id_demande = ?',
                [demandeId]
            );
            
            if (!demande[0]) {
                throw new Error('Demande d\'intervention introuvable');
            }
            
            if (demande[0].statut !== 'CREEE') {
                throw new Error('Cette demande a déjà été traitée');
            }
            
            // Vérifier que le technicien existe et est disponible
            const [technicien] = await connection.execute(
                'SELECT disponibilite FROM technicien WHERE id_technicien = ?',
                [technicienId]
            );
            
            if (!technicien[0]) {
                throw new Error('Technicien introuvable');
            }
            
            if (!technicien[0].disponibilite) {
                throw new Error('Le technicien sélectionné n\'est pas disponible');
            }
            
            // Mettre à jour la demande
            await connection.execute(
                `UPDATE demande_intervention 
                 SET id_gestionnaire = ?, id_technicien = ?, statut = 'ASSIGNEE' 
                 WHERE id_demande = ?`,
                [gestionnaireId, technicienId, demandeId]
            );
            
            return true;
        });
    }

    // Refuser une demande
    async refuserDemande(gestionnaireId, demandeId, raisonRefus) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier que la demande existe et peut être refusée
            const [demande] = await connection.execute(
                'SELECT statut FROM demande_intervention WHERE id_demande = ?',
                [demandeId]
            );
            
            if (!demande[0]) {
                throw new Error('Demande d\'intervention introuvable');
            }
            
            if (demande[0].statut !== 'CREEE') {
                throw new Error('Cette demande ne peut plus être refusée');
            }
            
            // Mettre à jour la demande
            await connection.execute(
                `UPDATE demande_intervention 
                 SET id_gestionnaire = ?, statut = 'REFUSEE', raison_refus = ?, date_cloture = NOW() 
                 WHERE id_demande = ?`,
                [gestionnaireId, raisonRefus, demandeId]
            );
            
            return true;
        });
    }

    // Obtenir les statistiques globales du système
    async getStatistiquesGlobales() {
        const sql = `
            SELECT 
                COUNT(*) as total_demandes,
                SUM(CASE WHEN statut = 'CREEE' THEN 1 ELSE 0 END) as demandes_creees,
                SUM(CASE WHEN statut = 'ASSIGNEE' THEN 1 ELSE 0 END) as demandes_assignees,
                SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) as demandes_en_cours,
                SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) as demandes_resolues,
                SUM(CASE WHEN statut = 'FERMEE' THEN 1 ELSE 0 END) as demandes_fermees,
                SUM(CASE WHEN statut = 'REFUSEE' THEN 1 ELSE 0 END) as demandes_refusees,
                SUM(CASE WHEN urgence = 'CRITIQUE' THEN 1 ELSE 0 END) as demandes_critiques,
                AVG(CASE 
                    WHEN date_cloture IS NOT NULL 
                    THEN DATEDIFF(date_cloture, date_creation) 
                    ELSE NULL 
                END) as duree_moyenne_traitement
            FROM demande_intervention
        `;
        
        const results = await this.customQuery(sql);
        return results[0] || {};
    }

    // Obtenir les statistiques par période
    async getStatistiquesPeriode(dateDebut, dateFin) {
        const sql = `
            SELECT 
                DATE(date_creation) as date,
                COUNT(*) as total_demandes,
                SUM(CASE WHEN urgence = 'CRITIQUE' THEN 1 ELSE 0 END) as demandes_critiques,
                SUM(CASE WHEN statut IN ('RESOLUE', 'FERMEE') THEN 1 ELSE 0 END) as demandes_traitees
            FROM demande_intervention
            WHERE DATE(date_creation) BETWEEN ? AND ?
            GROUP BY DATE(date_creation)
            ORDER BY date
        `;
        
        return await this.customQuery(sql, [dateDebut, dateFin]);
    }

    // Générer un rapport
    async genererRapport(gestionnaireId, periodeDebut, periodeFin) {
        return await this.executeTransaction(async (connection) => {
            // Récupérer les statistiques pour la période
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_demandes,
                    SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) as demandes_resolues,
                    SUM(CASE WHEN statut = 'REFUSEE' THEN 1 ELSE 0 END) as demandes_refusees,
                    AVG(CASE 
                        WHEN date_cloture IS NOT NULL 
                        THEN DATEDIFF(date_cloture, date_creation) 
                        ELSE NULL 
                    END) as duree_moyenne
                FROM demande_intervention
                WHERE DATE(date_creation) BETWEEN ? AND ?
            `, [periodeDebut, periodeFin]);
            
            // Créer le contenu du rapport
            const contenu = JSON.stringify({
                periode: { debut: periodeDebut, fin: periodeFin },
                statistiques: stats[0],
                date_generation: new Date().toISOString()
            });
            
            // Insérer le rapport
            const [result] = await connection.execute(
                `INSERT INTO rapport (periode_debut, periode_fin, contenu, id_gestionnaire) 
                 VALUES (?, ?, ?, ?)`,
                [periodeDebut, periodeFin, contenu, gestionnaireId]
            );
            
            return {
                id_rapport: result.insertId,
                periode_debut: periodeDebut,
                periode_fin: periodeFin,
                contenu: contenu
            };
        });
    }

    // Obtenir les rapports générés par un gestionnaire
    async getRapports(gestionnaireId, options = {}) {
        let sql = `
            SELECT 
                id_rapport,
                date_generation,
                periode_debut,
                periode_fin,
                contenu
            FROM rapport
            WHERE id_gestionnaire = ?
            ORDER BY date_generation DESC
        `;
        
        const params = [gestionnaireId];
        
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

    // Supprimer un gestionnaire
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier s'il y a des demandes assignées à ce gestionnaire
            const [demandes] = await connection.execute(
                'SELECT COUNT(*) as count FROM demande_intervention WHERE id_gestionnaire = ?',
                [id]
            );
            
            if (demandes[0].count > 0) {
                throw new Error('Impossible de supprimer le gestionnaire : des demandes lui sont associées');
            }
            
            // Supprimer le gestionnaire
            await connection.execute('DELETE FROM gestionnaire WHERE id_gestionnaire = ?', [id]);
            
            // Supprimer la personne
            await connection.execute('DELETE FROM personne WHERE id_personne = ?', [id]);
            
            return true;
        });
    }
}

module.exports = new Gestionnaire();
