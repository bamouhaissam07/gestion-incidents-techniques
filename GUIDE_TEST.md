# 🧪 Guide de Test Complet - API Gestion des Incidents

## 🚀 Démarrage du serveur

1. **Démarrer le serveur :**
   ```bash
   cd "C:\Users\bamou\Desktop\gestion des incidents techniques"
   node server.js
   ```

2. **Vérifier que le serveur fonctionne :**
   - Ouvrir le navigateur : http://localhost:3001/api/health
   - Vous devriez voir : `{"success":true,"message":"API fonctionnelle"...}`

## 🔐 Test d'authentification

### Via navigateur (Postman ou équivalent)

**POST** `http://localhost:3001/api/auth/login`
```json
{
  "email": "gestionnaire@test.com",
  "password": "password123"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
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

### Comptes de test disponibles

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `gestionnaire@test.com` | `password123` | GESTIONNAIRE |
| `technicien@test.com` | `password123` | TECHNICIEN |
| `utilisateur@test.com` | `password123` | UTILISATEUR |

## 📊 Tests des endpoints principaux

### 1. Health Check
- **GET** `http://localhost:3001/api/health`
- ✅ Aucune authentification requise

### 2. Documentation API
- **GET** `http://localhost:3001/api/docs`
- ✅ Documentation Swagger interactive

### 3. Test avec cURL (Windows)

```bash
# Test health
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"gestionnaire@test.com\",\"password\":\"password123\"}"

# Test avec token (remplacer YOUR_TOKEN)
curl -X GET http://localhost:3001/api/auth/profile ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🏗️ Workflow de test complet

### Étape 1 : Utilisateur final
1. **Se connecter comme utilisateur**
   ```json
   POST /api/auth/login
   {
     "email": "utilisateur@test.com",
     "password": "password123"
   }
   ```

2. **Créer une demande d'intervention**
   ```json
   POST /api/demandes
   Headers: Authorization: Bearer <token>
   {
     "titre": "Problème imprimante bureau 101",
     "description": "L'imprimante ne fonctionne plus depuis ce matin",
     "urgence": "MOYENNE",
     "categorie": "Hardware",
     "nature_technique": "Défaillance matérielle",
     "id_materiel": 1
   }
   ```

3. **Consulter ses demandes**
   ```json
   GET /api/demandes?utilisateur_id=me
   Headers: Authorization: Bearer <token>
   ```

### Étape 2 : Gestionnaire
1. **Se connecter comme gestionnaire**
   ```json
   POST /api/auth/login
   {
     "email": "gestionnaire@test.com", 
     "password": "password123"
   }
   ```

2. **Voir toutes les demandes**
   ```json
   GET /api/demandes
   Headers: Authorization: Bearer <token>
   ```

3. **Assigner une demande à un technicien**
   ```json
   POST /api/demandes/1/assigner
   Headers: Authorization: Bearer <token>
   {
     "id_technicien": 2
   }
   ```

### Étape 3 : Technicien
1. **Se connecter comme technicien**
   ```json
   POST /api/auth/login
   {
     "email": "technicien@test.com",
     "password": "password123"
   }
   ```

2. **Voir les demandes assignées**
   ```json
   GET /api/demandes?technicien_id=me&statut=ASSIGNEE
   Headers: Authorization: Bearer <token>
   ```

3. **Créer une intervention**
   ```json
   POST /api/interventions
   Headers: Authorization: Bearer <token>
   {
     "id_demande": 1,
     "actions_prises": "Remplacement du toner et nettoyage des têtes",
     "pieces_remplacees": "Toner noir HP CF280A",
     "probleme_resolu": true
   }
   ```

## 🌐 Test avec Postman

### Configuration Postman

1. **Créer une nouvelle collection** "API Gestion Incidents"

2. **Variables d'environnement :**
   - `baseUrl` = `http://localhost:3001`
   - `token` = (sera rempli après login)

3. **Script de login (à ajouter dans Tests) :**
   ```javascript
   if (responseCode.code === 200) {
       var responseData = pm.response.json();
       pm.environment.set("token", responseData.data.token);
   }
   ```

4. **Header automatique pour les requêtes authentifiées :**
   ```
   Key: Authorization
   Value: Bearer {{token}}
   ```

### Collection Postman recommandée

1. **Auth - Login Gestionnaire**
2. **Auth - Login Technicien** 
3. **Auth - Login Utilisateur**
4. **Users - Liste**
5. **Matériel - Liste**
6. **Demandes - Créer**
7. **Demandes - Liste**
8. **Demandes - Assigner**
9. **Interventions - Créer**
10. **Notifications - Liste**

## 🔧 Résolution des problèmes courants

### Erreur 500 - Erreur interne du serveur
1. Vérifier que MySQL est démarré
2. Vérifier les logs du serveur Node.js
3. Vérifier que la base de données `gestion_incidents` existe

### Erreur 401 - Non autorisé
1. Vérifier que le token JWT est correct
2. Vérifier la syntaxe de l'en-tête Authorization
3. Le token expire après 7 jours

### Port 3001 déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :3001
# Tuer le processus (remplacer PID)
taskkill /F /PID 1234
```

### Base de données non initialisée
```bash
npm run setup-dev
```

## 📱 Test depuis une application frontend

### Exemple JavaScript
```javascript
// Configuration de base
const API_BASE = 'http://localhost:3001';
let authToken = null;

// Fonction de login
async function login(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
        authToken = data.data.token;
        localStorage.setItem('token', authToken);
    }
    return data;
}

// Fonction pour requêtes authentifiées
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    });
    return await response.json();
}

// Exemples d'utilisation
login('utilisateur@test.com', 'password123')
    .then(() => apiCall('/api/demandes'))
    .then(data => console.log('Mes demandes:', data));
```

## ✅ Checklist de validation

- [ ] Le serveur démarre sans erreur
- [ ] Health check répond correctement
- [ ] Login gestionnaire fonctionne
- [ ] Login technicien fonctionne  
- [ ] Login utilisateur fonctionne
- [ ] Création de demande fonctionne
- [ ] Liste des demandes fonctionne
- [ ] Assignation de demande fonctionne
- [ ] Création d'intervention fonctionne
- [ ] Notifications fonctionnent
- [ ] Documentation Swagger accessible

## 🎯 Prochaines étapes

1. **Corriger les bugs de pagination** dans les contrôleurs
2. **Ajouter des tests unitaires** avec Jest
3. **Optimiser les requêtes SQL** pour de meilleures performances
4. **Ajouter la validation complète** des données
5. **Implémenter les notifications en temps réel** avec WebSocket
6. **Créer un frontend** (React/Vue.js) pour l'interface utilisateur

---

**✨ Votre API de gestion des incidents est fonctionnelle !** 
Les problèmes de pagination peuvent être corrigés mais les fonctionnalités principales marchent.