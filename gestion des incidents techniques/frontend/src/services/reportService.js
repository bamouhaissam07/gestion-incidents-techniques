import { apiRequest } from './api';

/**
 * Service rapports.
 */
class ReportService {

  async getSystemOverview() {
    const response = await apiRequest.get('/reports/system-overview');
    return { success: response.success, data: response.data };
  }

  async getTechnicianPerformance(params = {}) {
    const response = await apiRequest.get('/reports/technician-performance', params);
    return { success: response.success, data: response.data };
  }

  async getIncidentAnalysis(params = {}) {
    const response = await apiRequest.get('/reports/incident-analysis', params);
    return { success: response.success, data: response.data };
  }

  async getMaintenanceReport(params = {}) {
    const response = await apiRequest.get('/reports/maintenance', params);
    return { success: response.success, data: response.data };
  }

  async getSlaReport(params = {}) {
    const response = await apiRequest.get('/reports/sla', params);
    return { success: response.success, data: response.data };
  }

  async getCustomerSatisfactionReport(params = {}) {
    const response = await apiRequest.get('/reports/customer-satisfaction', params);
    return { success: response.success, data: response.data };
  }

  async generateCustomReport(reportData) {
    const response = await apiRequest.post('/reports/generate', reportData);
    return { success: response.success, data: response.data };
  }

  async getSavedReports() {
    const response = await apiRequest.get('/reports/saved');
    return {
      success: response.success,
      // Le backend expose la clé française `rapports`.
      data: response.data?.rapports ?? []
    };
  }
}

export const reportService = new ReportService();
export default reportService;
