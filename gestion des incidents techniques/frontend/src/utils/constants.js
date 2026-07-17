// Configuration API — le backend tourne sur le port 3001
export const API_BASE_URL = 'http://localhost:3001/api';

// Rôles utilisateurs
export const ROLES = {
  UTILISATEUR: 'UTILISATEUR',
  TECHNICIEN: 'TECHNICIEN', 
  GESTIONNAIRE: 'GESTIONNAIRE'
};

// Labels pour les rôles
export const ROLE_LABELS = {
  [ROLES.UTILISATEUR]: 'Utilisateur',
  [ROLES.TECHNICIEN]: 'Technicien',
  [ROLES.GESTIONNAIRE]: 'Gestionnaire'
};

// Statuts des demandes d'intervention
export const DEMANDE_STATUS = {
  CREEE: 'CREEE',
  ASSIGNEE: 'ASSIGNEE',
  ACCEPTEE: 'ACCEPTEE',
  REFUSEE: 'REFUSEE',
  EN_COURS: 'EN_COURS',
  RESOLUE: 'RESOLUE',
  FERMEE: 'FERMEE'
};

// Labels pour les statuts
export const DEMANDE_STATUS_LABELS = {
  [DEMANDE_STATUS.CREEE]: 'Créée',
  [DEMANDE_STATUS.ASSIGNEE]: 'Assignée',
  [DEMANDE_STATUS.ACCEPTEE]: 'Acceptée',
  [DEMANDE_STATUS.REFUSEE]: 'Refusée',
  [DEMANDE_STATUS.EN_COURS]: 'En cours',
  [DEMANDE_STATUS.RESOLUE]: 'Résolue',
  [DEMANDE_STATUS.FERMEE]: 'Fermée'
};

// Couleurs pour les statuts
export const DEMANDE_STATUS_COLORS = {
  [DEMANDE_STATUS.CREEE]: 'bg-gray-100 text-gray-700 border-gray-300',
  [DEMANDE_STATUS.ASSIGNEE]: 'bg-blue-100 text-blue-700 border-blue-300',
  [DEMANDE_STATUS.ACCEPTEE]: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  [DEMANDE_STATUS.REFUSEE]: 'bg-red-100 text-red-700 border-red-300',
  [DEMANDE_STATUS.EN_COURS]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [DEMANDE_STATUS.RESOLUE]: 'bg-green-100 text-green-700 border-green-300',
  [DEMANDE_STATUS.FERMEE]: 'bg-gray-100 text-gray-500 border-gray-300'
};

// Niveaux d'urgence
export const URGENCE_LEVELS = {
  BASSE: 'BASSE',
  MOYENNE: 'MOYENNE',
  HAUTE: 'HAUTE',
  CRITIQUE: 'CRITIQUE'
};

// Labels pour l'urgence
export const URGENCE_LABELS = {
  [URGENCE_LEVELS.BASSE]: 'Basse',
  [URGENCE_LEVELS.MOYENNE]: 'Moyenne',
  [URGENCE_LEVELS.HAUTE]: 'Haute',
  [URGENCE_LEVELS.CRITIQUE]: 'Critique'
};

// Couleurs pour l'urgence
export const URGENCE_COLORS = {
  [URGENCE_LEVELS.BASSE]: 'bg-green-100 text-green-700 border-green-300',
  [URGENCE_LEVELS.MOYENNE]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [URGENCE_LEVELS.HAUTE]: 'bg-orange-100 text-orange-700 border-orange-300',
  [URGENCE_LEVELS.CRITIQUE]: 'bg-red-100 text-red-700 border-red-300'
};

// Statuts du matériel
export const MATERIEL_STATUS = {
  EN_SERVICE: 'EN_SERVICE',
  EN_PANNE: 'EN_PANNE',
  EN_MAINTENANCE: 'EN_MAINTENANCE',
  HORS_SERVICE: 'HORS_SERVICE'
};

// Labels pour les statuts matériel
export const MATERIEL_STATUS_LABELS = {
  [MATERIEL_STATUS.EN_SERVICE]: 'En service',
  [MATERIEL_STATUS.EN_PANNE]: 'En panne',
  [MATERIEL_STATUS.EN_MAINTENANCE]: 'En maintenance',
  [MATERIEL_STATUS.HORS_SERVICE]: 'Hors service'
};

// Couleurs pour les statuts matériel
export const MATERIEL_STATUS_COLORS = {
  [MATERIEL_STATUS.EN_SERVICE]: 'bg-green-100 text-green-700 border-green-300',
  [MATERIEL_STATUS.EN_PANNE]: 'bg-red-100 text-red-700 border-red-300',
  [MATERIEL_STATUS.EN_MAINTENANCE]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [MATERIEL_STATUS.HORS_SERVICE]: 'bg-gray-100 text-gray-500 border-gray-300'
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  ASSIGNATION: 'ASSIGNATION',
  REFUS: 'REFUS',
  RESOLUTION: 'RESOLUTION',
  CLOTURE: 'CLOTURE',
  NOUVELLE_DEMANDE: 'NOUVELLE_DEMANDE',
  INTERVENTION: 'INTERVENTION',
  ACCEPTATION: 'ACCEPTATION',
  AUTRE: 'AUTRE'
};

// Couleurs des rôles
export const ROLE_COLORS = {
  [ROLES.UTILISATEUR]: 'bg-blue-100 text-blue-700 border-blue-300',
  [ROLES.TECHNICIEN]: 'bg-purple-100 text-purple-700 border-purple-300',
  [ROLES.GESTIONNAIRE]: 'bg-indigo-100 text-indigo-700 border-indigo-300'
};
