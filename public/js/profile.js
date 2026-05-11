class ProfilePage {
  static async render(container) {
    if (!App.user) {
      window.location.hash = '#/login';
      return;
    }
    
    const u = App.user;
    
    container.innerHTML = `
      <div style="max-width:600px; margin:30px auto;">
        <h2 style="font-family:var(--font-heading); text-align:center;">Личный кабинет</h2>
        
        <div class="loyalty-card-display">
          <div>БОНУСНЫЙ БАЛАНС</div>
          <div class="loyalty-balance">${(u.loyalty_points || 0).toLocaleString('ru-RU')} ₽</div>
          <div style="font-size:11px;">3% кэшбэк с заказов</div>
        </div>
        
        <div style="background:var(--white); border-radius:var(--radius); padding:24px; margin:20px 0;">
          <h4 style="font-family:var(--font-heading);">Личные данные</h4>
          <p><strong>Email:</strong> ${u.email}</p>
          <p><strong>Заказов:</strong> ${u.total_orders || 0}</p>
          <div class="form-group">
            <label>Фамилия</label>
            <input type="text" id="surname" value="${u.surname || ''}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:8px;">
          </div>
          <div class="form-group">
            <label>Имя *</label>
            <input type="text" id="name" value="${u.name || ''}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:8px;">
          </div>
          <div class="form-group">
            <label>Отчество</label>
            <input type="text" id="patronymic" value="${u.patronymic || ''}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:8px;">
          </div>
          <button class="btn-gold" style="width:100%; margin-top:12px;" onclick="ProfilePage.save()">💾 Сохранить</button>
          <button class="btn-gold" style="width:100%; margin-top:8px; background:#888;" onclick="Auth.logout()">🚪 Выйти</button>
        </div>
        
        <button class="btn-gold" style="width:100%;" onclick="ProfilePage.showOrders()">📋 Мои заказы</button>
      </div>`;
  }

  static async save() {
    const name = document.getElementById('name').value.trim();
    if (!name) {
      alert('Имя обязательно');
      return;
    }
    const res = await API.put('/api/profile', {
      surname: document.getElementById('surname').value.trim(),
      name: name,
      patronymic: document.getElementById('patronymic').value.trim()
    });
    if (res.user) {
      App.user = res.user;
      App.showToast('Данные обновлены ✅');
    }
  }

  static async showOrders() {
    const data = await Cart.getOrderStatus();
    if (data.orders && data.orders.length > 0) {
      let html = '<h3>Ваши заказы</h3>';
      data.orders.forEach(o => {
        html += `<div style="background:white; padding:12px; margin:8px 0; border-radius:8px;">
          <strong>Заказ #${o.id}</strong> — ${new Date(o.created_at).toLocaleDateString('ru-RU')}<br>
          Сумма: ${o.total_amount} ₽ | Статус: ${o.status}</div>`;
      });
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `<div class="modal" style="max-width:500px;"><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>${html}</div>`;
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      document.body.appendChild(modal);
    } else {
      alert('У вас пока нет заказов');
    }
  }
}