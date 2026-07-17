import { apiRequest } from './api';

/**
 * Service notifications.
 * L'API retourne response.data.notifications (liste).
 */
class NotificationService {

  async getMyNotifications(params = {}) {
    const response = await apiRequest.get('/notifications/me', params);
    return {
      success: response.success,
      data: response.data?.notifications ?? response.data ?? []
    };
  }

  async getAllNotifications(params = {}) {
    const response = await apiRequest.get('/notifications', params);
    return {
      success: response.success,
      data: response.data?.notifications ?? []
    };
  }

  async getUnreadCount() {
    const response = await apiRequest.get('/notifications/unread-count');
    return {
      success: response.success,
      // le backend retourne data.unreadCount
      data: { count: response.data?.unreadCount ?? 0 }
    };
  }

  async markAllAsRead() {
    const response = await apiRequest.post('/notifications/mark-all-read');
    return { success: response.success };
  }

  async markAsRead(id) {
    const response = await apiRequest.patch(`/notifications/${id}/read`);
    return { success: response.success };
  }

  async deleteNotification(id) {
    const response = await apiRequest.delete(`/notifications/${id}`);
    return { success: response.success };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
