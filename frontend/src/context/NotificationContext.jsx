import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

// Création du contexte
const NotificationContext = createContext(null);

// Hook pour utiliser le contexte de notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};

// Provider de notifications
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState(null);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getMyNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Erreur de chargement des notifications:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingAll(true);
    try {
      const response = await notificationService.getAllNotifications();
      if (response.success) setAllNotifications(response.data || []);
    } catch (error) {
      console.error('Erreur de chargement de toutes les notifications:', error);
    } finally {
      setIsLoadingAll(false);
    }
  }, [isAuthenticated]);

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data?.count || 0);
      }
    } catch (error) {
      console.error('Erreur de chargement du compteur:', error);
    }
  }, [isAuthenticated]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id_notification === notificationId 
            ? { ...notif, lue: true }
            : notif
        )
      );
      setAllNotifications(prev => prev.map(notif =>
        notif.id_notification === notificationId ? { ...notif, lue: true } : notif
      ));
      
      // Réduire le compteur
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, lue: true }))
      );
      setAllNotifications(prev => prev.map(notif => ({ ...notif, lue: true })));
      
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Erreur lors du marquage global comme lu:', error);
      throw error;
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Retirer de l'état local
      const notification = notifications.find(n => n.id_notification === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id_notification !== notificationId));
      setAllNotifications(prev => prev.filter(notif => notif.id_notification !== notificationId));
      
      // Réduire le compteur si la notification n'était pas lue
      if (notification && !notification.lue) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  };

  // Ajouter une nouvelle notification (pour les mises à jour en temps réel)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.lue) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Rafraîchir les données
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount()
    ]);
  }, [loadNotifications, loadUnreadCount]);

  // Effet pour charger les données au montage et aux changements d'authentification
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
      
      // Optionnel: polling pour les mises à jour périodiques
      const interval = setInterval(refresh, 30000); // Toutes les 30 secondes
      
      return () => clearInterval(interval);
    } else {
      // Nettoyer l'état si l'utilisateur se déconnecte
      setNotifications([]);
      setAllNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isAuthenticated, refresh, loadUnreadCount]);

  // Valeurs du contexte
  const contextValue = {
    // État
    notifications,
    allNotifications,
    unreadCount,
    isLoading,
    isLoadingAll,
    error,
    
    // Actions
    loadNotifications,
    loadAllNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refresh
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
