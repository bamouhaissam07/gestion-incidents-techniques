/**
 * Fonctions de formatage des données
 */

// Formater une date
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
};

// Formater date et heure
export const formatDateTime = (date) => {
  if (!date) return '-';
  
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formater seulement l'heure
export const formatTime = (date) => {
  if (!date) return '-';
  
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formater un nom complet
export const formatFullName = (prenom, nom) => {
  if (!prenom && !nom) return '-';
  return `${prenom || ''} ${nom || ''}`.trim();
};

// Formater un numéro de téléphone
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Format français : 01 23 45 67 89
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
};

// Formater une adresse email (masquer une partie pour la confidentialité)
export const formatEmailPrivate = (email) => {
  if (!email) return '-';
  
  const [local, domain] = email.split('@');
  if (local.length <= 3) return email;
  
  const maskedLocal = local.substring(0, 2) + '*'.repeat(local.length - 3) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
};

// Formater une taille de fichier
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formater un pourcentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Formater un numéro avec séparateurs de milliers
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat('fr-FR').format(number);
};

// Formater une durée en heures/minutes
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}min`;
};

// Formater un délai SLA
export const formatSLA = (urgence) => {
  const slaHours = {
    CRITIQUE: 2,
    HAUTE: 8,
    MOYENNE: 24,
    BASSE: 48
  };
  
  const hours = slaHours[urgence] || 48;
  
  if (hours < 24) {
    return `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}j`;
};

// Formater un statut pour l'affichage
export const formatStatus = (status, labels = {}) => {
  if (!status) return '-';
  return labels[status] || status.replace(/_/g, ' ').toLowerCase();
};