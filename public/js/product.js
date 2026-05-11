class ProductPage {
  static async render(container, id) {
    const data = await API.get(`/api/products/${id}`, false);
    if (!data.product) {
      container.innerHTML = '<h2 style="text-align:center;padding:40px;">Товар не найден</h2>';
      return;
    }
    
    const p = data.product;
    const isFav = App.favorites && App.favorites.some(f => f.id === p.id);
    const imgSrc = p.image ? `/Res/продукты/${p.image}` : '/Res/placeholder.jpg';
    
    container.innerHTML = `
      <div style="max-width:1000px; margin:30px auto; background:var(--white); border-radius:var(--radius); padding:40px; display:flex; gap:30px; flex-wrap:wrap;">
        <div style="flex:1; min-width:280px;">
          <img src="${imgSrc}" alt="${p.name}" style="width:100%; border-radius:var(--radius);" onerror="this.src='/Res/placeholder.jpg'">
        </div>
        <div style="flex:1; min-width:280px;">
          <div class="product-category-label">${p.category}</div>
          <h1 style="font-family:var(--font-heading); font-size:24px;">${p.name}</h1>
          <p style="color:var(--text-light);">${p.description}</p>
          <p style="font-size:13px;">Объём: ${p.volume || '—'}</p>
          <p style="font-size:13px; color:${p.in_stock ? 'var(--success)' : 'var(--danger)'};">${p.in_stock ? '✅ В наличии' : '❌ Нет в наличии'}</p>
          <div style="font-size:28px; font-weight:700; margin:12px 0;">${p.price.toLocaleString('ru-RU')} ₽</div>
          <button class="btn-add-cart" style="width:100%; padding:14px; font-size:14px;" onclick="App.addToCart(${p.id})" ${!p.in_stock ? 'disabled' : ''}>
            ${p.in_stock ? '🛒 В корзину' : 'Нет в наличии'}
          </button>
          <button class="favorite-btn" style="width:100%; padding:14px; margin-top:8px; position:static; border-radius:25px;" onclick="App.toggleFavorite(${p.id})">
            ${isFav ? '❤️ Убрать из избранного' : '♡ Добавить в избранное'}
          </button>
          <a href="#/catalog/${p.category}" style="display:block; margin-top:12px; color:var(--gold);">← Назад в каталог</a>
        </div>
      </div>`;
  }
}