const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

/**
 * 🏢 SCRIPT D'INSTALLATION POUR ENTREPRISE
 * 
 * Ce script est utilisé UNIQUEMENT lors du premier déploiement
 * pour créer le compte gestionnaire du directeur/responsable IT
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const setupEntreprise = async () => {
    console.log('🏢 INSTALLATION GESTION DES INCIDENTS TECHNIQUES');
    console.log('═══════════════════════════════════════════════════');
    console.log('Ce script va créer le compte gestionnaire principal pour votre entreprise.\n');

    try {
        // Collecte des informations
        console.log('📋 INFORMATIONS DU GESTIONNAIRE PRINCIPAL :\n');
        
        const nom = await question('👤 Nom de famille : ');
        const prenom = await question('👤 Prénom : ');
        const email = await question('📧 Email professionnel : ');
        const poste = await question('💼 Poste/Fonction (ex: Directeur IT, Responsable Technique) : ');
        
        console.log('\n🔐 SÉCURITÉ :');
        const motDePasse = await question('🔑 Mot de passe (minimum 8 caractères) : ');
        const confirmPassword = await question('🔑 Confirmer le mot de passe : ');
        
        // Validations
        if (!nom.trim() || !prenom.trim() || !email.trim() || !motDePasse.trim()) {
            console.log('❌ Tous les champs sont obligatoires !');
            return;
        }

        if (motDePasse !== confirmPassword) {
            console.log('❌ Les mots de passe ne correspondent pas !');
            return;
        }

        if (motDePasse.length < 8) {
            console.log('❌ Le mot de passe doit contenir au moins 8 caractères !');
            return;
        }

        if (!email.includes('@')) {
            console.log('❌ Format d\'email invalide !');
            return;
        }

        console.log('\n📊 RÉSUMÉ :');
        console.log(`   Gestionnaire : ${prenom} ${nom}`);
        console.log(`   Email : ${email}`);
        console.log(`   Poste : ${poste}`);
        
        const confirm = await question('\n✅ Confirmer la création ? (oui/non) : ');
        
        if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Installation annulée.');
            return;
        }

        // Connexion à la base de données
        console.log('\n🔌 Connexion à la base de données...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gestion_incidents'
        });

        // Vérifier si des gestionnaires existent déjà
        const [existingGestionnaires] = await connection.query(
            'SELECT COUNT(*) as count FROM personne WHERE type_personne = ?',
            ['GESTIONNAIRE']
        );

        if (existingGestionnaires[0].count > 0) {
            console.log('\n⚠️  ATTENTION : Des gestionnaires existent déjà dans le système !');
            
            const [gestionnaires] = await connection.query(`
                SELECT nom, prenom, email, date_creation 
                FROM personne 
                WHERE type_personne = 'GESTIONNAIRE'
                ORDER BY date_creation
            `);
            
            console.log('📋 Gestionnaires existants :');
            gestionnaires.forEach((g, index) => {
                const date = new Date(g.date_creation).toLocaleDateString('fr-FR');
                console.log(`   ${index + 1}. ${g.prenom} ${g.nom} (${g.email}) - créé le ${date}`);
            });
            
            const forceCreate = await question('\n⚠️  Créer quand même ce nouveau gestionnaire ? (oui/non) : ');
            if (forceCreate.toLowerCase() !== 'oui' && forceCreate.toLowerCase() !== 'o') {
                console.log('❌ Installation annulée.');
                await connection.end();
                return;
            }
        }

        // Vérifier si l'email existe déjà
        const [emailExists] = await connection.query(
            'SELECT COUNT(*) as count FROM personne WHERE email = ?',
            [email]
        );

        if (emailExists[0].count > 0) {
            console.log(`❌ L'email ${email} est déjà utilisé dans le système !`);
            await connection.end();
            return;
        }

        // Créer le gestionnaire
        console.log('\n👤 Création du compte gestionnaire...');
        
        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(motDePasse, salt);

        // Créer la personne
        const [result] = await connection.query(`
            INSERT INTO personne (nom, prenom, email, mot_de_passe, type_personne, date_creation)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [nom.trim(), prenom.trim(), email.trim(), hashedPassword, 'GESTIONNAIRE']);

        const gestionnaireId = result.insertId;

        // Créer l'entrée gestionnaire avec informations additionnelles
        await connection.query(`
            INSERT INTO gestionnaire (id_gestionnaire)
            VALUES (?)
        `, [gestionnaireId]);

        // Ajouter une note dans les logs (optionnel)
        console.log('\n📝 Enregistrement de l\'installation...');

        await connection.end();

        console.log('\n🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !');
        console.log('═══════════════════════════════════════════════════');
        console.log(`👤 Gestionnaire principal : ${prenom} ${nom}`);
        console.log(`📧 Email de connexion : ${email}`);
        console.log(`💼 Poste : ${poste}`);
        console.log(`🆔 ID système : ${gestionnaireId}`);
        console.log('═══════════════════════════════════════════════════');
        
        console.log('\n📋 PROCHAINES ÉTAPES :');
        console.log('1. 🌐 Accédez à l\'application web');
        console.log('2. 🔐 Connectez-vous avec les identifiants créés');
        console.log('3. 👥 Créez les comptes techniciens et utilisateurs');
        console.log('4. ⚙️  Configurez les paramètres de l\'entreprise');
        console.log('5. 📊 Définissez les catégories d\'incidents');
        
        console.log('\n🔐 SÉCURITÉ :');
        console.log('• Changez le mot de passe après la première connexion');
        console.log('• Ne partagez ces identifiants qu\'avec les personnes autorisées');
        console.log('• Sauvegardez ces informations en lieu sûr');
        
    } catch (error) {
        console.error('\n💥 Erreur lors de l\'installation :', error.message);
    } finally {
        rl.close();
    }
};

// Fonction pour lister les gestionnaires existants
const listGestionnaires = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_incidents'
    });

    try {
        const [gestionnaires] = await connection.query(`
            SELECT id_personne, nom, prenom, email, date_creation 
            FROM personne 
            WHERE type_personne = 'GESTIONNAIRE'
            ORDER BY date_creation
        `);
        
        console.log('\n👥 GESTIONNAIRES DANS LE SYSTÈME :');
        console.log('═══════════════════════════════════════');
        
        if (gestionnaires.length === 0) {
            console.log('   Aucun gestionnaire trouvé.');
        } else {
            gestionnaires.forEach((g, index) => {
                const date = new Date(g.date_creation).toLocaleDateString('fr-FR');
                console.log(`   ${index + 1}. ${g.prenom} ${g.nom}`);
                console.log(`      📧 ${g.email}`);
                console.log(`      🆔 ID: ${g.id_personne}`);
                console.log(`      📅 Créé: ${date}\n`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur :', error.message);
    } finally {
        await connection.end();
    }
};

// Main
const main = async () => {
    const args = process.argv.slice(2);
    
    if (args.includes('--list')) {
        await listGestionnaires();
    } else {
        await setupEntreprise();
    }
};

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { setupEntreprise, listGestionnaires };