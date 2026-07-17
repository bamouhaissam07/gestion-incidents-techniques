# 🏢 Système de Gestion des Incidents Techniques

Une API REST complète pour la gestion des incidents techniques en entreprise, développée avec Node.js, Express et MySQL.

## 🌟 Fonctionnalités

### 👥 Gestion des utilisateurs
- **Authentification JWT** sécurisée avec limitation de taux
- **Trois types d'utilisateurs** : Utilisateurs, Techniciens, Gestionnaires
- **Profils personnalisés** par type d'utilisateur
- **Gestion des rôles et permissions** granulaires

### 🔧 Gestion du matériel
- **Inventaire complet** avec numéros de série uniques
- **Suivi des statuts** (En service, En panne, En maintenance, Hors service)
- **Localisation** et **historique** des interventions
- **Rapports de maintenance préventive**

### 📋 Gestion des demandes d'intervention
- **Création de tickets** avec niveaux de priorité
- **Workflow complet** : Création → Assignation → Traitement → Résolution
- **Suivi en temps réel** des demandes
- **Notifications automatiques** aux parties prenantes

### 🛠️ Système d'intervention
- **Comptes-rendus techniques** détaillés
- **Suivi des pièces remplacées** et actions prises
- **Statistiques de performance** par technicien
- **Historique complet** des interventions

### 🔔 Système de notifications
- **Notifications en temps réel** pour tous les événements
- **Types de notifications** : Assignation, Refus, Résolution, Clôture
- **Gestion du statut lu/non lu**
- **Nettoyage automatique** des anciennes notifications

### 📊 Tableaux de bord et rapports
- **Rapports de performance** pour les gestionnaires
- **Analyses des incidents** et statistiques
- **Conformité SLA** et temps de résolution
- **Rapports de satisfaction client**
- **Export et sauvegarde** des rapports personnalisés

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** >= 16.x
- **MySQL** >= 8.0
- **npm** ou **yarn**

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd gestion-incidents-techniques
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos paramètres
   ```

4. **Configuration de la base de données**
   
   Créer une base de données MySQL et configurer les variables dans `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=gestion_incidents
   JWT_SECRET=votre_cle_secrete_jwt_32_caracteres_minimum
   ```

5. **Initialiser la base de données et données de test**
   ```bash
   npm run setup-dev
   ```

6. **Démarrer le serveur**
   ```bash
   # Développement (avec rechargement automatique)
   npm run dev
   
   # Production
   npm start
   ```

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/change-password` - Changement de mot de passe

### Gestion des utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Détails utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Gestion du matériel
- `GET /api/materiel` - Liste du matériel
- `POST /api/materiel` - Ajouter du matériel
- `GET /api/materiel/:id` - Détails matériel
- `PUT /api/materiel/:id` - Modifier le matériel
- `PATCH /api/materiel/:id/statut` - Changer le statut

### Demandes d'intervention
- `GET /api/demandes` - Liste des demandes
- `POST /api/demandes` - Créer une demande
- `GET /api/demandes/:id` - Détails demande
- `PUT /api/demandes/:id` - Modifier une demande
- `PATCH /api/demandes/:id/statut` - Changer le statut
- `POST /api/demandes/:id/assigner` - Assigner à un technicien

### Interventions
- `GET /api/interventions` - Liste des interventions
- `POST /api/interventions` - Créer une intervention
- `GET /api/interventions/:id` - Détails intervention
- `PUT /api/interventions/:id` - Modifier une intervention

### Notifications
- `GET /api/notifications/me` - Mes notifications
- `PATCH /api/notifications/:id/read` - Marquer comme lue
- `POST /api/notifications/mark-all-read` - Marquer toutes comme lues
- `GET /api/notifications/unread-count` - Nombre de non lues

### Rapports (Gestionnaires uniquement)
- `GET /api/reports/system-overview` - Vue d'ensemble système
- `GET /api/reports/technician-performance` - Performance techniciens
- `GET /api/reports/incident-analysis` - Analyse des incidents
- `GET /api/reports/maintenance` - Rapport de maintenance
- `GET /api/reports/sla` - Conformité SLA

## 🔐 Sécurité

### Authentification et autorisation
- **JWT tokens** avec expiration configurable
- **Limitation de taux** (rate limiting) par IP
- **Validation stricte** des entrées utilisateur
- **Sanitisation** des données entrantes
- **Gestion des rôles** granulaire

### Sécurité des données
- **Hachage bcrypt** pour les mots de passe
- **Headers de sécurité** (Helmet.js)
- **Protection CORS** configurable
- **Validation des schémas** avec Joi
- **Protection contre les injections**

### Monitoring et logs
- **Logging des actions sensibles**
- **Monitoring de la santé** de l'API
- **Gestion des erreurs** centralisée
- **Arrêt gracieux** du serveur

## 🧪 Tests et développement

### Comptes de test (après setup-dev)
- **Gestionnaire** : `gestionnaire@test.com` / `password123`
- **Technicien** : `technicien@test.com` / `password123`
- **Utilisateur** : `utilisateur@test.com` / `password123`

### Scripts utiles
```bash
# Réinitialiser complètement la base
npm run reset-db

# Initialiser seulement la structure
npm run init-db

# Démarrer en mode développement
npm run dev

# Tests (à configurer)
npm test
```

### Endpoints de développement
- `GET /api/health` - Santé de l'API et de la base
- `GET /api/ping` - Test de connectivité
- `GET /api` - Informations générales de l'API

## 📁 Structure du projet

```
gestion-incidents-techniques/
├── config/              # Configuration (DB, app)
├── controllers/         # Logique métier
├── middleware/          # Middlewares personnalisés
├── models/             # Modèles de données
├── routes/             # Définition des routes
├── scripts/            # Scripts utilitaires
├── app.js              # Configuration Express
├── server.js           # Point d'entrée
├── package.json        # Dépendances et scripts
└── README.md           # Documentation
```

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : MySQL avec mysql2
- **Authentification** : JWT (jsonwebtoken)
- **Sécurité** : Helmet, bcryptjs, express-rate-limit
- **Validation** : express-validator, Joi
- **Utilitaires** : dotenv, cors, nodemailer

## 📝 Variables d'environnement

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=gestion_incidents

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
JWT_EXPIRE=7d

# Serveur
PORT=3000
NODE_ENV=development

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les modifications (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation API : `/api/docs`
- Vérifier la santé de l'API : `/api/health`

---

**Développé avec ❤️ pour une meilleure gestion des incidents techniques**