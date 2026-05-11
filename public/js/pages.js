class StaticPages {
  static render(container, page) {
    const pages = {
      about: `
        <div style="max-width:800px; margin:30px auto; background:var(--white); border-radius:var(--radius); padding:40px;">
          <h2 style="font-family:var(--font-heading); text-align:center;">О бренде ADELEIDE</h2>
          <p style="line-height:1.8; margin:20px 0;">ADELEIDE — российский бренд уходовой косметики с более чем 20-летней историей, собственной лабораторией и производством, создающий безопасные и эффективные формулы для разных типов и состояний кожи.</p>
          <h3>1998 год. Начало</h3>
          <p>Появление бренда ADELEIDE — это сказка про Золушку. Небольшая производственная линия в Тамбове. Первая продукция — кремы по советским рецептурам.</p>
          <h3>2000-е. Переломный момент</h3>
          <p>В начале нулевых компания накапливала опыт и активно налаживала контакты на рынке сырья, упаковки и производственных технологий.</p>
          <p style="margin-top:20px;"><strong>300+</strong> создано наименований<br><strong>400+</strong> действующих рецептур<br><strong>450</strong> позиций разного сырья</p>
        </div>`,
      
      blog: `<div style="max-width:800px; margin:30px auto; background:var(--white); border-radius:var(--radius); padding:40px;"><h2 style="font-family:var(--font-heading);">Блог ADELEIDE</h2><p>Советы экспертов по уходу за кожей.</p></div>`,
      
      contacts: `
        <div style="max-width:800px; margin:30px auto; background:var(--white); border-radius:var(--radius); padding:40px;">
          <h2 style="font-family:var(--font-heading); text-align:center;">Контакты</h2>
          <div style="text-align:center; margin:20px 0;">
            <p>📞 +7 (495) 363-40-27</p>
            <p>✉️ info@adelade.ru</p>
            <p>🕐 пн-пт с 09:00 до 18:00</p>
            <p>📍 г. Москва, ул. Бойцовая, д. 22</p>
          </div>
          <div style="text-align:center;">
            <a href="https://t.me/adeleideru" target="_blank">📱 Telegram</a> | 
            <a href="https://vk.com/ladeleidelab" target="_blank">💬 VK</a>
          </div>
        </div>`,
      
      buyers: `<div style="max-width:800px; margin:30px auto; background:var(--white); border-radius:var(--radius); padding:40px;"><h2 style="font-family:var(--font-heading);">Информация для покупателей</h2><p>Доставка, оплата, возврат.</p></div>`
    };
    
    container.innerHTML = pages[page] || '<h2 style="text-align:center;padding:40px;">Страница не найдена</h2>';
  }
}