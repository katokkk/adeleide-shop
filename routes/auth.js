const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const router = express.Router();
const JWT_SECRET = 'adeleide_super_secret_2024';

router.post('/register', async (req, res) => {
  try {
    const { surname, name, patronymic, email, password } = req.body;
    console.log('📝 Регистрация:', email);
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
    }
    
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (surname, name, patronymic, email, password_hash) VALUES (?, ?, ?, ?, ?)').run(
      surname || '', name, patronymic || '', email, hash
    );
    
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '30d' });
    
    console.log('✅ Зарегистрирован:', email);
    
    res.json({ 
      token, 
      user: { 
        id: result.lastInsertRowid, 
        surname: surname || '', 
        name, 
        patronymic: patronymic || '', 
        email, 
        loyalty_points: 0, 
        total_orders: 0,
        is_admin: 0
      } 
    });
  } catch (e) {
    console.error('❌ Ошибка регистрации:', e);
    res.status(500).json({ error: 'Ошибка сервера: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 Вход:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      console.log('❌ Пользователь не найден:', email);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log('❌ Неверный пароль для:', email);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    
    console.log('✅ Вход выполнен:', email);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        surname: user.surname, 
        name: user.name, 
        patronymic: user.patronymic, 
        email: user.email, 
        loyalty_points: user.loyalty_points, 
        total_orders: user.total_orders,
        is_admin: user.is_admin || 0
      } 
    });
  } catch (e) {
    console.error('❌ Ошибка входа:', e);
    res.status(500).json({ error: 'Ошибка сервера: ' + e.message });
  }
});

module.exports = router;