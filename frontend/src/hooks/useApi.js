import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les appels API
 * @param {Function} apiCall - Fonction qui fait l'appel API
 * @param {Object} options - Options du hook
 * @param {boolean} options.immediate - Exécuter immédiatement au montage (défaut: false)
 * @param {Function} options.onSuccess - Callback de succès
 * @param {Function} options.onError - Callback d'erreur
 * @param {string} options.successMessage - Message de succès à afficher
 * @param {string} options.errorMessage - Message d'erreur personnalisé
 * @returns {Object} État et fonctions du hook
 */
export const useApi = (apiCall, options = {}) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    successMessage,
    errorMessage
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour exécuter l'appel API
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(...args);
      setData(result);
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMsg = errorMessage || err.message || 'Une erreur est survenue';
      setError(errorMsg);
      
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMsg);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, successMessage, errorMessage, onSuccess, onError]);

  // Fonction pour réinitialiser l'état
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Exécution immédiate si demandée
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

/**
 * Hook pour gérer les listes avec pagination, recherche et filtrage
 * @param {Function} apiCall - Fonction qui fait l'appel API
 * @param {Object} initialParams - Paramètres initiaux
 * @returns {Object} État et fonctions du hook
 */
export const useApiList = (apiCall, initialParams = {}) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les données
  const load = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const finalParams = { ...params, ...newParams };
      const response = await apiCall(finalParams);
      
      if (response.success) {
        setItems(response.data?.items || response.data || []);
        
        if (response.data?.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Erreur de chargement des données');
      toast.error(err.message || 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, [apiCall, params]);

  // Changer de page
  const changePage = useCallback((page) => {
    const newParams = { ...params, page };
    setParams(newParams);
    load(newParams);
  }, [params, load]);

  // Changer la recherche
  const search = useCallback((searchTerm) => {
    const newParams = { ...params, search: searchTerm, page: 1 };
    setParams(newParams);
    load(newParams);
  }, [params, load]);

  // Changer les filtres
  const filter = useCallback((filters) => {
    const newParams = { ...params, ...filters, page: 1 };
    setParams(newParams);
    load(newParams);
  }, [params, load]);

  // Rafraîchir les données
  const refresh = useCallback(() => {
    load(params);
  }, [load, params]);

  // Charger au montage
  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    pagination,
    params,
    loading,
    error,
    load,
    changePage,
    search,
    filter,
    refresh
  };
};

/**
 * Hook pour gérer les mutations (création, modification, suppression)
 * @param {Function} apiCall - Fonction qui fait l'appel API
 * @param {Object} options - Options du hook
 * @returns {Object} État et fonctions du hook
 */
export const useMutation = (apiCall, options = {}) => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(data);
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMsg = errorMessage || err.message || 'Une erreur est survenue';
      setError(errorMsg);
      
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMsg);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, successMessage, errorMessage, onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset
  };
};

export default useApi;