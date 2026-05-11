class Cart {
  static async get() {
    return await API.get('/api/cart');
  }

  static async add(productId, qty = 1) {
    if (!App.user) {
      alert('Войдите в аккаунт, чтобы добавлять товары в корзину');
      window.location.hash = '#/login';
      return { success: false };
    }
    return await API.post('/api/cart/add', { product_id: productId, quantity: qty });
  }

  static async remove(productId) {
    return await API.del(`/api/cart/remove/${productId}`);
  }

  static async checkout(bonusToUse = 0) {
    return await API.post('/api/orders/create', { bonus_to_use: bonusToUse });
  }

  static async getOrderStatus() {
    return await API.get('/api/orders/status');
  }
}