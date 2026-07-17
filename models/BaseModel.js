const { query, transaction } = require('../config/database');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    // Méthode générique pour trouver tous les enregistrements
    async findAll(conditions = {}, options = {}) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        // Ajouter les conditions WHERE
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        // Ajouter ORDER BY
        if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
            if (options.orderDirection) {
                sql += ` ${options.orderDirection}`;
            }
        }
        
        // Ajouter LIMIT
        if (options.limit) {
            sql += ` LIMIT ${parseInt(options.limit)}`;
        }
        
        // Ajouter OFFSET
        if (options.offset) {
            sql += ` OFFSET ${parseInt(options.offset)}`;
        }
        
        return await query(sql, params);
    }

    // Méthode pour trouver un enregistrement par ID
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const results = await query(sql, [id]);
        return results[0] || null;
    }

    // Méthode pour trouver un enregistrement selon des conditions
    async findOne(conditions = {}) {
        const results = await this.findAll(conditions, { limit: 1 });
        return results[0] || null;
    }

    // Méthode générique pour créer un enregistrement
    async create(data) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;
        const result = await query(sql, values);
        
        return {
            id: result.insertId,
            ...data
        };
    }

    // Méthode générique pour mettre à jour un enregistrement
    async update(id, data) {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        
        const sql = `UPDATE ${this.tableName} SET ${fields} WHERE ${this.primaryKey} = ?`;
        const result = await query(sql, values);
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await this.findById(id);
    }

    // Méthode générique pour supprimer un enregistrement
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const result = await query(sql, [id]);
        
        return result.affectedRows > 0;
    }

    // Méthode pour compter les enregistrements
    async count(conditions = {}) {
        let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        const results = await query(sql, params);
        return results[0].total;
    }

    // Méthode pour exécuter une requête SQL personnalisée
    async customQuery(sql, params = []) {
        return await query(sql, params);
    }

    // Méthode pour les transactions
    async executeTransaction(callback) {
        return await transaction(callback);
    }
}

module.exports = BaseModel;