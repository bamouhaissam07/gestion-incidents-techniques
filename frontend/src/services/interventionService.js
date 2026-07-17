import { apiRequest } from './api';

/**
 * Service interventions.
 * L'API retourne response.data.interventions (liste) ou response.data.intervention (item).
 */
class InterventionService {

  async getAllInterventions(params = {}) {
    const response = await apiRequest.get('/interventions', params);
    return {
      success: response.success,
      data: response.data?.interventions ?? response.data ?? []
    };
  }

  async getStatsByTechnicien() {
    const response = await apiRequest.get('/interventions/stats-by-technicien');
    return { success: response.success, data: response.data };
  }

  async getTopPieces() {
    const response = await apiRequest.get('/interventions/top-pieces');
    return { success: response.success, data: response.data };
  }

  async getInterventionsByTechnicien(technicienId) {
    const response = await apiRequest.get(`/interventions/technicien/${technicienId}`);
    return {
      success: response.success,
      data: response.data?.interventions ?? response.data ?? []
    };
  }

  async getInterventionsByDemande(demandeId) {
    const response = await apiRequest.get(`/interventions/demande/${demandeId}`);
    return {
      success: response.success,
      data: response.data?.interventions ?? response.data ?? []
    };
  }

  async createIntervention(interventionData) {
    const response = await apiRequest.post('/interventions', interventionData);
    return {
      success: response.success,
      data: response.data?.intervention ?? response.data
    };
  }

  async getInterventionById(id) {
    const response = await apiRequest.get(`/interventions/${id}`);
    return {
      success: response.success,
      data: response.data?.intervention ?? response.data
    };
  }

  async updateIntervention(id, interventionData) {
    const response = await apiRequest.put(`/interventions/${id}`, interventionData);
    return {
      success: response.success,
      data: response.data?.intervention ?? response.data
    };
  }
}

export const interventionService = new InterventionService();
export default interventionService;
