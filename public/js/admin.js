class AdminPage {
  static async render(container) {
    if (!App.user || !App.user.is_admin) {
      location.hash = '#/login';
      return;
    }

    const data = await API.get('/api/products?category=all&sort=name', false);
    const products = data.products || [];

    container.innerHTML = `
      <div style="max-width:1200px; margin:30px auto;">
        <h2 style="text-align:center;">⚙️ Панель администратора</h2>
        
        <div style="display:flex; gap:10px; margin:16px 0; flex-wrap:wrap;">
          <button class="btn-gold" onclick="AdminPage.showAddForm()">+ Добавить товар</button>
          <input id="adminSearch" placeholder="🔍 Поиск по названию..." style="flex:1; min-width:200px; padding:10px; border:1px solid #ddd; border-radius:8px;" oninput="AdminPage.search()">
          <select id="adminSort" onchange="AdminPage.sort()" style="padding:10px; border:1px solid #ddd; border-radius:8px;">
            <option value="name">По алфавиту</option>
            <option value="id">По ID</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </div>
        
        <table style="width:100%; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:#f5f0e6;">
              <th style="padding:12px;">ID</th>
              <th style="padding:12px;">Название</th>
              <th style="padding:12px;">Категория</th>
              <th style="padding:12px;">Цена</th>
              <th style="padding:12px;">Наличие</th>
              <th style="padding:12px;">Действия</th>
            </tr>
          </thead>
          <tbody id="adminTableBody">
            ${products.map(p => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;">${p.id}</td>
                <td style="padding:8px;">${p.name}</td>
                <td style="padding:8px;">${p.category}</td>
                <td style="padding:8px;">${p.price} ₽</td>
                <td style="padding:8px; color:${p.in_stock ? 'green' : 'red'};">
                  ${p.in_stock ? '✅' : '❌'}
                  <button class="btn-details" style="margin-left:8px; padding:6px 12px;" onclick="AdminPage.toggleStock(${p.id})">Сменить</button>
                </td>
                <td style="padding:8px;">
                  <button class="btn-details" style="padding:6px 12px;" onclick="AdminPage.showEditForm(${p.id})">✏️</button>
                  <button class="btn-details" style="padding:6px 12px; color:red;" onclick="AdminPage.deleteProduct(${p.id})">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  static async search() {
    const query = document.getElementById('adminSearch')?.value?.trim() || '';
    const sort = document.getElementById('adminSort')?.value || 'name';
    const data = await API.get(`/api/products?category=all&search=${encodeURIComponent(query)}&sort=${sort}`, false);
    const products = data.products || [];
    const tbody = document.getElementById('adminTableBody');
    if (tbody) {
      tbody.innerHTML = products.map(p => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;">${p.id}</td>
          <td style="padding:8px;">${p.name}</td>
          <td style="padding:8px;">${p.category}</td>
          <td style="padding:8px;">${p.price} ₽</td>
          <td style="padding:8px; color:${p.in_stock ? 'green' : 'red'};">
            ${p.in_stock ? '✅' : '❌'}
            <button class="btn-details" style="margin-left:8px; padding:6px 12px;" onclick="AdminPage.toggleStock(${p.id})">Сменить</button>
          </td>
          <td style="padding:8px;">
            <button class="btn-details" style="padding:6px 12px;" onclick="AdminPage.showEditForm(${p.id})">✏️</button>
            <button class="btn-details" style="padding:6px 12px; color:red;" onclick="AdminPage.deleteProduct(${p.id})">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  static async sort() {
    const query = document.getElementById('adminSearch')?.value?.trim() || '';
    const sort = document.getElementById('adminSort')?.value || 'name';
    const data = await API.get(`/api/products?category=all&search=${encodeURIComponent(query)}&sort=${sort}`, false);
    const products = data.products || [];
    const tbody = document.getElementById('adminTableBody');
    if (tbody) {
      tbody.innerHTML = products.map(p => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;">${p.id}</td>
          <td style="padding:8px;">${p.name}</td>
          <td style="padding:8px;">${p.category}</td>
          <td style="padding:8px;">${p.price} ₽</td>
          <td style="padding:8px; color:${p.in_stock ? 'green' : 'red'};">
            ${p.in_stock ? '✅' : '❌'}
            <button class="btn-details" style="margin-left:8px; padding:6px 12px;" onclick="AdminPage.toggleStock(${p.id})">Сменить</button>
          </td>
          <td style="padding:8px;">
            <button class="btn-details" style="padding:6px 12px;" onclick="AdminPage.showEditForm(${p.id})">✏️</button>
            <button class="btn-details" style="padding:6px 12px; color:red;" onclick="AdminPage.deleteProduct(${p.id})">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  static showAddForm() {
    const form = document.createElement('div');
    form.className = 'modal-overlay';
    form.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <h3>Добавить товар</h3>
        <input id="addName" placeholder="Название *" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <select id="addCategory" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
          <option value="face-creams">Кремы для лица</option>
          <option value="eye-creams">Кремы вокруг глаз</option>
          <option value="serums">Сыворотки</option>
          <option value="toners">Тоники</option>
          <option value="hand-creams">Кремы для рук</option>
          <option value="body-care">Уход за телом</option>
          <option value="cleansing">Очищение</option>
          <option value="fragrances">Ароматы</option>
          <option value="sun-protection">Защита от солнца</option>
          <option value="sets">Наборы</option>
        </select>
        <select id="addCollection" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
          <option value="">Без коллекции</option>
          <option value="golden">Золотая серия</option>
          <option value="problem-skin">Для проблемной кожи</option>
          <option value="sensitive-skin">Для чувствительной</option>
          <option value="urea-series">Серия с мочевиной</option>
          <option value="sun-protection">Защита от солнца</option>
          <option value="active-life">Для активной жизни</option>
          <option value="fragrances">Ароматы</option>
        </select>
        <input id="addPrice" type="number" placeholder="Цена *" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="addDescription" placeholder="Описание" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="addVolume" placeholder="Объём (50 мл)" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="addImage" placeholder="Фото (85.jpg)" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <label><input type="checkbox" id="addInStock" checked> В наличии</label>
        <button class="btn-gold" style="width:100%;margin-top:12px;" onclick="AdminPage.addProduct()">Добавить</button>
      </div>`;
    form.onclick = (e) => { if (e.target === form) form.remove(); };
    document.body.appendChild(form);
  }

  static async addProduct() {
    const data = {
      name: document.getElementById('addName').value.trim(),
      category: document.getElementById('addCategory').value,
      collection: document.getElementById('addCollection').value,
      price: document.getElementById('addPrice').value,
      description: document.getElementById('addDescription').value.trim(),
      volume: document.getElementById('addVolume').value.trim(),
      image: document.getElementById('addImage').value.trim(),
      in_stock: document.getElementById('addInStock').checked,
      skin_type: 'all'
    };
    if (!data.name || !data.price) { alert('Название и цена обязательны'); return; }
    const result = await API.post('/api/products', data);
    if (result.success) { alert('✅ Добавлено!'); location.hash = '#/admin'; }
    else alert(result.error || 'Ошибка');
  }

  static async showEditForm(id) {
    const data = await API.get(`/api/products/${id}`, false);
    const p = data.product;
    if (!p) return;
    
    const form = document.createElement('div');
    form.className = 'modal-overlay';
    form.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <h3>Редактировать #${p.id}</h3>
        <input id="editName" value="${p.name}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="editPrice" type="number" value="${p.price}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="editDescription" value="${p.description||''}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="editVolume" value="${p.volume||''}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <input id="editImage" value="${p.image||''}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
        <label><input type="checkbox" id="editInStock" ${p.in_stock?'checked':''}> В наличии</label>
        <button class="btn-gold" style="width:100%;margin-top:12px;" onclick="AdminPage.updateProduct(${id})">Сохранить</button>
      </div>`;
    form.onclick = (e) => { if (e.target === form) form.remove(); };
    document.body.appendChild(form);
  }

  static async updateProduct(id) {
    const data = {
      name: document.getElementById('editName').value.trim(),
      price: document.getElementById('editPrice').value,
      description: document.getElementById('editDescription').value.trim(),
      volume: document.getElementById('editVolume').value.trim(),
      image: document.getElementById('editImage').value.trim(),
      in_stock: document.getElementById('editInStock').checked
    };
    const result = await API.put(`/api/products/${id}`, data);
    if (result.success) { alert('✅ Обновлено!'); location.hash = '#/admin'; }
    else alert(result.error || 'Ошибка');
  }

  static async toggleStock(id) {
    const result = await API.patch(`/api/products/${id}/toggle-stock`, {});
    if (result.success) { alert('✅ Статус изменён'); location.hash = '#/admin'; }
    else alert(result.error || 'Ошибка');
  }

  static async deleteProduct(id) {
    if (!confirm('Удалить навсегда?')) return;
    const result = await API.del(`/api/products/${id}`);
    if (result.success) { alert('🗑️ Удалено'); location.hash = '#/admin'; }
    else alert(result.error || 'Ошибка');
  }
}