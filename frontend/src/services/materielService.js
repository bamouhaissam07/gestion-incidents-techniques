import { apiRequest } from './api';

/**
 * Service matériel.
 * L'API retourne response.data.materiel (liste) ou response.data (item).
 */
class MaterielService {

  async getAllMateriel(params = {}) {
    const response = await apiRequest.get('/materiel', params);
    return {
      success: response.success,
      // l'API met la liste dans data.materiel
      data: response.data?.materiel ?? response.data ?? []
    };
  }

  async searchMateriel(searchTerm) {
    const response = await apiRequest.get('/materiel/search', { search: searchTerm });
    return {
      success: response.success,
      data: response.data?.materiel ?? response.data ?? []
    };
  }

  async getEmplacements() {
    const response = await apiRequest.get('/materiel/emplacements');
    return { success: response.success, data: response.data ?? [] };
  }

  async getMaterielAttention() {
    const response = await apiRequest.get('/materiel/attention');
    return {
      success: response.success,
      data: response.data?.materiel ?? response.data ?? []
    };
  }

  async createMateriel(materielData) {
    const response = await apiRequest.post('/materiel', materielData);
    return { success: response.success, data: response.data?.materiel ?? response.data };
  }

  async getMaterielById(id) {
    const response = await apiRequest.get(`/materiel/${id}`);
    return { success: response.success, data: response.data?.materiel ?? response.data };
  }

  async updateMateriel(id, materielData) {
    const response = await apiRequest.put(`/materiel/${id}`, materielData);
    return { success: response.success, data: response.data?.materiel ?? response.data };
  }

  async deleteMateriel(id) {
    const response = await apiRequest.delete(`/materiel/${id}`);
    return { success: response.success };
  }

  async changeStatut(id, statut) {
    const response = await apiRequest.patch(`/materiel/${id}/statut`, { statut });
    return { success: response.success, data: response.data };
  }

  async getMaterielHistory(id) {
    const response = await apiRequest.get(`/materiel/${id}/history`);
    return { success: response.success, data: response.data ?? [] };
  }

  async getMaterielStats(id) {
    const response = await apiRequest.get(`/materiel/${id}/stats`);
    return { success: response.success, data: response.data };
  }
}

export const materielService = new MaterielService();
export default materielService;
