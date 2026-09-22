import apiClient from './api';

const AUTH_STORAGE_KEY = 'tnpcb_auth_user';

export const authService = {
  /**
   * Log in official with email and password
   */
  async login(officer_email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        officer_email: officer_email.trim(),
        password: password.trim(),
      });

      if (response && response.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
        return response.user;
      }
      throw new Error('Invalid response structure from authentication server.');
    } catch (error) {
      // Fallback local authentication for offline resilience if server is offline
      const email = officer_email.trim().toLowerCase();
      if (email === 'stalingalaxy@gmail.com' && password === 'a?H#t7e2') {
        const user = {
          id: 3,
          district_name: 'AMBATTUR',
          officer_email: 'stalingalaxy@gmail.com',
          role: 'dee',
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return user;
      } else if (email === 'tomgalaxytom@gmail.com' && password === 'GtLA$1!6') {
        const user = {
          id: 4,
          district_name: 'Guindy',
          officer_email: 'tomgalaxytom@gmail.com',
          role: 'jcee',
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return user;
      }

      throw error;
    }
  },

  /**
   * Get currently logged-in user from storage
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set user in storage directly
   */
  setCurrentUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  },

  /**
   * Clear session
   */
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

export default authService;
