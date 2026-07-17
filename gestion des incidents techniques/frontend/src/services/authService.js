import { apiRequest } from './api';

/**
 * Normalise un objet user reçu du backend.
 * Le backend utilise id_personne — on ajoute un champ `id` pour
 * que le reste du frontend n'ait pas à connaître ce détail.
 */
const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user.id_personne ?? user.id
  };
};

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'token';
    this.USER_KEY = 'user';
  }

  // ─── Connexion ────────────────────────────────────────────────────────────
  async login(credentials) {
    try {
      // Le backend attend { email, password }
      const payload = {
        email: credentials.email,
        password: credentials.mot_de_passe || credentials.password
      };

      const response = await apiRequest.post('/auth/login', payload);

      if (response.success && response.data) {
        const { token, user } = response.data;
        const normalizedUser = normalizeUser(user);

        this.setToken(token);
        this.setCurrentUser(normalizedUser);

        return { token, user: normalizedUser };
      }

      throw new Error(response.message || 'Erreur de connexion');
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Email ou mot de passe incorrect'
      );
    }
  }

  // ─── Inscription ─────────────────────────────────────────────────────────
  async register(userData) {
    try {
      const response = await apiRequest.post('/auth/register', userData);

      if (response.success && response.data) {
        const { token, user } = response.data;
        const normalizedUser = normalizeUser(user);

        this.setToken(token);
        this.setCurrentUser(normalizedUser);

        return { token, user: normalizedUser };
      }

      throw new Error(response.message || "Erreur d'inscription");
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || "Erreur d'inscription"
      );
    }
  }

  // ─── Déconnexion ──────────────────────────────────────────────────────────
  async logout() {
    try {
      if (this.getToken()) {
        await apiRequest.post('/auth/logout');
      }
    } catch (error) {
      console.error('Erreur déconnexion côté serveur (ignorée) :', error);
    } finally {
      this.removeToken();
      this.removeCurrentUser();
    }
  }

  // ─── Profil ───────────────────────────────────────────────────────────────
  async getProfile() {
    try {
      const response = await apiRequest.get('/auth/profile');

      if (response.success && response.data) {
        // Le backend retourne { data: { user: {...} } }
        const user = normalizeUser(response.data.user ?? response.data);
        this.setCurrentUser(user);
        return user;
      }

      throw new Error(response.message || 'Erreur de récupération du profil');
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Erreur de récupération du profil'
      );
    }
  }

  // ─── Mise à jour du profil ────────────────────────────────────────────────
  async updateProfile(profileData) {
    try {
      const response = await apiRequest.put('/auth/profile', profileData);

      if (response.success && response.data) {
        const user = normalizeUser(response.data.user ?? response.data);
        this.setCurrentUser(user);
        return user;
      }

      throw new Error(response.message || 'Erreur de mise à jour du profil');
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Erreur de mise à jour du profil'
      );
    }
  }

  // ─── Changement de mot de passe ────────────────────────────────────────────
  async changePassword(passwordData) {
    try {
      // Le backend attend { currentPassword, newPassword }
      const payload = {
        currentPassword: passwordData.ancien_mot_de_passe,
        newPassword: passwordData.nouveau_mot_de_passe
      };
      const response = await apiRequest.post('/auth/change-password', payload);

      if (response.success) return response;
      throw new Error(response.message || 'Erreur de changement de mot de passe');
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Erreur de changement de mot de passe'
      );
    }
  }

  // ─── Vérification du token ────────────────────────────────────────────────
  async verifyToken() {
    try {
      const response = await apiRequest.get('/auth/verify');
      return response.success === true;
    } catch (error) {
      return false;
    }
  }

  // ─── Helpers localStorage ─────────────────────────────────────────────────
  getToken()           { return localStorage.getItem(this.TOKEN_KEY); }
  setToken(token)      { localStorage.setItem(this.TOKEN_KEY, token); }
  removeToken()        { localStorage.removeItem(this.TOKEN_KEY); }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  setCurrentUser(user) { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); }
  removeCurrentUser()  { localStorage.removeItem(this.USER_KEY); }

  isAuthenticated()    { return !!(this.getToken() && this.getCurrentUser()); }
  hasRole(role)        { return this.getCurrentUser()?.type_personne === role; }
  hasAnyRole(roles)    { return roles.includes(this.getCurrentUser()?.type_personne); }
}

export const authService = new AuthService();
export default authService;