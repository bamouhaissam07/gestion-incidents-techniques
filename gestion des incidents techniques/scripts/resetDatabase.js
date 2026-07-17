const mysql = require('mysql2/promise');

async function resetDatabase() {
    let connection;
    
    try {
        console.log('🗑️  === RESET COMPLET DE LA BASE DE DONNÉES ===');
        
        // Connexion à MySQL (sans base spécifique)
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Remplace par ton mot de passe MySQL si nécessaire
            port: 3306
        });
        
        console.log('✅ Connexion MySQL établie');
        
        // Supprimer la base si elle existe
        console.log('🗑️  Suppression de la base gestion_incidents...');
        await connection.execute('DROP DATABASE IF EXISTS gestion_incidents');
        console.log('✅ Base supprimée');
        
        // Créer une nouvelle base
        console.log('🆕 Création de la nouvelle base...');
        await connection.execute('CREATE DATABASE gestion_incidents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base créée');
        
        // Sélectionner la nouvelle base
        await connection.execute('USE gestion_incidents');
        console.log('📂 Base sélectionnée');
        
        // Créer toutes les tables
        console.log('🏗️  Création des tables...');
        
        // Table personne
        await connection.execute(`
            CREATE TABLE personne (
                id_personne INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                mot_de_passe VARCHAR(255) NOT NULL,
                telephone VARCHAR(20),
                type_personne ENUM('UTILISATEUR', 'TECHNICIEN', 'GESTIONNAIRE') NOT NULL,
                actif BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table personne créée');
        
        // Table utilisateur
        await connection.execute(`
            CREATE TABLE utilisateur (
                id_utilisateur INT PRIMARY KEY,
                departement VARCHAR(100),
                FOREIGN KEY (id_utilisateur) REFERENCES personne(id_personne) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table utilisateur créée');
        
        // Table technicien
        await connection.execute(`
            CREATE TABLE technicien (
                id_technicien INT PRIMARY KEY,
                specialite VARCHAR(100),
                disponibilite BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (id_technicien) REFERENCES personne(id_personne) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table technicien créée');
        
        // Table gestionnaire
        await connection.execute(`
            CREATE TABLE gestionnaire (
                id_gestionnaire INT PRIMARY KEY,
                niveau_acces ENUM('STANDARD', 'ADMIN') DEFAULT 'STANDARD',
                FOREIGN KEY (id_gestionnaire) REFERENCES personne(id_personne) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table gestionnaire créée');
        
        // Table materiel
        await connection.execute(`
            CREATE TABLE materiel (
                id_materiel INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(200) NOT NULL,
                type VARCHAR(100) DEFAULT 'Ordinateur',
                numero_serie VARCHAR(100) UNIQUE NOT NULL,
                marque VARCHAR(100),
                modele VARCHAR(100),
                emplacement VARCHAR(200),
                statut ENUM('FONCTIONNEL', 'EN_PANNE', 'EN_MAINTENANCE') DEFAULT 'FONCTIONNEL',
                description TEXT,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table materiel créée');
        
        // Table demande_intervention
        await connection.execute(`
            CREATE TABLE demande_intervention (
                id_demande INT AUTO_INCREMENT PRIMARY KEY,
                titre VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                nature_technique TEXT,
                categorie VARCHAR(100),
                urgence ENUM('CRITIQUE', 'HAUTE', 'MOYENNE', 'BASSE') DEFAULT 'MOYENNE',
                statut ENUM('CREEE', 'ASSIGNEE', 'ACCEPTEE', 'EN_COURS', 'RESOLUE', 'FERMEE', 'REFUSEE') DEFAULT 'CREEE',
                localisation VARCHAR(200),
                raison_refus TEXT,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_cloture TIMESTAMP NULL,
                id_utilisateur INT NOT NULL,
                id_technicien INT,
                id_gestionnaire INT,
                id_materiel INT NOT NULL,
                FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
                FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien) ON DELETE SET NULL,
                FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire) ON DELETE SET NULL,
                FOREIGN KEY (id_materiel) REFERENCES materiel(id_materiel) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table demande_intervention créée');
        
        // Table intervention
        await connection.execute(`
            CREATE TABLE intervention (
                id_intervention INT AUTO_INCREMENT PRIMARY KEY,
                actions_prises TEXT NOT NULL,
                pieces_remplacees TEXT,
                duree INT,
                probleme_resolu BOOLEAN DEFAULT FALSE,
                date_intervention TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                id_demande INT NOT NULL,
                id_technicien INT NOT NULL,
                FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande) ON DELETE CASCADE,
                FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table intervention créée');
        
        // Table notification
        await connection.execute(`
            CREATE TABLE notification (
                id_notification INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                type ENUM('ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'NOUVELLE_DEMANDE', 'INTERVENTION', 'ACCEPTATION', 'AUTRE') DEFAULT 'AUTRE',
                lue BOOLEAN DEFAULT FALSE,
                date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                id_demande INT NOT NULL,
                id_destinataire INT NOT NULL,
                FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande) ON DELETE CASCADE,
                FOREIGN KEY (id_destinataire) REFERENCES personne(id_personne) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table notification créée');
        
        console.log('🎉 Toutes les tables créées avec succès !');
        
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
    resetDatabase().then(() => {
        console.log('\n✅ Reset de la base de données terminé !');
        console.log('🚀 Tu peux maintenant démarrer le serveur et créer des utilisateurs de test');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { resetDatabase };