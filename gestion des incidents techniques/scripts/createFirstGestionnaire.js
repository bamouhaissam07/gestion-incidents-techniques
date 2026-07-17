const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script pour créer le premier gestionnaire du système
 * À utiliser UNIQUEMENT pour l'initialisation
 */

const createFirstGestionnaire = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    });

    try {
        console.log('🚀 Création du premier gestionnaire...');

        // Données du gestionnaire principal
        const gestionnaireData = {
            nom: 'Admin',
            prenom: 'Système',
            email: 'admin@gestion-incidents.com',
            mot_de_passe: 'AdminSecure123!',
            type_personne: 'GESTIONNAIRE'
        };

        console.log(`📧 Email: ${gestionnaireData.email}`);
        console.log(`🔑 Mot de passe: ${gestionnaireData.mot_de_passe}`);

        // Vérifier si un gestionnaire existe déjà
        const [existingGestionnaires] = await connection.query(
            'SELECT COUNT(*) as count FROM personne WHERE type_personne = ?',
            ['GESTIONNAIRE']
        );

        if (existingGestionnaires[0].count > 0) {
            console.log('⚠️  Un gestionnaire existe déjà dans le système !');
            console.log('📋 Gestionnaires existants :');
            
            const [gestionnaires] = await connection.query(`
                SELECT nom, prenom, email, date_creation 
                FROM personne 
                WHERE type_personne = 'GESTIONNAIRE'
                ORDER BY date_creation
            `);
            
            gestionnaires.forEach((g, index) => {
                console.log(`   ${index + 1}. ${g.prenom} ${g.nom} (${g.email})`);
            });
            
            console.log('\n✅ Aucune action nécessaire - des gestionnaires existent déjà.');
            return;
        }

        // Vérifier si l'email existe déjà
        const [emailExists] = await connection.query(
            'SELECT COUNT(*) as count FROM personne WHERE email = ?',
            [gestionnaireData.email]
        );

        if (emailExists[0].count > 0) {
            console.log(`❌ L'email ${gestionnaireData.email} est déjà utilisé !`);
            return;
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(gestionnaireData.mot_de_passe, salt);

        // Créer la personne
        const [result] = await connection.query(`
            INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne, date_creation)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [
            gestionnaireData.nom,
            gestionnaireData.prenom, 
            gestionnaireData.email,
            hashedPassword,
            gestionnaireData.type_personne
        ]);

        const gestionnaireId = result.insertId;

        // Créer l'entrée gestionnaire
        await connection.query(`
            INSERT INTO gestionnaire (id_gestionnaire)
            VALUES (?)
        `, [gestionnaireId]);

        console.log('\n🎉 PREMIER GESTIONNAIRE CRÉÉ AVEC SUCCÈS !');
        console.log('═══════════════════════════════════════════');
        console.log(`👤 Nom: ${gestionnaireData.prenom} ${gestionnaireData.nom}`);
        console.log(`📧 Email: ${gestionnaireData.email}`);
        console.log(`🔑 Mot de passe: ${gestionnaireData.mot_de_passe}`);
        console.log(`🆔 ID: ${gestionnaireId}`);
        console.log('═══════════════════════════════════════════');
        console.log('\n📋 PROCHAINES ÉTAPES :');
        console.log('1. 🌐 Connecte-toi sur l\'application web');
        console.log('2. 👥 Crée d\'autres gestionnaires si nécessaire');
        console.log('3. 🔄 Change ce mot de passe par défaut');
        console.log('\n⚠️  IMPORTANT : Garde ces identifiants en sécurité !');

    } catch (error) {
        console.error('💥 Erreur lors de la création:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
};

// Fonction pour créer un gestionnaire personnalisé
const createCustomGestionnaire = async (nom, prenom, email, motDePasse) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    });

    try {
        console.log(`🚀 Création du gestionnaire ${prenom} ${nom}...`);

        // Vérifier si l'email existe déjà
        const [emailExists] = await connection.query(
            'SELECT COUNT(*) as count FROM personne WHERE email = ?',
            [email]
        );

        if (emailExists[0].count > 0) {
            console.log(`❌ L'email ${email} est déjà utilisé !`);
            return false;
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(motDePasse, salt);

        // Créer la personne
        const [result] = await connection.query(`
            INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne, date_creation)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [nom, prenom, email, hashedPassword, 'GESTIONNAIRE']);

        const gestionnaireId = result.insertId;

        // Créer l'entrée gestionnaire
        await connection.query(`
            INSERT INTO gestionnaire (id_gestionnaire)
            VALUES (?)
        `, [gestionnaireId]);

        console.log(`✅ Gestionnaire ${prenom} ${nom} créé avec succès ! (ID: ${gestionnaireId})`);
        return true;

    } catch (error) {
        console.error('💥 Erreur lors de la création:', error.message);
        return false;
    } finally {
        await connection.end();
    }
};

// Exécuter selon les arguments
const main = async () => {
    try {
        const args = process.argv.slice(2);
        
        if (args.length === 4) {
            // Mode personnalisé: nom prenom email password
            const [nom, prenom, email, password] = args;
            await createCustomGestionnaire(nom, prenom, email, password);
        } else if (args.length === 0) {
            // Mode par défaut
            await createFirstGestionnaire();
        } else {
            console.log('📖 USAGE:');
            console.log('  Mode par défaut:    node createFirstGestionnaire.js');
            console.log('  Mode personnalisé:  node createFirstGestionnaire.js "Nom" "Prenom" "email@domain.com" "motdepasse"');
            process.exit(1);
        }
    } catch (error) {
        console.error('💥 Échec de l\'opération:', error.message);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

module.exports = { createFirstGestionnaire, createCustomGestionnaire };