import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    // Retourner directement la data si elle existe
    return response.data;
  },
  (error) => {
    const { response } = error;
    
    // Gestion des erreurs spécifiques
    if (response) {
      switch (response.status) {
        case 401:
          // Token expiré ou invalide - rediriger vers login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            toast.error('Session expirée. Veuillez vous reconnecter.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          toast.error('Accès non autorisé');
          break;
          
        case 404:
          toast.error('Ressource introuvable');
          break;
          
        case 422:
          // Erreurs de validation - ne pas afficher de toast global
          break;
          
        case 429:
          toast.error('Trop de requêtes. Veuillez réessayer plus tard.');
          break;
          
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
          
        default:
          // Utiliser le message d'erreur du serveur si disponible
          const errorMessage = response.data?.message || 'Une erreur inattendue s\'est produite';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // Erreur réseau
      toast.error('Erreur de connexion. Vérifiez votre réseau.');
    } else {
      // Autre erreur
      toast.error('Une erreur inattendue s\'est produite');
    }
    
    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour les requêtes API
export const apiRequest = {
  // GET request
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // POST request
  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // PUT request
  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // PATCH request
  patch: async (url, data = {}) => {
    try {
      const response = await api.patch(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // DELETE request
  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Export de l'instance axios configurée
export default api;