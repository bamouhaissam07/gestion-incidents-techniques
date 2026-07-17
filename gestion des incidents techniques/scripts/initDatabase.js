const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Lire le fichier SQL de création de la base
        const sqlFile = path.join(__dirname, '..', 'database', 'schema.sql');
        
        let sqlContent;
        try {
            sqlContent = await fs.readFile(sqlFile, 'utf8');
        } catch (error) {
            // Si le fichier n'existe pas, utiliser le schéma intégré
            sqlContent = `
                CREATE DATABASE IF NOT EXISTS gestion_incidents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                USE gestion_incidents;
                
                CREATE TABLE IF NOT EXISTS personne (
                    id_personne INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(150) NOT NULL UNIQUE,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    type_personne ENUM('UTILISATEUR', 'TECHNICIEN', 'GESTIONNAIRE') NOT NULL,
                    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS utilisateur (
                    id_utilisateur INT PRIMARY KEY,
                    poste VARCHAR(100),
                    departement VARCHAR(100),
                    CONSTRAINT fk_utilisateur_personne
                        FOREIGN KEY (id_utilisateur) REFERENCES personne(id_personne)
                        ON DELETE CASCADE
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS technicien (
                    id_technicien INT PRIMARY KEY,
                    specialite VARCHAR(100),
                    disponibilite BOOLEAN NOT NULL DEFAULT TRUE,
                    CONSTRAINT fk_technicien_personne
                        FOREIGN KEY (id_technicien) REFERENCES personne(id_personne)
                        ON DELETE CASCADE
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS gestionnaire (
                    id_gestionnaire INT PRIMARY KEY,
                    CONSTRAINT fk_gestionnaire_personne
                        FOREIGN KEY (id_gestionnaire) REFERENCES personne(id_personne)
                        ON DELETE CASCADE
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS materiel (
                    id_materiel INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(150) NOT NULL,
                    description TEXT,
                    numero_serie VARCHAR(100) NOT NULL UNIQUE,
                    emplacement VARCHAR(150),
                    statut ENUM('EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE') NOT NULL DEFAULT 'EN_SERVICE'
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS demande_intervention (
                    id_demande INT AUTO_INCREMENT PRIMARY KEY,
                    titre VARCHAR(200) NOT NULL,
                    description TEXT,
                    nature_technique VARCHAR(150),
                    categorie VARCHAR(100),
                    urgence ENUM('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE') NOT NULL DEFAULT 'MOYENNE',
                    statut ENUM('CREEE', 'ASSIGNEE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'RESOLUE', 'FERMEE') NOT NULL DEFAULT 'CREEE',
                    raison_refus TEXT NULL,
                    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    date_cloture DATETIME NULL,
                    id_utilisateur INT NOT NULL,
                    id_materiel INT NOT NULL,
                    id_gestionnaire INT NULL,
                    id_technicien INT NULL,
                    CONSTRAINT fk_demande_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
                    CONSTRAINT fk_demande_materiel FOREIGN KEY (id_materiel) REFERENCES materiel(id_materiel),
                    CONSTRAINT fk_demande_gestionnaire FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire),
                    CONSTRAINT fk_demande_technicien FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien)
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS intervention (
                    id_intervention INT AUTO_INCREMENT PRIMARY KEY,
                    date_intervention DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    actions_prises TEXT,
                    pieces_remplacees TEXT,
                    probleme_resolu BOOLEAN NOT NULL DEFAULT FALSE,
                    id_demande INT NOT NULL UNIQUE,
                    id_technicien INT NOT NULL,
                    CONSTRAINT fk_intervention_demande FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande) ON DELETE CASCADE,
                    CONSTRAINT fk_intervention_technicien FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien)
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS notification (
                    id_notification INT AUTO_INCREMENT PRIMARY KEY,
                    date_envoi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    message TEXT NOT NULL,
                    type ENUM('ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'AUTRE') NOT NULL DEFAULT 'AUTRE',
                    lue BOOLEAN NOT NULL DEFAULT FALSE,
                    id_demande INT NOT NULL,
                    id_destinataire INT NOT NULL,
                    CONSTRAINT fk_notification_demande FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande) ON DELETE CASCADE,
                    CONSTRAINT fk_notification_destinataire FOREIGN KEY (id_destinataire) REFERENCES personne(id_personne)
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS assistant_ia (
                    id_assistant INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL DEFAULT 'Assistant IA',
                    version VARCHAR(50)
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS conversation (
                    id_conversation INT AUTO_INCREMENT PRIMARY KEY,
                    date_debut DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    messages TEXT,
                    statut ENUM('EN_COURS', 'ESCALADEE', 'TERMINEE') NOT NULL DEFAULT 'EN_COURS',
                    id_utilisateur INT NOT NULL,
                    id_assistant INT NOT NULL,
                    CONSTRAINT fk_conversation_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
                    CONSTRAINT fk_conversation_assistant FOREIGN KEY (id_assistant) REFERENCES assistant_ia(id_assistant)
                ) ENGINE = InnoDB;
                
                CREATE TABLE IF NOT EXISTS rapport (
                    id_rapport INT AUTO_INCREMENT PRIMARY KEY,
                    date_generation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    periode_debut DATE,
                    periode_fin DATE,
                    contenu TEXT,
                    id_gestionnaire INT NOT NULL,
                    CONSTRAINT fk_rapport_gestionnaire FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire)
                ) ENGINE = InnoDB;
                
                CREATE INDEX idx_demande_statut ON demande_intervention(statut);
                CREATE INDEX idx_demande_technicien ON demande_intervention(id_technicien);
                CREATE INDEX idx_demande_gestionnaire ON demande_intervention(id_gestionnaire);
                CREATE INDEX idx_demande_categorie ON demande_intervention(categorie);
                CREATE INDEX idx_notification_dest ON notification(id_destinataire);
            `;
        }

        console.log('🚀 Initialisation de la base de données...');
        
        // Exécuter le script SQL
        await connection.query(sqlContent);
        
        console.log('✅ Base de données initialisée avec succès');
        
        // Insérer des données de test si nécessaire
        await insertSampleData(connection);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base:', error);
        throw error;
    } finally {
        await connection.end();
    }
};

const insertSampleData = async (connection) => {
    try {
        // Vérifier si des données existent déjà
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM personne');
        
        if (rows[0].count > 0) {
            console.log('ℹ️  Données déjà présentes, insertion des données de test ignorée');
            return;
        }
        
        console.log('📝 Insertion des données de test...');
        
        // Insérer un assistant IA par défaut
        await connection.query(`
            INSERT INTO assistant_ia (nom, version) 
            VALUES ('Assistant Technique', '1.0.0')
        `);
        
        console.log('✅ Données de test insérées');
        
    } catch (error) {
        console.error('⚠️  Erreur lors de l\'insertion des données de test:', error.message);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    createDatabase()
        .then(() => {
            console.log('🎉 Configuration de la base de données terminée');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Échec de l\'initialisation:', error.message);
            process.exit(1);
        });
}

module.exports = { createDatabase };