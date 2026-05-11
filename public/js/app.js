const App = {
  user: null,
  favorites: [],
  cart: [],

  getToken() {
    return localStorage.getItem('token');
  },

  async init() {
    document.getElementById('favBtn').onclick = () => location.hash = '#/favorites';
    document.getElementById('cartBtn').onclick = () => location.hash = '#/cart';
    document.getElementById('userBtn').onclick = () => location.hash = this.user ? '#/profile' : '#/login';
    document.getElementById('searchInput').onkeypress = (e) => { if (e.key === 'Enter') this.search(); };

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const u = await Auth.checkAuth();
        if (u) { this.user = u; await this.loadFavorites(); await this.loadCart(); }
      } catch(e) {}
    }

    this.updateUI();
    this.router();
    window.onhashchange = () => { this.router(); this.updateUI(); };
  },

  updateUI() {
    const fb = document.getElementById('favBadge');
    const cb = document.getElementById('cartBadge');
    const ub = document.getElementById('userBtn');
    if (fb) { const c = this.favorites.length; c > 0 ? (fb.classList.remove('hidden'), fb.textContent = c) : fb.classList.add('hidden'); }
    if (cb) { const c = this.cart.reduce((s,i) => s + (i.quantity||1), 0); c > 0 ? (cb.classList.remove('hidden'), cb.textContent = c) : cb.classList.add('hidden'); }
    if (ub) ub.textContent = this.user ? '👤✓' : '👤';

    const nav = document.getElementById('mainNav');
    if (nav) {
      const old = document.getElementById('adminLink');
      if (old) old.remove();
      if (this.user && this.user.is_admin) {
        const a = document.createElement('a');
        a.id = 'adminLink';
        a.href = '#/admin';
        a.textContent = '⚙️ Админ';
        a.style.color = '#8b6914';
        a.style.fontWeight = 'bold';
        a.onclick = () => location.hash = '#/admin';
        nav.appendChild(a);
      }
    }
  },

  async loadFavorites() {
    if (!this.user) { this.favorites = []; return; }
    try { const d = await Favorites.get(); this.favorites = d.items || []; } catch(e) {}
    this.updateUI();
  },

  async loadCart() {
    if (!this.user) { this.cart = []; return; }
    try { const d = await Cart.get(); this.cart = d.items || []; } catch(e) {}
    this.updateUI();
  },

  router() {
    const app = document.getElementById('app');
    if (!app) return;
    const h = location.hash || '#/';
    const p = h.substring(2).split('/');

    switch(p[0]) {
      case '': case 'home': this.home(app); break;
      case 'catalog': CatalogPage.render(app, p[1]||'all'); break;
      case 'product': ProductPage.render(app, p[1]); break;
      case 'cart': this.cartPage(app); break;
      case 'favorites': this.favPage(app); break;
      case 'login': this.loginPage(app); break;
      case 'profile': ProfilePage.render(app); break;
      case 'admin': 
        if (!this.user || !this.user.is_admin) { location.hash = '#/'; return; }
        if (typeof AdminPage !== 'undefined') AdminPage.render(app); 
        else app.innerHTML = '<h2 style="text-align:center;padding:40px;">Админ-панель не загружена</h2>'; 
        break;
      case 'search': this.searchPage(app, p[1]||''); break;
      case 'page': StaticPages.render(app, p[1]||'about'); break;
      default: app.innerHTML = '<h2 style="text-align:center;padding:40px;">404</h2>';
    }
  },

  home(app) {
    app.innerHTML = `<div class="hero"><h1>ADELEI<span>DE</span></h1><p>Российский бренд уходовой косметики</p><button class="btn-gold" onclick="location.hash='#/catalog/all'">Каталог</button></div>
    <h2 class="section-title">Категории</h2><div class="categories-grid" id="hc"></div>
    <h2 class="section-title">Новинки</h2><div class="products-grid" id="hp"></div>`;
    const cats = [
      {k:'face-creams',n:'Кремы для лица',i:'2.jpg'},{k:'serums',n:'Сыворотки',i:'3.jpg'},
      {k:'eye-creams',n:'Кремы вокруг глаз',i:'4.jpg'},{k:'toners',n:'Тоники',i:'5.jpg'},
      {k:'hand-creams',n:'Кремы для рук',i:'6.jpg'},{k:'body-care',n:'Уход за телом',i:'7.jpg'},
      {k:'cleansing',n:'Очищение',i:'8.jpg'},{k:'fragrances',n:'Ароматы',i:'9.jpg'},
      {k:'sun-protection',n:'Защита от солнца',i:'10.jpg'},{k:'sets',n:'Наборы',i:'11.jpg'}
    ];
    document.getElementById('hc').innerHTML = cats.map(c => `<div class="category-card" onclick="location.hash='#/catalog/${c.k}'"><img src="/Res/${c.i}" alt="${c.n}"><h3>${c.n}</h3></div>`).join('');
    API.get('/api/products?in_stock=true',false).then(d => {
      document.getElementById('hp').innerHTML = (d.products||[]).slice(0,8).map(p => CatalogPage.productCard(p)).join('');
    });
  },

  async cartPage(app) {
    if (!this.user) { app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>Корзина</h2><p>Войдите</p><button class="btn-gold" onclick="location.hash=\'#/login\'">Войти</button></div>'; return; }
    
    const data = await Cart.get();
    this.cart = data.items || [];
    this.updateUI();
    
    if (!this.cart.length) { app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>Корзина</h2><p>Пусто</p></div>'; return; }
    
    let total = 0;
    let html = '<div style="max-width:650px;margin:30px auto;"><h2 style="text-align:center;">Корзина</h2>';
    
    this.cart.forEach(item => {
      const itemTotal = item.price * (item.quantity || 1);
      total += itemTotal;
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#fff;margin:8px 0;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;gap:10px;">
          <div style="flex:1;min-width:150px;">
            <b>${item.name}</b><br>
            <span style="color:#888;">${item.price}₽ × ${item.quantity || 1} = <b>${itemTotal}₽</b></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button onclick="App.updateQuantity(${item.product_id}, -1)" style="width:32px;height:32px;border:1px solid #ddd;border-radius:50%;background:#f5f0e6;cursor:pointer;font-size:18px;line-height:1;">−</button>
            <span style="min-width:24px;text-align:center;font-weight:bold;">${item.quantity || 1}</span>
            <button onclick="App.updateQuantity(${item.product_id}, 1)" style="width:32px;height:32px;border:1px solid #ddd;border-radius:50%;background:#f5f0e6;cursor:pointer;font-size:18px;line-height:1;">+</button>
          </div>
          <button onclick="App.removeFromCart(${item.product_id})" style="background:#ff4444;color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:14px;">🗑️</button>
        </div>`;
    });

    const maxBonus = Math.floor(total * 0.3);
    const userBonus = this.user?.loyalty_points || 0;
    const availableBonus = Math.min(userBonus, maxBonus);

    html += `
      <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #eee;margin-top:12px;">
        <p style="font-size:16px;"><b>Итого: <span id="cartTotal">${total}</span>₽</b></p>
        <div style="margin:12px 0;">
          <label style="font-size:13px;">Списать бонусов (до ${maxBonus}₽):</label>
          <input type="number" id="bonusInput" value="0" min="0" max="${availableBonus}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;" oninput="App.updateBonusInfo(${total})">
          <p style="font-size:11px;color:#888;margin-top:4px;">Доступно: ${userBonus}₽</p>
          <p style="margin-top:8px;">К оплате: <b id="finalPrice">${total}₽</b></p>
          <p style="color:#b8944b;font-size:12px;">+ <span id="cashbackAmount">${Math.round(total * 0.03)}</span>₽ кэшбэка</p>
        </div>
        <button class="btn-gold" style="width:100%;padding:14px;font-size:16px;" onclick="App.checkout()">Оформить заказ</button>
      </div>
    </div>`;
    
    app.innerHTML = html;
  },

  async updateQuantity(productId, delta) {
    // Находим товар в корзине
    const item = this.cart.find(i => i.product_id === productId);
    if (!item) return;
    
    const newQty = (item.quantity || 1) + delta;
    
    if (newQty <= 0) {
      // Удаляем товар
      await Cart.remove(productId);
    } else {
      // Отправляем на сервер (добавляем с delta)
      await Cart.add(productId, delta);
    }
    
    // Перезагружаем корзину
    await this.loadCart();
    // Перерисовываем страницу корзины
    this.router();
  },

  updateBonusInfo(total) {
    const bonusInput = document.getElementById('bonusInput');
    const finalPrice = document.getElementById('finalPrice');
    const cashbackAmount = document.getElementById('cashbackAmount');
    
    if (!bonusInput || !finalPrice) return;
    
    let bonusToUse = parseInt(bonusInput.value) || 0;
    const maxBonus = Math.floor(total * 0.3);
    const userBonus = this.user?.loyalty_points || 0;
    
    if (bonusToUse > maxBonus) bonusToUse = maxBonus;
    if (bonusToUse > userBonus) bonusToUse = userBonus;
    if (bonusToUse < 0) bonusToUse = 0;
    
    bonusInput.value = bonusToUse;
    
    const final = total - bonusToUse;
    finalPrice.textContent = final.toLocaleString('ru-RU') + '₽';
    
    if (cashbackAmount) {
      cashbackAmount.textContent = Math.round(final * 0.03).toLocaleString('ru-RU') + '₽';
    }
  },

  favPage(app) {
    if (!this.user) { app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>Избранное</h2><p>Войдите</p></div>'; return; }
    Favorites.get().then(d => {
      this.favorites = d.items || [];
      this.updateUI();
      if (!this.favorites.length) { app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>Избранное</h2><p>Пусто</p></div>'; return; }
      app.innerHTML = `<div style="max-width:600px;margin:30px auto;"><h2>Избранное</h2>${this.favorites.map(p => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#fff;margin:8px 0;border-radius:8px;border:1px solid #eee;"><div><b>${p.name}</b><br>${p.price}₽</div><button onclick="App.toggleFavorite(${p.id})" style="background:#ff4444;color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:14px;">❤️ Убрать</button></div>`).join('')}</div>`;
    });
  },

  loginPage(app) {
    if (this.user) { location.hash = '#/profile'; return; }
    app.innerHTML = `<div style="max-width:400px;margin:50px auto;background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.1);"><h2 style="text-align:center;">Вход</h2>
    <input id="le" placeholder="Email" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
    <div style="position:relative;">
      <input id="lp" type="password" placeholder="Пароль" style="width:100%;padding:10px 40px 10px 10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
      <span id="togglePass" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;">👁️</span>
    </div>
    <button id="lbtn" class="btn-gold" style="width:100%;">Войти</button>
    <p style="text-align:center;margin-top:12px;"><a id="sreg" style="color:#b8944b;cursor:pointer;">Зарегистрироваться</a></p>
    <div id="rf" style="display:none;"><input id="rn" placeholder="Имя" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
    <input id="rs" placeholder="Фамилия" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px;">
    <button id="rbtn" class="btn-gold" style="width:100%;">Зарегистрироваться</button></div></div>`;
    
    document.getElementById('togglePass').onclick = () => {
      const inp = document.getElementById('lp');
      const icon = document.getElementById('togglePass');
      if (inp.type === 'password') { inp.type = 'text'; icon.textContent = '🙈'; }
      else { inp.type = 'password'; icon.textContent = '👁️'; }
    };
    
    document.getElementById('lbtn').onclick = async () => {
      const e = document.getElementById('le').value.trim(), p = document.getElementById('lp').value.trim();
      if (!e||!p) { alert('Заполните поля'); return; }
      const r = await Auth.login({email:e,password:p});
      if (r.token) { localStorage.setItem('token',r.token); this.user = r.user; this.updateUI(); location.hash = '#/'; }
      else alert(r.error||'Ошибка');
    };
    document.getElementById('sreg').onclick = () => document.getElementById('rf').style.display = 'block';
    document.getElementById('rbtn').onclick = async () => {
      const e = document.getElementById('le').value.trim(), p = document.getElementById('lp').value.trim(), n = document.getElementById('rn').value.trim();
      if (!e||!p||!n) { alert('Заполните все поля'); return; }
      const r = await Auth.register({email:e,password:p,name:n,surname:document.getElementById('rs').value.trim(),patronymic:''});
      if (r.token) { localStorage.setItem('token',r.token); this.user = r.user; this.updateUI(); location.hash = '#/'; }
      else alert(r.error||'Ошибка');
    };
  },

  searchPage(app, q) {
    const d = decodeURIComponent(q||'');
    app.innerHTML = `<div style="max-width:1200px;margin:30px auto;"><h2>Поиск: ${d}</h2><div class="products-grid" id="sr"></div></div>`;
    API.get(`/api/products?search=${encodeURIComponent(d)}`,false).then(r => {
      document.getElementById('sr').innerHTML = (r.products||[]).map(p => CatalogPage.productCard(p)).join('') || '<p>Ничего не найдено</p>';
    });
  },

  async addToCart(id) { await Cart.add(id); this.loadCart(); alert('Добавлено'); },
  async removeFromCart(id) { await Cart.remove(id); this.loadCart(); this.router(); },
  async toggleFavorite(id) { await Favorites.toggle(id); this.loadFavorites(); },
  async checkout() {
    const bonusInput = document.getElementById('bonusInput');
    const bonusToUse = bonusInput ? parseInt(bonusInput.value) || 0 : 0;
    
    const result = await Cart.checkout(bonusToUse);
    if (result.success) {
      this.user = result.user;
      this.cart = [];
      this.updateUI();
      alert(`Заказ оформлен! Начислено ${result.order.bonus_earned}₽ бонусов`);
      location.hash = '#/';
    } else {
      alert(result.error||'Ошибка');
    }
  },
  search() { const q = document.getElementById('searchInput')?.value?.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); },
  subscribe() { alert('Подписка оформлена!'); }
};

document.addEventListener('DOMContentLoaded', () => App.init());