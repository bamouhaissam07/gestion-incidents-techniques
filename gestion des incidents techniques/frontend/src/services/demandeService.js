import { apiRequest } from './api';

/**
 * Service pour les demandes d'intervention.
 * L'API retourne les données dans response.data.demandes (liste)
 * ou response.data.demande (item unique).
 */
/**
 * Normalise une demande : ajoute .id = id_demande
 */
const normalizeDemande = (d) => d ? { ...d, id: d.id_demande ?? d.id } : d;
const normalizeDemandes = (list) => (list || []).map(normalizeDemande);

class DemandeService {

  async getAllDemandes(params = {}) {
    const response = await apiRequest.get('/demandes', params);
    return {
      success: response.success,
      data: normalizeDemandes(response.data?.demandes ?? response.data ?? [])
    };
  }

  async getDashboardData() {
    const response = await apiRequest.get('/demandes/dashboard');
    return { success: response.success, data: response.data?.dashboard ?? response.data };
  }

  async getCategories() {
    const response = await apiRequest.get('/demandes/categories');
    return { success: response.success, data: response.data?.categories ?? response.data ?? [] };
  }

  async getDemandesEnRetard() {
    const response = await apiRequest.get('/demandes/retard');
    return {
      success: response.success,
      data: normalizeDemandes(response.data?.demandesEnRetard ?? response.data ?? [])
    };
  }

  async getDemandesByStatut(statut) {
    const response = await apiRequest.get(`/demandes/statut/${statut}`);
    return {
      success: response.success,
      data: normalizeDemandes(response.data?.demandes ?? response.data ?? [])
    };
  }

  async getDemandesByUser(userId) {
    const response = await apiRequest.get('/demandes');
    return {
      success: response.success,
      data: normalizeDemandes(response.data?.demandes ?? response.data ?? [])
    };
  }

  async createDemande(demandeData) {
    const response = await apiRequest.post('/demandes', demandeData);
    return { success: response.success, data: normalizeDemande(response.data?.demande ?? response.data) };
  }

  async getDemandeById(id) {
    const response = await apiRequest.get(`/demandes/${id}`);
    return { success: response.success, data: normalizeDemande(response.data?.demande ?? response.data) };
  }

  async updateDemande(id, demandeData) {
    const response = await apiRequest.put(`/demandes/${id}`, demandeData);
    return { success: response.success, data: normalizeDemande(response.data?.demande ?? response.data) };
  }

  async deleteDemande(id) {
    const response = await apiRequest.delete(`/demandes/${id}`);
    return { success: response.success };
  }

  async changeStatut(id, statut, raison = '') {
    const response = await apiRequest.patch(`/demandes/${id}/statut`, { statut, raison_refus: raison });
    return { success: response.success, data: normalizeDemande(response.data?.demande ?? response.data) };
  }

  async assignerTechnicien(id, technicienId) {
    const response = await apiRequest.post(`/demandes/${id}/assigner`, {
      technicien_id: technicienId
    });
    return { success: response.success, data: normalizeDemande(response.data?.demande ?? response.data) };
  }
}

export const demandeService = new DemandeService();
export default demandeService;
