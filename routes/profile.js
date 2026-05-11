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

// Получить профиль
router.get('/', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, surname, name, patronymic, email, loyalty_points, total_orders FROM users WHERE id = ?')
      .get(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ success: true, user });
  } catch (e) {
    console.error('Ошибка получения профиля:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить профиль
router.put('/', authenticate, (req, res) => {
  try {
    const { surname, name, patronymic } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Имя обязательно' });
    }

    db.prepare('UPDATE users SET surname = ?, name = ?, patronymic = ? WHERE id = ?')
      .run(surname || '', name, patronymic || '', req.user.id);
    
    const updated = db.prepare('SELECT id, surname, name, patronymic, email, loyalty_points, total_orders FROM users WHERE id = ?')
      .get(req.user.id);
    
    res.json({ success: true, user: updated });
  } catch (e) {
    console.error('Ошибка обновления профиля:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;