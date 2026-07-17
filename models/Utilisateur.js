const BaseModel = require('./BaseModel');
const Personne = require('./Personne');

class Utilisateur extends BaseModel {
    constructor() {
        super('utilisateur');
        this.primaryKey = 'id_utilisateur';
    }

    // Créer un utilisateur (avec création de la personne associée)
    async create(data) {
        return await this.executeTransaction(async (connection) => {
            // Créer d'abord la personne
            const personneData = {
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                mot_de_passe: data.mot_de_passe,
                type_personne: 'UTILISATEUR'
            };
            
            const [personneResult] = await connection.execute(
                `INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne) 
                 VALUES (?, ?, ?, ?, ?)`,
                [personneData.nom, personneData.prenom, personneData.email, 
                 personneData.mot_de_passe, personneData.type_personne]
            );
            
            // Ensuite créer l'utilisateur
            const utilisateurData = {
                id_utilisateur: personneResult.insertId,
                poste: data.poste || null,
                departement: data.departement || null
            };
            
            await connection.execute(
                'INSERT INTO utilisateur (id_utilisateur, poste, departement) VALUES (?, ?, ?)',
                [utilisateurData.id_utilisateur, utilisateurData.poste, utilisateurData.departement]
            );
            
            return {
                id_utilisateur: personneResult.insertId,
                ...personneData,
                ...utilisateurData
            };
        });
    }

    // Obtenir tous les utilisateurs avec leurs informations personnelles
    async findAllWithPersonne(options = {}) {
        let sql = `
            SELECT 
                u.id_utilisateur,
                u.poste,
                u.departement,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM utilisateur u
            INNER JOIN personne p ON u.id_utilisateur = p.id_personne
        `;
        
        const params = [];
        
        // Ajouter ORDER BY
        if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
            if (options.orderDirection) {
                sql += ` ${options.orderDirection}`;
            }
        } else {
            sql += ' ORDER BY p.nom, p.prenom';
        }
        
        // Ajouter LIMIT et OFFSET
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

    // Trouver un utilisateur par ID avec ses informations personnelles
    async findByIdWithPersonne(id) {
        const sql = `
            SELECT 
                u.id_utilisateur,
                u.poste,
                u.departement,
                p.nom,
                p.prenom,
                p.email,
                p.date_creation
            FROM utilisateur u
            INNER JOIN personne p ON u.id_utilisateur = p.id_personne
            WHERE u.id_utilisateur = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || null;
    }

    // Mettre à jour un utilisateur (seulement les champs utilisateur)
    async updateProfile(id, data) {
        const allowedFields = ['poste', 'departement'];
        const updateData = {};
        
        // Filtrer les champs autorisés
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

    // Obtenir les demandes d'intervention d'un utilisateur
    async getDemandesIntervention(id, options = {}) {
        let sql = `
            SELECT 
                di.id_demande,
                di.titre,
                di.description,
                di.urgence,
                di.statut,
                di.date_creation,
                di.date_cloture,
                m.nom as materiel_nom,
                m.numero_serie as materiel_serie
            FROM demande_intervention di
            INNER JOIN materiel m ON di.id_materiel = m.id_materiel
            WHERE di.id_utilisateur = ?
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

    // Obtenir les statistiques d'un utilisateur
    async getStatistics(id) {
        const sql = `
            SELECT 
                COUNT(*) as total_demandes,
                SUM(CASE WHEN statut = 'CREEE' THEN 1 ELSE 0 END) as demandes_creees,
                SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) as demandes_en_cours,
                SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) as demandes_resolues,
                SUM(CASE WHEN statut = 'FERMEE' THEN 1 ELSE 0 END) as demandes_fermees,
                SUM(CASE WHEN urgence = 'CRITIQUE' THEN 1 ELSE 0 END) as demandes_critiques
            FROM demande_intervention 
            WHERE id_utilisateur = ?
        `;
        
        const results = await this.customQuery(sql, [id]);
        return results[0] || {};
    }

    // Rechercher des utilisateurs par département
    async findByDepartement(departement, options = {}) {
        let sql = `
            SELECT 
                u.id_utilisateur,
                u.poste,
                u.departement,
                p.nom,
                p.prenom,
                p.email
            FROM utilisateur u
            INNER JOIN personne p ON u.id_utilisateur = p.id_personne
            WHERE u.departement = ?
            ORDER BY p.nom, p.prenom
        `;
        
        const params = [departement];
        
        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(options.limit));
        }
        
        return await this.customQuery(sql, params);
    }

    // Obtenir les départements existants
    async getDepartements() {
        const sql = `
            SELECT DISTINCT departement 
            FROM utilisateur 
            WHERE departement IS NOT NULL 
            ORDER BY departement
        `;
        
        const results = await this.customQuery(sql);
        return results.map(row => row.departement);
    }

    // Supprimer un utilisateur (et sa personne associée)
    async delete(id) {
        return await this.executeTransaction(async (connection) => {
            // Supprimer d'abord l'utilisateur
            await connection.execute('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id]);
            
            // Puis supprimer la personne (cascade devrait s'en charger mais on s'assure)
            await connection.execute('DELETE FROM personne WHERE id_personne = ?', [id]);
            
            return true;
        });
    }
}

module.exports = new Utilisateur();