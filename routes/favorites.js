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

// Получить избранное
router.get('/', authenticate, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT p.* FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
    `).all(req.user.id);
    
    res.json({ success: true, items });
  } catch (e) {
    console.error('Ошибка получения избранного:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Переключить избранное
router.post('/toggle', authenticate, (req, res) => {
  try {
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'product_id обязателен' });
    }

    const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND product_id = ?')
      .get(req.user.id, product_id);
    
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?')
        .run(req.user.id, product_id);
      res.json({ success: true, added: false, message: 'Удалено из избранного' });
    } else {
      db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)')
        .run(req.user.id, product_id);
      res.json({ success: true, added: true, message: 'Добавлено в избранное' });
    }
  } catch (e) {
    console.error('Ошибка переключения избранного:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;