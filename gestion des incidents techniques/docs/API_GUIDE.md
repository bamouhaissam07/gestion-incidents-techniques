# 📚 Guide complet de l'API Gestion des Incidents

## 🚀 Démarrage rapide

### 1. Authentification

Toutes les requêtes authentifiées nécessitent un token JWT dans l'en-tête `Authorization` :

```bash
Authorization: Bearer <votre_token_jwt>
```

#### Obtenir un token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "gestionnaire@test.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_personne": 1,
      "nom": "Admin",
      "prenom": "Gestionnaire",
      "email": "gestionnaire@test.com",
      "type_personne": "GESTIONNAIRE"
    }
  }
}
```

### 2. Types d'utilisateurs et permissions

| Type | Permissions |
|------|-------------|
| **UTILISATEUR** | Créer des demandes, consulter ses demandes, modifier son profil |
| **TECHNICIEN** | Traiter les demandes assignées, créer des interventions, consulter le matériel |
| **GESTIONNAIRE** | Toutes les permissions + gestion des utilisateurs, assignation des tâches, rapports |

### 3. Format des réponses

#### Succès
```json
{
  "success": true,
  "message": "Description de l'opération",
  "data": {
    // Données de réponse
  }
}
```

#### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

#### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## 🔐 Authentification et Utilisateurs

### Connexion
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/register` - Créer un compte
- `GET /api/auth/profile` - Obtenir son profil
- `PUT /api/auth/profile` - Modifier son profil
- `POST /api/auth/change-password` - Changer son mot de passe
- `POST /api/auth/logout` - Se déconnecter

### Gestion des utilisateurs (Gestionnaires)
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur
- `GET /api/users/technicians/available` - Techniciens disponibles

## 🔧 Gestion du matériel

### Endpoints principaux
- `GET /api/materiel` - Liste du matériel
- `POST /api/materiel` - Ajouter du matériel (Gestionnaires)
- `GET /api/materiel/:id` - Détails d'un matériel
- `PUT /api/materiel/:id` - Modifier le matériel (Gestionnaires)
- `PATCH /api/materiel/:id/statut` - Changer le statut
- `GET /api/materiel/:id/history` - Historique des interventions

### Statuts du matériel
- `EN_SERVICE` - Matériel opérationnel
- `EN_PANNE` - Matériel défaillant
- `EN_MAINTENANCE` - En cours de maintenance
- `HORS_SERVICE` - Retiré du service

### Exemple : Créer du matériel
```bash
POST /api/materiel
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Ordinateur Portable Dell",
  "description": "Laptop pour développement",
  "numero_serie": "DELL001",
  "emplacement": "Bureau 101",
  "statut": "EN_SERVICE"
}
```

## 📋 Demandes d'intervention

### Workflow des demandes

1. **CREEE** - Demande créée par un utilisateur
2. **ASSIGNEE** - Assignée à un technicien par un gestionnaire
3. **ACCEPTEE** - Acceptée par le technicien
4. **EN_COURS** - Intervention en cours
5. **RESOLUE** - Problème résolu
6. **FERMEE** - Demande fermée
7. **REFUSEE** - Demande refusée avec raison

### Endpoints
- `GET /api/demandes` - Liste des demandes (filtré par rôle)
- `POST /api/demandes` - Créer une demande
- `GET /api/demandes/:id` - Détails d'une demande
- `PUT /api/demandes/:id` - Modifier une demande
- `PATCH /api/demandes/:id/statut` - Changer le statut
- `POST /api/demandes/:id/assigner` - Assigner à un technicien

### Niveaux d'urgence
- `BASSE` - Traitement dans 48h
- `MOYENNE` - Traitement dans 24h
- `HAUTE` - Traitement dans 8h
- `CRITIQUE` - Traitement dans 2h

### Exemple : Créer une demande
```bash
POST /api/demandes
Authorization: Bearer <token>
Content-Type: application/json

{
  "titre": "Problème d'imprimante",
  "description": "L'imprimante ne fonctionne plus",
  "urgence": "MOYENNE",
  "categorie": "Hardware",
  "nature_technique": "Défaillance matérielle",
  "id_materiel": 2
}
```

## 🛠️ Interventions techniques

### Endpoints
- `GET /api/interventions` - Liste des interventions
- `POST /api/interventions` - Créer une intervention (Techniciens)
- `GET /api/interventions/:id` - Détails d'une intervention
- `PUT /api/interventions/:id` - Modifier une intervention
- `GET /api/interventions/stats` - Statistiques des interventions

### Exemple : Créer une intervention
```bash
POST /api/interventions
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_demande": 1,
  "actions_prises": "Remplacement du toner et nettoyage",
  "pieces_remplacees": "Toner noir HP CF280A",
  "probleme_resolu": true
}
```

