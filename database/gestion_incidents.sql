-- =====================================================================
-- BASE DE DONNEES : Gestion des interventions / incidents techniques
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gestion_incidents
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestion_incidents;

-- =====================================================================
-- 1. PERSONNE (classe mere -- Utilisateur / Technicien / Gestionnaire
--    heritent tous de Personne dans le diagramme de classes)
-- =====================================================================
CREATE TABLE personne (
    id_personne     INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100)  NOT NULL,
    prenom          VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255)  NOT NULL,   -- stocker un HASH (bcrypt), jamais en clair
    type_personne   ENUM('UTILISATEUR', 'TECHNICIEN', 'GESTIONNAIRE') NOT NULL,
    date_creation   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =====================================================================
-- 2. UTILISATEUR (herite de Personne : id_utilisateur = id_personne)
-- =====================================================================
CREATE TABLE utilisateur (
    id_utilisateur  INT PRIMARY KEY,
    poste           VARCHAR(100),
    departement     VARCHAR(100),
    CONSTRAINT fk_utilisateur_personne
        FOREIGN KEY (id_utilisateur) REFERENCES personne(id_personne)
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- 3. TECHNICIEN (herite de Personne)
-- =====================================================================
CREATE TABLE technicien (
    id_technicien   INT PRIMARY KEY,
    specialite      VARCHAR(100),
    disponibilite   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_technicien_personne
        FOREIGN KEY (id_technicien) REFERENCES personne(id_personne)
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- 4. GESTIONNAIRE (herite de Personne)
-- =====================================================================
CREATE TABLE gestionnaire (
    id_gestionnaire INT PRIMARY KEY,
    CONSTRAINT fk_gestionnaire_personne
        FOREIGN KEY (id_gestionnaire) REFERENCES personne(id_personne)
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- 5. MATERIEL (inventaire)
-- =====================================================================
CREATE TABLE materiel (
    id_materiel     INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(150) NOT NULL,
    description     TEXT,
    numero_serie    VARCHAR(100) NOT NULL UNIQUE,
    emplacement     VARCHAR(150),
    statut          ENUM('EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE')
                        NOT NULL DEFAULT 'EN_SERVICE'
) ENGINE = InnoDB;

-- =====================================================================
-- 6. DEMANDE_INTERVENTION (le ticket / la demande)
--    - id_utilisateur : qui a soumis (1 utilisateur -- 0..* demandes)
--    - id_materiel    : materiel concerne (1 materiel -- 0..* demandes)
--    - id_gestionnaire: qui a examine/assigne (NULL tant que non traite)
--    - id_technicien  : a qui elle est assignee (NULL tant que non assignee)
-- =====================================================================
CREATE TABLE demande_intervention (
    id_demande          INT AUTO_INCREMENT PRIMARY KEY,
    titre               VARCHAR(200) NOT NULL,
    description         TEXT,
    nature_technique    VARCHAR(150),
    categorie           VARCHAR(100),
    urgence             ENUM('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE') NOT NULL DEFAULT 'MOYENNE',
    statut              ENUM('CREEE', 'ASSIGNEE', 'ACCEPTEE', 'REFUSEE',
                              'EN_COURS', 'RESOLUE', 'FERMEE') NOT NULL DEFAULT 'CREEE',
    raison_refus        TEXT NULL,
    date_creation       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_cloture        DATETIME NULL,

    id_utilisateur      INT NOT NULL,
    id_materiel         INT NOT NULL,
    id_gestionnaire     INT NULL,
    id_technicien       INT NULL,

    CONSTRAINT fk_demande_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_demande_materiel
        FOREIGN KEY (id_materiel) REFERENCES materiel(id_materiel),
    CONSTRAINT fk_demande_gestionnaire
        FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire),
    CONSTRAINT fk_demande_technicien
        FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien)
) ENGINE = InnoDB;

-- =====================================================================
-- 7. INTERVENTION (le compte-rendu technique -- 0..1 par demande)
-- =====================================================================
CREATE TABLE intervention (
    id_intervention     INT AUTO_INCREMENT PRIMARY KEY,
    date_intervention   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actions_prises      TEXT,
    pieces_remplacees   TEXT,
    probleme_resolu     BOOLEAN NOT NULL DEFAULT FALSE,

    id_demande          INT NOT NULL UNIQUE,   -- UNIQUE = garantit le 0..1 cote Demande
    id_technicien       INT NOT NULL,

    CONSTRAINT fk_intervention_demande
        FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande)
        ON DELETE CASCADE,
    CONSTRAINT fk_intervention_technicien
        FOREIGN KEY (id_technicien) REFERENCES technicien(id_technicien)
) ENGINE = InnoDB;

