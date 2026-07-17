const BaseModel = require('./BaseModel');

class DemandeIntervention extends BaseModel {
    constructor() {
        super('demande_intervention');
        this.primaryKey = 'id_demande';
    }

    // Créer une demande d'intervention
    async create(data) {
        // Valeurs par défaut
        const demandeData = {
            urgence: 'MOYENNE',
            statut: 'CREEE',
            date_creation: new Date(),
            ...data
        };
        
        return await super.create(demandeData);
    }

    // Obtenir toutes les demandes avec informations complètes
    async findAllWithDetails(options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.id_utilisateur,
                di.titre,
                di.description,
                di.nature_technique,
                di.categorie,
                di.urgence,
                di.statut,
                di.raison_refus,
                di.date_creation,
                di.date_cloture,
                di.localisation,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie,
                m.emplacement as materiel_emplacement,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                u.departement as utilisateur_departement,
                g_gest.nom as gestionnaire_nom,
                g_gest.prenom as gestionnaire_prenom,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom,
                tech.specialite as technicien_specialite
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            LEFT JOIN gestionnaire g ON di.id_gestionnaire = g.id_gestionnaire
            LEFT JOIN personne g_gest ON g.id_gestionnaire = g_gest.id_personne
            LEFT JOIN technicien tech ON di.id_technicien = tech.id_technicien
            LEFT JOIN personne t_tech ON tech.id_technicien = t_tech.id_personne
        `;
        
        const params = [];
        const conditions = [];
        
        // Filtres
        if (options.statut) {
            conditions.push('di.statut = ?');
            params.push(options.statut);
        }
        
        if (options.urgence) {
            conditions.push('di.urgence = ?');
            params.push(options.urgence);
        }
        
        if (options.utilisateur_id) {
            conditions.push('di.id_utilisateur = ?');
            params.push(options.utilisateur_id);
        }
        
        if (options.technicien_id) {
            conditions.push('di.id_technicien = ?');
            params.push(options.technicien_id);
        }
        
        if (options.gestionnaire_id) {
            conditions.push('di.id_gestionnaire = ?');
            params.push(options.gestionnaire_id);
        }
        
        if (options.materiel_id) {
            conditions.push('di.id_materiel = ?');
            params.push(options.materiel_id);
        }
        
        if (options.categorie) {
            conditions.push('di.categorie = ?');
            params.push(options.categorie);
        }
        
        if (options.date_debut) {
            conditions.push('DATE(di.date_creation) >= ?');
            params.push(options.date_debut);
        }
        
        if (options.date_fin) {
            conditions.push('DATE(di.date_creation) <= ?');
            params.push(options.date_fin);
        }
        
        // Ajouter les conditions WHERE
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Ordonner
        if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
            if (options.orderDirection) {
                sql += ` ${options.orderDirection}`;
            }
        } else {
            sql += ' ORDER BY FIELD(di.urgence, "CRITIQUE", "HAUTE", "MOYENNE", "BASSE"), di.date_creation DESC';
        }
        
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

    // Obtenir une demande par ID avec tous les détails
    async findByIdWithDetails(id) {
        console.log('🔍 === DEBUG findByIdWithDetails ===');
        console.log('📝 ID recherché:', id);
        
        let sql = `
            SELECT 
                di.id_demande,
                di.id_utilisateur,
                di.titre,
                di.description,
                di.nature_technique,
                di.categorie,
                di.urgence,
                di.statut,
                di.raison_refus,
                di.date_creation,
                di.date_cloture,
                di.localisation,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie,
                m.emplacement as materiel_emplacement,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom,
                u.departement as utilisateur_departement,
                g_gest.nom as gestionnaire_nom,
                g_gest.prenom as gestionnaire_prenom,
                t_tech.nom as technicien_nom,
                t_tech.prenom as technicien_prenom,
                tech.specialite as technicien_specialite
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            LEFT JOIN gestionnaire g ON di.id_gestionnaire = g.id_gestionnaire
            LEFT JOIN personne g_gest ON g.id_gestionnaire = g_gest.id_personne
            LEFT JOIN technicien tech ON di.id_technicien = tech.id_technicien
            LEFT JOIN personne t_tech ON tech.id_technicien = t_tech.id_personne
            WHERE di.id_demande = ?
        `;
        
        console.log('📊 Exécution requête SQL...');
        const results = await this.customQuery(sql, [id]);
        console.log('📄 Résultats SQL:', results.length, 'lignes');
        
        if (results.length > 0) {
            console.log('✅ Demande trouvée:', {
                id_demande: results[0].id_demande,
                id_utilisateur: results[0].id_utilisateur,
                titre: results[0].titre,
                statut: results[0].statut
            });
        } else {
            console.log('❌ Aucune demande trouvée');
        }
        
        return results[0] || null;
    }

    // Changer le statut d'une demande
    async changerStatut(id, nouveauStatut, options = {}) {
        const updateData = { statut: nouveauStatut };
        
        // Ajouter date de clôture si nécessaire
        if (['RESOLUE', 'FERMEE', 'REFUSEE'].includes(nouveauStatut)) {
            updateData.date_cloture = new Date();
        }
        
        // Ajouter raison de refus si fournie
        if (options.raison_refus) {
            updateData.raison_refus = options.raison_refus;
        }
        
        return await this.update(id, updateData);
    }

    // Assigner un technicien à une demande
    async assignerTechnicien(id, technicienId, gestionnaireId = null) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier l'état de la demande
            const [demande] = await connection.execute(
                'SELECT statut FROM demande_intervention WHERE id_demande = ?',
                [id]
            );
            
            if (!demande[0]) {
                throw new Error('Demande introuvable');
            }
            
            if (!['CREEE', 'ASSIGNEE'].includes(demande[0].statut)) {
                throw new Error('Cette demande ne peut plus être assignée');
            }
            
            // Vérifier la disponibilité du technicien
            const [technicien] = await connection.execute(
                'SELECT disponibilite FROM technicien WHERE id_technicien = ?',
                [technicienId]
            );
            
            if (!technicien[0] || !technicien[0].disponibilite) {
                throw new Error('Technicien non disponible');
            }
            
            // Mettre à jour la demande
            const updateData = {
                id_technicien: technicienId,
                statut: 'ASSIGNEE'
            };
            
            if (gestionnaireId) {
                updateData.id_gestionnaire = gestionnaireId;
            }
            
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updateData), id];
            
            await connection.execute(
                `UPDATE demande_intervention SET ${fields} WHERE id_demande = ?`,
                values
            );
            
            return true;
        });
    }

    // Obtenir les demandes par priorité
    async getDemandesParPriorite() {
        const sql = `
            SELECT 
                urgence,
                COUNT(*) as count,
                SUM(CASE WHEN statut IN ('CREEE', 'ASSIGNEE') THEN 1 ELSE 0 END) as non_traitees
            FROM demande_intervention 
            GROUP BY urgence
            ORDER BY FIELD(urgence, 'CRITIQUE', 'HAUTE', 'MOYENNE', 'BASSE')
        `;
        
        return await this.customQuery(sql);
    }

    // Obtenir les demandes par statut
    async getDemandesParStatut() {
        const sql = `
            SELECT 
                statut,
                COUNT(*) as count
            FROM demande_intervention 
            GROUP BY statut
            ORDER BY statut
        `;
        
        return await this.customQuery(sql);
    }

    // Rechercher des demandes
    async search(searchTerm, options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.urgence,
                di.statut,
                di.date_creation,
                m.nom as materiel_nom,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            WHERE (di.titre LIKE ? OR di.description LIKE ? OR m.nom LIKE ?)
        `;
        
        const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
        
        // Filtres additionnels
        if (options.statut) {
            sql += ' AND di.statut = ?';
            params.push(options.statut);
        }
        
        if (options.urgence) {
            sql += ' AND di.urgence = ?';
            params.push(options.urgence);
        }
        
        sql += ' ORDER BY FIELD(di.urgence, "CRITIQUE", "HAUTE", "MOYENNE", "BASSE"), di.date_creation DESC';
        
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

    // Obtenir les statistiques générales
    async getStatistiquesGenerales() {
        const sql = `
            SELECT 
                COUNT(*) as total_demandes,
                COUNT(CASE WHEN statut = 'CREEE' THEN 1 END) as demandes_creees,
                COUNT(CASE WHEN statut = 'ASSIGNEE' THEN 1 END) as demandes_assignees,
                COUNT(CASE WHEN statut = 'EN_COURS' THEN 1 END) as demandes_en_cours,
                COUNT(CASE WHEN statut = 'RESOLUE' THEN 1 END) as demandes_resolues,
                COUNT(CASE WHEN statut = 'FERMEE' THEN 1 END) as demandes_fermees,
                COUNT(CASE WHEN statut = 'REFUSEE' THEN 1 END) as demandes_refusees,
                COUNT(CASE WHEN urgence = 'CRITIQUE' THEN 1 END) as demandes_critiques,
                AVG(CASE 
                    WHEN date_cloture IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, date_creation, date_cloture) 
                    ELSE NULL 
                END) as duree_moyenne_heures
            FROM demande_intervention
        `;
        
        const results = await this.customQuery(sql);
        return results[0] || {};
    }

    // Obtenir les demandes en retard (critiques créées il y a plus de 2h, autres plus de 24h)
    async getDemandesEnRetard() {
        const sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.urgence,
                di.statut,
                di.date_creation,
                TIMESTAMPDIFF(HOUR, di.date_creation, NOW()) as heures_ecoulees,
                m.nom as materiel_nom,
                u_user.nom as utilisateur_nom,
                u_user.prenom as utilisateur_prenom
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
            INNER JOIN personne u_user ON u.id_utilisateur = u_user.id_personne
            WHERE di.statut IN ('CREEE', 'ASSIGNEE', 'EN_COURS')
            AND (
                (di.urgence = 'CRITIQUE' AND di.date_creation < DATE_SUB(NOW(), INTERVAL 2 HOUR))
                OR (di.urgence = 'HAUTE' AND di.date_creation < DATE_SUB(NOW(), INTERVAL 8 HOUR))
                OR (di.urgence IN ('MOYENNE', 'BASSE') AND di.date_creation < DATE_SUB(NOW(), INTERVAL 24 HOUR))
            )
            ORDER BY di.urgence DESC, di.date_creation ASC
        `;
        
        return await this.customQuery(sql);
    }

    // Obtenir le tableau de bord pour un utilisateur
    async getTableauBordUtilisateur(utilisateurId) {
        const sql = `
            SELECT 
                COUNT(*) as total_demandes,
                COUNT(CASE WHEN statut IN ('CREEE', 'ASSIGNEE', 'EN_COURS') THEN 1 END) as demandes_actives,
                COUNT(CASE WHEN statut = 'RESOLUE' THEN 1 END) as demandes_resolues,
                COUNT(CASE WHEN date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as demandes_30j
            FROM demande_intervention
            WHERE id_utilisateur = ?
        `;
        
        const results = await this.customQuery(sql, [utilisateurId]);
        return results[0] || {};
    }

    // Obtenir le tableau de bord pour un technicien
    async getTableauBordTechnicien(technicienId) {
        const sql = `
            SELECT 
                COUNT(*) as total_assignees,
                COUNT(CASE WHEN statut = 'ASSIGNEE' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut = 'EN_COURS' THEN 1 END) as en_cours,
                COUNT(CASE WHEN statut = 'RESOLUE' AND date_cloture >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as resolues_30j
            FROM demande_intervention
            WHERE id_technicien = ?
        `;
        
        const results = await this.customQuery(sql, [technicienId]);
        return results[0] || {};
    }

    // Obtenir toutes les catégories utilisées
    async getCategories() {
        // Catégories prédéfinies pour le système
        const categoriesPredefinies = [
            'Matériel informatique',
            'Logiciel',
            'Réseau',
            'Téléphonie',
            'Imprimante',
            'Écran/Moniteur',
            'Souris/Clavier',
            'Système d\'exploitation',
            'Antivirus',
            'Email',
            'Internet',
            'Base de données',
            'Serveur',
            'Sauvegarde',
            'Autre'
        ];

        // Récupérer aussi les catégories existantes en base
        const sql = `
            SELECT DISTINCT categorie 
            FROM demande_intervention 
            WHERE categorie IS NOT NULL 
            ORDER BY categorie
        `;
        
        const results = await this.customQuery(sql);
        const categoriesExistantes = results.map(row => row.categorie);
        
        // Fusionner les deux listes et supprimer les doublons
        const toutesCategories = [...new Set([...categoriesPredefinies, ...categoriesExistantes])];
        
        return toutesCategories.sort();
    }

    // Supprimer une demande (seulement si statut CREEE)
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Vérifier le statut de la demande
            const [demande] = await connection.execute(
                'SELECT statut FROM demande_intervention WHERE id_demande = ?',
                [id]
            );
            
            if (!demande[0]) {
                throw new Error('Demande introuvable');
            }
            
            if (demande[0].statut !== 'CREEE') {
                throw new Error('Impossible de supprimer une demande déjà traitée');
            }
            
            // Supprimer la demande
            const [result] = await connection.execute(
                'DELETE FROM demande_intervention WHERE id_demande = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        });
    }
}

module.exports = new DemandeIntervention();