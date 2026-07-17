import { useState, useMemo } from 'react';

/**
 * Hook pour gérer la pagination côté client
 * @param {Array} data - Données à paginer
 * @param {number} itemsPerPage - Nombre d'éléments par page
 * @returns {Object} État et fonctions de pagination
 */
export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculer les données de pagination
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);

    return {
      currentItems,
      currentPage,
      totalPages,
      totalItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1
    };
  }, [data, itemsPerPage, currentPage]);

  // Aller à la page suivante
  const nextPage = () => {
    if (paginationInfo.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Aller à la page précédente
  const previousPage = () => {
    if (paginationInfo.hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Aller à une page spécifique
  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, paginationInfo.totalPages));
    setCurrentPage(pageNum);
  };

  // Réinitialiser à la première page
  const resetPage = () => {
    setCurrentPage(1);
  };

  // Générer les numéros de pages à afficher
  const getPageNumbers = (maxPages = 5) => {
    const { totalPages } = paginationInfo;
    
    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPages - 1);
    
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return {
    ...paginationInfo,
    nextPage,
    previousPage,
    goToPage,
    resetPage,
    getPageNumbers
  };
};

/**
 * Hook pour gérer la pagination côté serveur
 * @param {Object} initialState - État initial de la pagination
 * @returns {Object} État et fonctions de pagination serveur
 */
export const useServerPagination = (initialState = {}) => {
  const [paginationState, setPaginationState] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    ...initialState
  });

  // Mettre à jour l'état de pagination avec les données du serveur
  const updatePagination = (newState) => {
    setPaginationState(prev => ({ ...prev, ...newState }));
  };

  // Changer de page
  const changePage = (page) => {
    setPaginationState(prev => ({ ...prev, page }));
  };

  // Changer la limite par page
  const changeLimit = (limit) => {
    setPaginationState(prev => ({ ...prev, limit, page: 1 }));
  };

  // Calculer les informations dérivées
  const derivedInfo = useMemo(() => {
    const { page, limit, total } = paginationState;
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);
    
    return {
      startIndex,
      endIndex,
      hasNext: page < paginationState.totalPages,
      hasPrevious: page > 1,
      isEmpty: total === 0
    };
  }, [paginationState]);

  // Générer les paramètres pour l'API
  const getApiParams = () => {
    const { page, limit } = paginationState;
    return { page, limit };
  };

  return {
    ...paginationState,
    ...derivedInfo,
    updatePagination,
    changePage,
    changeLimit,
    getApiParams
  };
};

export default usePagination;