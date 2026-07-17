const mysql = require('mysql2/promise');
const config = require('../config/config');

async function checkAllTables() {
    let connection;

    try {
        console.log('🔍 Vérification de TOUTES les structures de tables...');

        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });

        const tables = ['personne', 'utilisateur', 'technicien', 'gestionnaire'];

        for (const table of tables) {
            try {
                console.log(`\n📊 Structure de la table ${table}:`);
                const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
                
                columns.forEach(col => {
                    console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key || ''}`);
                });
            } catch (error) {
                console.log(`❌ Erreur pour la table ${table}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAllTables().catch(console.error);