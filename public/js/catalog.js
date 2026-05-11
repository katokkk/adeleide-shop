class CatalogPage {
  static async render(container, category = 'all') {
    App.currentCategory = category;
    
    let url = `/api/products?category=${category}`;
    if (App.currentInStockOnly) url += '&in_stock=true';
    
    const data = await API.get(url, false);
    let products = data.products || [];

    const cats = {
      'all': 'Все товары',
      'face-creams': 'Кремы для лица',
      'eye-creams': 'Кремы вокруг глаз',
      'serums': 'Сыворотки',
      'toners': 'Тоники',
      'hand-creams': 'Кремы для рук',
      'body-care': 'Уход за телом',
      'cleansing': 'Очищение',
      'fragrances': 'Ароматы',
      'sun-protection': 'Защита от солнца',
      'sets': 'Наборы',
      'golden': 'Золотая серия',
      'problem-skin': 'Для проблемной кожи',
      'sensitive-skin': 'Для чувствительной',
      'urea-series': 'Серия с мочевиной',
      'active-life': 'Для активной жизни'
    };

    container.innerHTML = `
      <div class="catalog-layout">
        <aside class="sidebar">
          <h4>РАЗДЕЛ</h4>
          <div class="filter-group">
            ${['all','face-creams','eye-creams','serums','toners','hand-creams','body-care','cleansing','fragrances','sun-protection','sets'].map(key => `
              <label><input type="radio" name="catFilter" value="${key}" ${category===key?'checked':''} onchange="window.location.hash='#/catalog/${key}'"> ${cats[key]}</label>
            `).join('')}
          </div>
          <hr class="filter-divider">
          <h4>КОЛЛЕКЦИЯ</h4>
          <div class="filter-group">
            ${['golden','problem-skin','sensitive-skin','urea-series','sun-protection','active-life'].map(col => `
              <label><input type="radio" name="colFilter" value="${col}" ${category===col?'checked':''} onchange="window.location.hash='#/catalog/${col}'"> ${cats[col]}</label>
            `).join('')}
          </div>
          <hr class="filter-divider">
          <h4>НАЛИЧИЕ</h4>
          <div class="filter-group">
            <label><input type="checkbox" id="inStockFilter" ${App.currentInStockOnly?'checked':''} onchange="CatalogPage.toggleInStock()"> Только в наличии</label>
          </div>
          <hr class="filter-divider">
          <h4>ТИП КОЖИ</h4>
          <div class="filter-group" id="skinFilterGroup">
            <label><input type="checkbox" value="all" onchange="CatalogPage.applyFilters()"> Все типы</label>
            <label><input type="checkbox" value="oily" onchange="CatalogPage.applyFilters()"> Жирная</label>
            <label><input type="checkbox" value="dry" onchange="CatalogPage.applyFilters()"> Сухая</label>
            <label><input type="checkbox" value="normal" onchange="CatalogPage.applyFilters()"> Нормальная</label>
            <label><input type="checkbox" value="combination" onchange="CatalogPage.applyFilters()"> Комбинированная</label>
            <label><input type="checkbox" value="sensitive" onchange="CatalogPage.applyFilters()"> Чувствительная</label>
            <label><input type="checkbox" value="problem" onchange="CatalogPage.applyFilters()"> Проблемная</label>
          </div>
        </aside>
        <div class="catalog-main">
          <div class="catalog-header">
            <h2>${cats[category] || category}</h2>
            <span class="results-count" id="resultsCount">Найдено: ${products.length}</span>
            <select class="sort-select" id="sortSelect" onchange="CatalogPage.sortProducts()">
              <option value="default" ${App.currentSort==='default'?'selected':''}>По умолчанию</option>
              <option value="price-asc" ${App.currentSort==='price-asc'?'selected':''}>Цена ↑</option>
              <option value="price-desc" ${App.currentSort==='price-desc'?'selected':''}>Цена ↓</option>
              <option value="name-asc" ${App.currentSort==='name-asc'?'selected':''}>Название А-Я</option>
            </select>
          </div>
          <div class="products-grid" id="catalogGrid">
            ${products.length===0?'<p style="grid-column:1/-1;text-align:center;color:var(--text-lighter);">Товары не найдены</p>':products.map(p=>CatalogPage.productCard(p)).join('')}
          </div>
        </div>
      </div>`;
    
    App.currentProducts = products;
  }

  static productCard(p) {
    const isFav = App.favorites && App.favorites.some(f => f.id === p.id);
    const imgSrc = p.image ? `/Res/продукты/${p.image}` : '/Res/placeholder.jpg';
    return `
      <div class="product-card">
        <div class="product-img" onclick="window.location.hash='#/product/${p.id}'">
          <img src="${imgSrc}" alt="${p.name}" onerror="this.src='/Res/placeholder.jpg'">
          <button class="favorite-btn ${isFav?'active':''}" onclick="event.stopPropagation();App.toggleFavorite(${p.id})">${isFav?'❤️':'♡'}</button>
        </div>
        <div class="product-info">
          <div class="product-category-label">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price.toLocaleString('ru-RU')} ₽</div>
          <div class="product-actions">
            <button class="btn-add-cart" onclick="event.stopPropagation();App.addToCart(${p.id})">В корзину</button>
            <button class="btn-details" onclick="event.stopPropagation();window.location.hash='#/product/${p.id}'">Подробнее</button>
          </div>
        </div>
      </div>`;
  }

  static async toggleInStock() {
    const checkbox = document.getElementById('inStockFilter');
    App.currentInStockOnly = checkbox ? checkbox.checked : false;
    await CatalogPage.reloadProducts();
  }

  static async applyFilters() {
    const checkboxes = document.querySelectorAll('#skinFilterGroup input[type="checkbox"]:checked');
    App.currentSkinFilters = Array.from(checkboxes).map(cb => cb.value);
    await CatalogPage.reloadProducts();
  }

  static async reloadProducts() {
    const cat = App.currentCategory || 'all';
    let url = `/api/products?category=${cat}`;
    if (App.currentInStockOnly) url += '&in_stock=true';
    
    const data = await API.get(url, false);
    let products = data.products || [];
    
    // Фильтрация по типу кожи
    if (App.currentSkinFilters && App.currentSkinFilters.length > 0 && !App.currentSkinFilters.includes('all')) {
      products = products.filter(p => {
        if (!p.skin_type) return false;
        const skinTypes = p.skin_type.split(',').map(s => s.trim());
        return App.currentSkinFilters.some(sf => skinTypes.includes(sf));
      });
    }
    
    // Применяем сортировку
    products = CatalogPage.applySorting(products);
    
    App.currentProducts = products;
    
    const grid = document.getElementById('catalogGrid');
    const count = document.getElementById('resultsCount');
    
    if (grid) {
      grid.innerHTML = products.length === 0 
        ? '<p style="grid-column:1/-1;text-align:center;color:var(--text-lighter);">Товары не найдены</p>'
        : products.map(p => CatalogPage.productCard(p)).join('');
    }
    if (count) count.textContent = `Найдено: ${products.length}`;
  }

  static applySorting(products) {
    const sortType = App.currentSort || 'default';
    const sorted = [...products];
    
    if (sortType === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortType === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    
    return sorted;
  }

  static sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      App.currentSort = sortSelect.value;
    }
    
    // Применяем сортировку к текущим товарам и обновляем отображение
    const products = CatalogPage.applySorting(App.currentProducts || []);
    App.currentProducts = products;
    
    const grid = document.getElementById('catalogGrid');
    const count = document.getElementById('resultsCount');
    
    if (grid) {
      grid.innerHTML = products.length === 0 
        ? '<p style="grid-column:1/-1;text-align:center;color:var(--text-lighter);">Товары не найдены</p>'
        : products.map(p => CatalogPage.productCard(p)).join('');
    }
    if (count) count.textContent = `Найдено: ${products.length}`;
  }
}