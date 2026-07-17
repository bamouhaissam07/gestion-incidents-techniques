import React from 'react';
import { classNames } from '../../utils/helpers';
import { 
  DEMANDE_STATUS_COLORS, 
  URGENCE_COLORS, 
  MATERIEL_STATUS_COLORS,
  ROLE_COLORS 
} from '../../utils/constants';

/**
 * Composant Badge pour afficher les statuts et informations colorées
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  status = null,
  urgence = null,
  materielStatus = null,
  role = null
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-primary-100 text-primary-700 border-primary-300',
    success: 'bg-success-100 text-success-700 border-success-300',
    warning: 'bg-warning-100 text-warning-700 border-warning-300',
    danger: 'bg-danger-100 text-danger-700 border-danger-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  // Déterminer les classes de couleur basées sur les props spécifiques
  let colorClasses = variantClasses[variant];

  if (status && DEMANDE_STATUS_COLORS[status]) {
    colorClasses = DEMANDE_STATUS_COLORS[status];
  } else if (urgence && URGENCE_COLORS[urgence]) {
    colorClasses = URGENCE_COLORS[urgence];
  } else if (materielStatus && MATERIEL_STATUS_COLORS[materielStatus]) {
    colorClasses = MATERIEL_STATUS_COLORS[materielStatus];
  } else if (role && ROLE_COLORS[role]) {
    colorClasses = ROLE_COLORS[role];
  }

  return (
    <span
      className={classNames(
        baseClasses,
        sizeClasses[size],
        colorClasses,
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Badge spécifique pour les statuts de demande
 */
export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const labels = {
    CREEE: 'Créée',
    ASSIGNEE: 'Assignée',
    ACCEPTEE: 'Acceptée',
    REFUSEE: 'Refusée',
    EN_COURS: 'En cours',
    RESOLUE: 'Résolue',
    FERMEE: 'Fermée'
  };

  return (
    <Badge status={status} size={size} className={className}>
      {labels[status] || status}
    </Badge>
  );
};

/**
 * Badge spécifique pour l'urgence
 */
export const UrgenceBadge = ({ urgence, size = 'sm', className = '' }) => {
  const labels = {
    BASSE: 'Basse',
    MOYENNE: 'Moyenne',
    HAUTE: 'Haute',
    CRITIQUE: 'Critique'
  };

  return (
    <Badge urgence={urgence} size={size} className={className}>
      {labels[urgence] || urgence}
    </Badge>
  );
};

/**
 * Badge spécifique pour les statuts du matériel
 */
export const MaterielStatusBadge = ({ status, size = 'sm', className = '' }) => {
  const labels = {
    EN_SERVICE: 'En service',
    EN_PANNE: 'En panne',
    EN_MAINTENANCE: 'En maintenance',
    HORS_SERVICE: 'Hors service'
  };

  return (
    <Badge materielStatus={status} size={size} className={className}>
      {labels[status] || status}
    </Badge>
  );
};

/**
 * Badge spécifique pour les rôles utilisateur
 */
export const RoleBadge = ({ role, size = 'sm', className = '' }) => {
  const labels = {
    UTILISATEUR: 'Utilisateur',
    TECHNICIEN: 'Technicien',
    GESTIONNAIRE: 'Gestionnaire'
  };

  return (
    <Badge role={role} size={size} className={className}>
      {labels[role] || role}
    </Badge>
  );
};

export default Badge;