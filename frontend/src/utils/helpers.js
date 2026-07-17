/**
 * Fonctions utilitaires générales
 */

// Obtenir les initiales d'un nom complet
export const getInitials = (nom, prenom) => {
  return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
};

// Capitaliser la première lettre
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Débounce pour optimiser les recherches
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Générer un ID unique
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Tronquer un texte
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

// Vérifier si une valeur est vide
export const isEmpty = (value) => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Classe CSS conditionelle
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Extraire les erreurs d'une réponse API
export const extractErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Une erreur inattendue s\'est produite';
};

// Calculer le temps écoulé depuis une date
export const getTimeAgo = (date) => {
  if (!date) return 'Date inconnue';
  
  const past = new Date(date);
  
  // Vérifier si la date est valide
  if (isNaN(past.getTime())) {
    console.warn('Date invalide reçue:', date);
    return 'Date invalide';
  }
  
  const now = new Date();
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Il y a ${diffInDays}j`;
  
  return past.toLocaleDateString('fr-FR');
};

// Vérifier si une demande est en retard
export const isOverdue = (dateCreation, urgence) => {
  const now = new Date();
  const created = new Date(dateCreation);
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  
  const slaHours = {
    CRITIQUE: 2,
    HAUTE: 8,
    MOYENNE: 24,
    BASSE: 48
  };
  
  return diffInHours > (slaHours[urgence] || 48);
};

// Obtenir la couleur de priorité basée sur l'urgence et le retard
export const getPriorityColor = (urgence, dateCreation, statut) => {
  // Si résolu ou fermé, pas de couleur d'alerte
  if (statut === 'RESOLUE' || statut === 'FERMEE') {
    return '';
  }
  
  if (isOverdue(dateCreation, urgence)) {
    return 'border-l-4 border-red-500 bg-red-50';
  }
  
  return '';
};