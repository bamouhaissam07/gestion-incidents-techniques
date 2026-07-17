import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Composant pour protéger les routes basées sur les rôles
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  redirectTo = '/unauthorized' 
}) => {
  const { user, hasAnyRole, isAuthenticated } = useAuth();

  // Si pas connecté, laisser ProtectedRoute gérer
  if (!isAuthenticated) {
    return children;
  }

  // Vérifier si l'utilisateur a l'un des rôles autorisés
  if (allowedRoles.length === 0 || hasAnyRole(allowedRoles)) {
    return children;
  }

  // Si un composant fallback est fourni, l'afficher
  if (fallback) {
    return fallback;
  }

  // Sinon rediriger
  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;