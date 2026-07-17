import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// États possibles de l'authentification
const AuthState = {
  IDLE: 'idle',
  LOADING: 'loading', 
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Actions du reducer
const AuthActions = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_UNAUTHENTICATED: 'SET_UNAUTHENTICATED',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// État initial
const initialState = {
  user: null,
  token: null,
  status: AuthState.IDLE,
  error: null
};

// Reducer pour gérer les états d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActions.SET_LOADING:
      return {
        ...state,
        status: AuthState.LOADING,
        error: null
      };
      
    case AuthActions.SET_AUTHENTICATED:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        status: AuthState.AUTHENTICATED,
        error: null
      };
      
    case AuthActions.SET_UNAUTHENTICATED:
      return {
        ...state,
        user: null,
        token: null,
        status: AuthState.UNAUTHENTICATED,
        error: null
      };
      
    case AuthActions.SET_ERROR:
      return {
        ...state,
        status: AuthState.ERROR,
        error: action.payload
      };
      
    case AuthActions.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      
    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext(null);

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider d'authentification
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialiser l'authentification au chargement
  useEffect(() => {
    initializeAuth();
  }, []);

  // Fonction d'initialisation
  const initializeAuth = async () => {
    dispatch({ type: AuthActions.SET_LOADING });
    
    try {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        // Vérifier la validité du token
        const isValid = await authService.verifyToken();
        
        if (isValid) {
          dispatch({ 
            type: AuthActions.SET_AUTHENTICATED, 
            payload: { user, token }
          });
        } else {
          // Token invalide, nettoyer
          await authService.logout();
          dispatch({ type: AuthActions.SET_UNAUTHENTICATED });
        }
      } else {
        dispatch({ type: AuthActions.SET_UNAUTHENTICATED });
      }
    } catch (error) {
      console.error('Erreur d\'initialisation auth:', error);
      await authService.logout();
      dispatch({ type: AuthActions.SET_UNAUTHENTICATED });
    }
  };

  // Fonction de connexion
  const login = async (credentials) => {
    dispatch({ type: AuthActions.SET_LOADING });
    
    try {
      const data = await authService.login(credentials);
      
      dispatch({
        type: AuthActions.SET_AUTHENTICATED,
        payload: { user: data.user, token: data.token }
      });
      
      toast.success(`Bienvenue, ${data.user.prenom} !`);
      
      return data;
    } catch (error) {
      dispatch({ 
        type: AuthActions.SET_ERROR, 
        payload: error.message || 'Erreur de connexion'
      });
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    dispatch({ type: AuthActions.SET_LOADING });
    
    try {
      const data = await authService.register(userData);
      
      dispatch({
        type: AuthActions.SET_AUTHENTICATED,
        payload: { user: data.user, token: data.token }
      });
      
      toast.success('Compte créé avec succès !');
      
      return data;
    } catch (error) {
      dispatch({ 
        type: AuthActions.SET_ERROR, 
        payload: error.message || 'Erreur d\'inscription'
      });
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: AuthActions.SET_UNAUTHENTICATED });
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      dispatch({ type: AuthActions.SET_UNAUTHENTICATED });
    }
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      dispatch({ type: AuthActions.UPDATE_USER, payload: updatedUser });
      toast.success('Profil mis à jour avec succès');
      return updatedUser;
    } catch (error) {
      toast.error(error.message || 'Erreur de mise à jour du profil');
      throw error;
    }
  };

  // Fonction de changement de mot de passe
  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      toast.success('Mot de passe modifié avec succès');
    } catch (error) {
      toast.error(error.message || 'Erreur de changement de mot de passe');
      throw error;
    }
  };

  // Fonctions utilitaires
  const isAuthenticated = state.status === AuthState.AUTHENTICATED;
  const isLoading = state.status === AuthState.LOADING;
  const hasRole = (role) => state.user?.type_personne === role;
  const hasAnyRole = (roles) => roles.includes(state.user?.type_personne);

  // Valeurs du contexte
  const contextValue = {
    // État
    user: state.user,
    token: state.token,
    status: state.status,
    error: state.error,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // Utilitaires
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};