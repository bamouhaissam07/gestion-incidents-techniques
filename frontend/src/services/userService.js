import { apiRequest } from './api';

/**
 * Service utilisateurs.
 * L'API retourne response.data.users (liste) ou response.data.user (item).
 */
class UserService {

  async getAllUsers(params = {}) {
    const response = await apiRequest.get('/users', params);
    return {
      success: response.success,
      data: response.data?.users ?? response.data ?? []
    };
  }

  async getAvailableTechnicians() {
    const response = await apiRequest.get('/users/technicians/available');
    return {
      success: response.success,
      data: response.data?.technicians ?? response.data?.users ?? response.data ?? []
    };
  }

  async getDepartments() {
    const response = await apiRequest.get('/users/departments');
    return { success: response.success, data: response.data ?? [] };
  }

  async getSpecialities() {
    const response = await apiRequest.get('/users/specialities');
    return { success: response.success, data: response.data ?? [] };
  }

  async createUser(userData) {
    const response = await apiRequest.post('/users', userData);
    return { success: response.success, data: response.data?.user ?? response.data };
  }

  async getUserById(id) {
    const response = await apiRequest.get(`/users/${id}`);
    return { success: response.success, data: response.data?.user ?? response.data };
  }

  async updateUser(id, userData) {
    const response = await apiRequest.put(`/users/${id}`, userData);
    return { success: response.success, data: response.data?.user ?? response.data };
  }

  async deleteUser(id) {
    const response = await apiRequest.delete(`/users/${id}`);
    return { success: response.success };
  }

  async getUserDashboard(id) {
    const response = await apiRequest.get(`/users/${id}/dashboard`);
    return { success: response.success, data: response.data?.dashboard ?? response.data };
  }

  async changeAvailability(id, disponible) {
    const response = await apiRequest.patch(`/users/${id}/availability`, { disponible });
    return { success: response.success, data: response.data };
  }
}

export const userService = new UserService();
export default userService;
