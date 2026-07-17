const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script pour corriger la table demande_intervention - ajouter les colonnes manquantes
 */

const fixDemandeTable = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    });

    try {
        console.log('🔧 Correction de la table demande_intervention...');

        // Vérifier la structure actuelle
        const [columns] = await connection.query("SHOW COLUMNS FROM demande_intervention");
        console.log('📊 Colonnes actuelles:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        // Vérifier si 'localisation' existe déjà
        const localisationExists = columns.some(col => col.Field === 'localisation');
        const natureTechniqueExists = columns.some(col => col.Field === 'nature_technique');

        if (!localisationExists) {
            console.log('➕ Ajout de la colonne "localisation"...');
            await connection.query(`
                ALTER TABLE demande_intervention 
                ADD COLUMN localisation VARCHAR(150) AFTER id_materiel
            `);
            console.log('✅ Colonne "localisation" ajoutée');
        } else {
            console.log('✅ Colonne "localisation" déjà existante');
        }

        if (!natureTechniqueExists) {
            console.log('➕ Ajout de la colonne "nature_technique"...');
            await connection.query(`
                ALTER TABLE demande_intervention 
                ADD COLUMN nature_technique VARCHAR(150) AFTER description
            `);
            console.log('✅ Colonne "nature_technique" ajoutée');
        } else {
            console.log('✅ Colonne "nature_technique" déjà existante');
        }

        // Vérifier la nouvelle structure
        const [newColumns] = await connection.query("SHOW COLUMNS FROM demande_intervention");
        console.log('\n📊 Nouvelle structure:');
        newColumns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        console.log('\n🎉 Table demande_intervention corrigée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    fixDemandeTable()
        .then(() => {
            console.log('\n✅ Correction terminée');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Échec de la correction:', error.message);
            process.exit(1);
        });
}

module.exports = { fixDemandeTable };