## 🔔 Notifications

### Endpoints
- `GET /api/notifications/me` - Mes notifications
- `GET /api/notifications/unread-count` - Nombre de non lues
- `PATCH /api/notifications/:id/read` - Marquer comme lue
- `POST /api/notifications/mark-all-read` - Marquer toutes comme lues
- `DELETE /api/notifications/cleanup-read` - Supprimer les notifications lues

### Types de notifications
- `ASSIGNATION` - Demande assignée à un technicien
- `REFUS` - Demande refusée
- `RESOLUTION` - Demande résolue
- `CLOTURE` - Demande fermée
- `AUTRE` - Notification générale

## 📊 Rapports et statistiques (Gestionnaires)

### Rapports disponibles
- `GET /api/reports/system-overview` - Vue d'ensemble du système
- `GET /api/reports/technician-performance` - Performance des techniciens
- `GET /api/reports/incident-analysis` - Analyse des incidents
- `GET /api/reports/maintenance` - Rapport de maintenance
- `GET /api/reports/sla` - Conformité SLA
- `GET /api/reports/activity` - Rapport d'activité par période

### Exemple : Rapport de performance
```bash
GET /api/reports/technician-performance?date_debut=2024-01-01&date_fin=2024-01-31
Authorization: Bearer <token>
```

## 🚨 Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| **200** | Succès |
| **201** | Ressource créée |
| **400** | Requête invalide |
| **401** | Non authentifié |
| **403** | Accès interdit |
| **404** | Ressource introuvable |
| **409** | Conflit (ressource existante) |
| **422** | Erreur de validation |
| **429** | Trop de requêtes |
| **500** | Erreur serveur |

## 🔍 Filtres et recherche

### Paramètres de pagination
- `page` - Numéro de page (défaut: 1)
- `limit` - Éléments par page (défaut: 10, max: 100)

### Filtres communs
- `date_debut` - Date de début (format: YYYY-MM-DD)
- `date_fin` - Date de fin (format: YYYY-MM-DD)
- `statut` - Filtrer par statut
- `urgence` - Filtrer par urgence
- `search` ou `q` - Recherche textuelle

### Exemple avec filtres
```bash
GET /api/demandes?statut=EN_COURS&urgence=HAUTE&page=1&limit=20
```

## 🛡️ Sécurité et limites

### Rate limiting
- **Global** : 100 requêtes par 15 minutes par IP
- **Connexion** : 5 tentatives par 15 minutes par email
- **Reset password** : 3 tentatives par 15 minutes par IP

### Validation des données
- Tous les champs requis sont validés
- Formats email vérifiés
- Mots de passe : minimum 8 caractères avec majuscule, minuscule et chiffre
- Sanitisation automatique des entrées

### Headers de sécurité
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- Protection CORS configurée

## 🧪 Test de l'API

### Health check
```bash
GET /api/health
```

### Test de connectivité
```bash
GET /api/ping
```

### Informations de l'API
```bash
GET /api
```

## 📱 Exemples d'intégration

### JavaScript/Fetch
```javascript
// Connexion
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
};

// Requête authentifiée
const getMyRequests = async (token) => {
  const response = await fetch('/api/demandes?utilisateur_id=me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### cURL
```bash
# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"utilisateur@test.com","password":"password123"}'

# Créer une demande
curl -X POST http://localhost:3000/api/demandes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test API",
    "description": "Test via cURL",
    "urgence": "BASSE",
    "id_materiel": 1
  }'
```

## 🎯 Cas d'usage typiques

### 1. Workflow utilisateur standard
1. Connexion → `POST /api/auth/login`
2. Créer une demande → `POST /api/demandes`
3. Suivre ses demandes → `GET /api/demandes?utilisateur_id=me`
4. Consulter les notifications → `GET /api/notifications/me`

### 2. Workflow technicien
1. Connexion → `POST /api/auth/login`
2. Voir les demandes assignées → `GET /api/demandes?technicien_id=me`
3. Accepter une demande → `PATCH /api/demandes/:id/statut`
4. Créer une intervention → `POST /api/interventions`
5. Marquer comme résolu → `PUT /api/interventions/:id`

### 3. Workflow gestionnaire
1. Connexion → `POST /api/auth/login`
2. Voir les demandes en attente → `GET /api/demandes?statut=CREEE`
3. Assigner à un technicien → `POST /api/demandes/:id/assigner`
4. Générer des rapports → `GET /api/reports/system-overview`

Cette documentation couvre les aspects essentiels de l'API. Pour plus de détails, consultez la documentation Swagger interactive sur `/api/docs`.