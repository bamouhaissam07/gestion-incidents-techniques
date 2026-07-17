const mysql = require('mysql2/promise');
const config = require('../config/config');

async function addTelephoneColumn() {
    let connection;

    try {
        console.log('🔧 Ajout de la colonne telephone à la table personne...');

        // Connexion à MySQL
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });

        // Vérifier si la colonne existe déjà
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'personne' AND COLUMN_NAME = 'telephone'
        `, [config.database.database]);

        if (columns.length > 0) {
            console.log('✅ La colonne telephone existe déjà dans la table personne');
            return;
        }

        // Ajouter la colonne telephone
        await connection.execute(`
            ALTER TABLE personne 
            ADD COLUMN telephone VARCHAR(20) AFTER email
        `);

        console.log('✅ Colonne telephone ajoutée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la colonne telephone:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    addTelephoneColumn()
        .then(() => {
            console.log('🎉 Script terminé avec succès');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = addTelephoneColumn;