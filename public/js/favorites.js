class Favorites {
  static async get() {
    return await API.get('/api/favorites');
  }

  static async toggle(productId) {
    if (!App.user) {
      alert('Войдите в аккаунт, чтобы добавлять в избранное');
      window.location.hash = '#/login';
      return { success: false };
    }
    return await API.post('/api/favorites/toggle', { product_id: productId });
  }
}