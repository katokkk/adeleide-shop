class Auth {
  static async register(data) {
    return await API.post('/api/auth/register', data, false);
  }
  static async login(data) {
    return await API.post('/api/auth/login', data, false);
  }
  static async checkAuth() {
    try {
      const res = await API.get('/api/profile');
      return res.user || null;
    } catch(e) { return null; }
  }
  static logout() {
    localStorage.removeItem('token');
    App.user = null;
    App.favorites = [];
    App.cart = [];
    location.hash = '#/';
  }
}