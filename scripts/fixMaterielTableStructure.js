const mysql = require('mysql2/promise');
const config = require('../config/config');

async function fixMaterielTable() {
    let connection;
    
    try {
        console.log('🔧 Correction de la structure de la table materiel...');
        
        // Créer une connexion à la base de données
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root', 
            password: '',
            database: 'gestion_incidents',
            port: 3306
        });
        
        console.log('✅ Connexion établie à gestion_incidents');
        
        // Vérifier la structure actuelle
        console.log('📊 Vérification de la structure actuelle...');
        const [columns] = await connection.execute("DESCRIBE materiel");
        console.log('Colonnes existantes:', columns.map(col => col.Field));
        
        // Colonnes requises
        const requiredColumns = [
            { name: 'type', sql: "ADD COLUMN `type` VARCHAR(100) DEFAULT 'Ordinateur'" },
            { name: 'marque', sql: "ADD COLUMN `marque` VARCHAR(100)" },
            { name: 'modele', sql: "ADD COLUMN `modele` VARCHAR(100)" }
        ];
        
        // Ajouter les colonnes manquantes
        for (const column of requiredColumns) {
            const exists = columns.some(col => col.Field === column.name);
            
            if (!exists) {
                console.log(`➕ Ajout de la colonne: ${column.name}`);
                await connection.execute(`ALTER TABLE materiel ${column.sql}`);
                console.log(`✅ Colonne ${column.name} ajoutée`);
            } else {
                console.log(`⚠️  Colonne ${column.name} existe déjà`);
            }
        }
        
        // Vérifier si la colonne description existe et l'ajouter si nécessaire
        const hasDescription = columns.some(col => col.Field === 'description');
        if (!hasDescription) {
            console.log('➕ Ajout de la colonne: description');
            await connection.execute("ALTER TABLE materiel ADD COLUMN `description` TEXT");
            console.log('✅ Colonne description ajoutée');
        }
        
        // Vérifier la structure finale
        console.log('📊 Structure finale:');
        const [finalColumns] = await connection.execute("DESCRIBE materiel");
        finalColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });
        
        console.log('🎉 Structure de la table materiel corrigée !');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    fixMaterielTable().then(() => {
        console.log('✅ Script terminé');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { fixMaterielTable };