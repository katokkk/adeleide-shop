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

router.post('/create', authenticate, (req, res) => {
  try {
    const { bonus_to_use = 0 } = req.body;
    const cartItems = db.prepare(`
      SELECT c.*, p.name, p.price
      FROM cart c JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `).all(req.user.id);
    if (cartItems.length === 0) return res.status(400).json({ error: 'Корзина пуста' });

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    const maxBonusUse = Math.floor(totalAmount * 0.3);
    const actualBonusUse = Math.min(bonus_to_use, maxBonusUse, user.loyalty_points);
    const finalAmount = totalAmount - actualBonusUse;
    const bonusEarned = Math.round(finalAmount * 0.03);

    const result = db.prepare(`
      INSERT INTO orders (user_id, total_amount, bonus_used, bonus_earned, final_amount, status, items)
      VALUES (?, ?, ?, ?, ?, 'В обработке', ?)
    `).run(req.user.id, totalAmount, actualBonusUse, bonusEarned, finalAmount, JSON.stringify(cartItems));

    db.prepare('UPDATE users SET loyalty_points = loyalty_points - ? + ?, total_orders = total_orders + 1 WHERE id = ?')
      .run(actualBonusUse, bonusEarned, req.user.id);

    db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);

    const updatedUser = db.prepare('SELECT id, surname, name, patronymic, email, loyalty_points, total_orders FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      message: 'Заказ оформлен',
      order: {
        id: result.lastInsertRowid,
        total_amount: totalAmount,
        bonus_used: actualBonusUse,
        bonus_earned: bonusEarned,
        final_amount: finalAmount,
        status: 'В обработке',
        items: cartItems
      },
      user: updatedUser
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/status', authenticate, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.id);
  res.json({ orders });
});

module.exports = router;