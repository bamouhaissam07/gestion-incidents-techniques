const mysql = require('mysql2/promise');
const config = require('../config/config');

async function checkDatabase() {
    let connection;

    try {
        console.log('🔍 Vérification de la structure de la base de données...');

        // Connexion à MySQL
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });

        // Vérifier la structure de la table personne
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM personne
        `);

        console.log('📊 Structure de la table personne:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key || ''}`);
        });

        // Tester une requête UPDATE comme celle qui échoue
        console.log('\n🧪 Test de la requête UPDATE...');
        try {
            const [result] = await connection.execute(`
                UPDATE personne 
                SET nom = 'Test', prenom = 'Test', email = 'test@test.com', telephone = '1234567890' 
                WHERE id_personne = 999999
            `);
            console.log('✅ Requête UPDATE fonctionne');
        } catch (updateError) {
            console.log('❌ Erreur UPDATE:', updateError.message);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDatabase().catch(console.error);