const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const router = express.Router();
const JWT_SECRET = 'adeleide_super_secret_2024';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен' });
    req.user = user;
    next();
  });
}

// Получить корзину
router.get('/', authenticate, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT c.*, p.name, p.price, p.image, p.volume, p.category, p.description
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `).all(req.user.id);
    
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, items, total });
  } catch (e) {
    console.error('Ошибка получения корзины:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить в корзину
router.post('/add', authenticate, (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'product_id обязателен' });
    }

    // Проверяем существование товара
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    
    if (existing) {
      db.prepare('UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?')
        .run(quantity, req.user.id, product_id);
    } else {
      db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)')
        .run(req.user.id, product_id, quantity);
    }

    res.json({ success: true, message: 'Товар добавлен в корзину' });
  } catch (e) {
    console.error('Ошибка добавления в корзину:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить из корзины
router.delete('/remove/:productId', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?')
      .run(req.user.id, req.params.productId);
    res.json({ success: true, message: 'Товар удалён из корзины' });
  } catch (e) {
    console.error('Ошибка удаления из корзины:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;