-- =====================================================================
-- 8. NOTIFICATION
--    destinataire = personne (Utilisateur, Technicien OU Gestionnaire,
--    peu importe le role puisqu'ils partagent tous id_personne)
-- =====================================================================
CREATE TABLE notification (
    id_notification     INT AUTO_INCREMENT PRIMARY KEY,
    date_envoi          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message             TEXT NOT NULL,
    type                ENUM('ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'AUTRE')
                            NOT NULL DEFAULT 'AUTRE',
    lue                 BOOLEAN NOT NULL DEFAULT FALSE,

    id_demande          INT NOT NULL,
    id_destinataire     INT NOT NULL,   -- reference personne (utilisateur/technicien/gestionnaire)

    CONSTRAINT fk_notification_demande
        FOREIGN KEY (id_demande) REFERENCES demande_intervention(id_demande)
        ON DELETE CASCADE,
    CONSTRAINT fk_notification_destinataire
        FOREIGN KEY (id_destinataire) REFERENCES personne(id_personne)
) ENGINE = InnoDB;

-- =====================================================================
-- 9. ASSISTANT_IA (module bonus)
-- =====================================================================
CREATE TABLE assistant_ia (
    id_assistant    INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL DEFAULT 'Assistant IA',
    version         VARCHAR(50)
) ENGINE = InnoDB;

-- =====================================================================
-- 10. CONVERSATION (module bonus -- historique de dialogue Utilisateur/IA)
-- =====================================================================
CREATE TABLE conversation (
    id_conversation     INT AUTO_INCREMENT PRIMARY KEY,
    date_debut          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    messages            TEXT,
    statut              ENUM('EN_COURS', 'ESCALADEE', 'TERMINEE') NOT NULL DEFAULT 'EN_COURS',

    id_utilisateur      INT NOT NULL,
    id_assistant        INT NOT NULL,

    CONSTRAINT fk_conversation_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_conversation_assistant
        FOREIGN KEY (id_assistant) REFERENCES assistant_ia(id_assistant)
) ENGINE = InnoDB;

-- =====================================================================
-- 11. RAPPORT (statistiques generees par un gestionnaire)
-- =====================================================================
CREATE TABLE rapport (
    id_rapport          INT AUTO_INCREMENT PRIMARY KEY,
    date_generation     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    periode_debut       DATE,
    periode_fin         DATE,
    contenu             TEXT,

    id_gestionnaire     INT NOT NULL,

    CONSTRAINT fk_rapport_gestionnaire
        FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire)
) ENGINE = InnoDB;

-- =====================================================================
-- INDEX utiles pour les requetes frequentes / rapports de performance
-- =====================================================================
CREATE INDEX idx_demande_statut       ON demande_intervention(statut);
CREATE INDEX idx_demande_technicien   ON demande_intervention(id_technicien);
CREATE INDEX idx_demande_gestionnaire ON demande_intervention(id_gestionnaire);
CREATE INDEX idx_demande_categorie    ON demande_intervention(categorie);
CREATE INDEX idx_notification_dest    ON notification(id_destinataire);

-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================
