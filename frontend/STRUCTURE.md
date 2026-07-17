# Structure du Frontend React

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── ui/              # Composants UI de base
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── index.js
│   │   ├── layout/          # Composants de mise en page
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── Navigation.jsx
│   │   ├── forms/           # Composants de formulaires
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── DemandeForm.jsx
│   │   │   ├── InterventionForm.jsx
│   │   │   └── UserForm.jsx
│   │   ├── notifications/   # Système de notifications
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── NotificationList.jsx
│   │   │   └── NotificationItem.jsx
│   │   └── charts/          # Graphiques pour les rapports
│   │       ├── BarChart.jsx
│   │       ├── LineChart.jsx
│   │       └── PieChart.jsx
│   ├── pages/               # Pages de l'application
│   │   ├── auth/            # Pages d'authentification
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Profile.jsx
│   │   ├── common/          # Pages communes
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Unauthorized.jsx
│   │   ├── utilisateur/     # Pages utilisateur
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateDemande.jsx
│   │   │   ├── MesDemandes.jsx
│   │   │   └── DemandeDetail.jsx
│   │   ├── technicien/      # Pages technicien
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DemandesAssignees.jsx
│   │   │   ├── CreateIntervention.jsx
│   │   │   └── HistoriqueInterventions.jsx
│   │   └── gestionnaire/    # Pages gestionnaire
│   │       ├── Dashboard.jsx
│   │       ├── GestionDemandes.jsx
│   │       ├── GestionUtilisateurs.jsx
│   │       ├── GestionMateriel.jsx
│   │       ├── Rapports.jsx
│   │       └── RapportsSauvegardes.jsx
│   ├── context/             # Contextes React
│   │   ├── AuthContext.jsx  # Authentification
│   │   ├── NotificationContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/               # Hooks personnalisés
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useNotifications.js
│   │   └── useLocalStorage.js
│   ├── services/            # Services API
│   │   ├── api.js           # Configuration Axios
│   │   ├── authService.js   # Services d'authentification
│   │   ├── demandeService.js # Services demandes
│   │   ├── userService.js   # Services utilisateurs
│   │   ├── materielService.js
│   │   ├── interventionService.js
│   │   ├── notificationService.js
│   │   └── reportService.js
│   ├── utils/               # Utilitaires
│   │   ├── constants.js     # Constantes (statuts, rôles, etc.)
│   │   ├── helpers.js       # Fonctions utilitaires
│   │   ├── formatters.js    # Formatage dates, nombres, etc.
│   │   └── validators.js    # Validation des formulaires
│   ├── guards/              # Protection des routes
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleBasedRoute.jsx
│   ├── App.jsx              # Composant principal
│   ├── App.css              # Styles globaux (minimal)
│   ├── index.js             # Point d'entrée
│   └── index.css            # Import Tailwind
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Dépendances principales

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "recharts": "^2.5.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.315.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.7",
    "vite": "^4.1.0"
  }
}
```