const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

class Personne extends BaseModel {
    constructor() {
        super('personne');
        this.primaryKey = 'id_personne';
    }

    // Créer une personne avec hashage du mot de passe
    async create(data) {
        if (data.mot_de_passe) {
            const salt = await bcrypt.genSalt(config.security.bcryptRounds);
            data.mot_de_passe = await bcrypt.hash(data.mot_de_passe, salt);
        }
        
        return await super.create(data);
    }

    // Trouver une personne par email
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    // Vérifier le mot de passe
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Mettre à jour le mot de passe
    async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(config.security.bcryptRounds);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        return await this.update(id, { mot_de_passe: hashedPassword });
    }

    // Trouver des personnes par type
    async findByType(type) {
        return await this.findAll({ type_personne: type });
    }

    // Méthode pour l'authentification
    async authenticate(email, password) {
        const personne = await this.findByEmail(email);
        
        if (!personne) {
            return null;
        }
        
        const isValidPassword = await this.verifyPassword(password, personne.mot_de_passe);
        
        if (!isValidPassword) {
            return null;
        }
        
        // Retourner la personne sans le mot de passe
        const { mot_de_passe, ...personneData } = personne;
        return personneData;
    }

    // Obtenir le profil complet avec les données spécifiques selon le type
    async getFullProfile(id) {
        const personne = await this.findById(id);
        
        if (!personne) {
            return null;
        }

        let profileData = { ...personne };
        
        // Supprimer le mot de passe du retour
        delete profileData.mot_de_passe;
        
        // Récupérer les données spécifiques selon le type
        switch (personne.type_personne) {
            case 'UTILISATEUR':
                const utilisateurData = await this.customQuery(
                    'SELECT poste, departement FROM utilisateur WHERE id_utilisateur = ?',
                    [id]
                );
                if (utilisateurData[0]) {
                    profileData = { ...profileData, ...utilisateurData[0] };
                }
                break;
                
            case 'TECHNICIEN':
                const technicienData = await this.customQuery(
                    'SELECT specialite, disponibilite FROM technicien WHERE id_technicien = ?',
                    [id]
                );
                if (technicienData[0]) {
                    profileData = { ...profileData, ...technicienData[0] };
                }
                break;
                
            case 'GESTIONNAIRE':
                // Les gestionnaires n'ont pas de champs supplémentaires dans ce schéma
                break;
        }
        
        return profileData;
    }

    // Vérifier si l'email existe déjà
    async emailExists(email, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM personne WHERE email = ?';
        const params = [email];
        
        if (excludeId) {
            sql += ' AND id_personne != ?';
            params.push(excludeId);
        }
        
        const result = await this.customQuery(sql, params);
        return result[0].count > 0;
    }

    // Statistiques par type de personne
    async getStatsByType() {
        const sql = `
            SELECT 
                type_personne,
                COUNT(*) as count
            FROM personne 
            GROUP BY type_personne
        `;
        
        return await this.customQuery(sql);
    }

    // Recherche de personnes avec pagination
    async search(searchTerm, type = null, options = {}) {
        let sql = `
            SELECT id_personne, nom, prenom, email, type_personne, date_creation
            FROM personne 
            WHERE (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)
        `;
        
        const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
        
        if (type) {
            sql += ' AND type_personne = ?';
            params.push(type);
        }
        
        // Ajouter ORDER BY
        sql += ' ORDER BY nom, prenom';
        
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
}

module.exports = new Personne();