const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script pour corriger la table matériel - ajouter les colonnes manquantes
 */

const fixMaterielTable = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    });

    try {
        console.log('🔧 Correction de la table matériel...');

        // Vérifier la structure actuelle
        const [columns] = await connection.query("SHOW COLUMNS FROM materiel");
        console.log('📊 Colonnes actuelles:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        // Vérifier si 'marque' existe déjà
        const marqueExists = columns.some(col => col.Field === 'marque');
        const modeleExists = columns.some(col => col.Field === 'modele');

        if (!marqueExists) {
            console.log('➕ Ajout de la colonne "marque"...');
            await connection.query(`
                ALTER TABLE materiel 
                ADD COLUMN marque VARCHAR(100) AFTER numero_serie
            `);
            console.log('✅ Colonne "marque" ajoutée');
        } else {
            console.log('✅ Colonne "marque" déjà existante');
        }

        if (!modeleExists) {
            console.log('➕ Ajout de la colonne "modele"...');
            await connection.query(`
                ALTER TABLE materiel 
                ADD COLUMN modele VARCHAR(100) AFTER marque
            `);
            console.log('✅ Colonne "modele" ajoutée');
        } else {
            console.log('✅ Colonne "modele" déjà existante');
        }

        // Vérifier la nouvelle structure
        const [newColumns] = await connection.query("SHOW COLUMNS FROM materiel");
        console.log('\n📊 Nouvelle structure:');
        newColumns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        console.log('\n🎉 Table matériel corrigée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    fixMaterielTable()
        .then(() => {
            console.log('\n✅ Correction terminée');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Échec de la correction:', error.message);
            process.exit(1);
        });
}

module.exports = { fixMaterielTable };