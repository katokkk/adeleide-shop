const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const router = express.Router();
const JWT_SECRET = 'adeleide_super_secret_2024';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен' });
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ? AND is_admin = 1').get(user.id);
    if (!dbUser) return res.status(403).json({ error: 'Доступ запрещён' });
    req.user = dbUser;
    next();
  });
}

router.get('/', (req, res) => {
  try {
    const { category, collection, in_stock, search, sort } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    const collectionsList = ['golden', 'problem-skin', 'sensitive-skin', 'urea-series', 'sun-protection', 'active-life', 'fragrances'];
    const categoriesList = ['face-creams', 'eye-creams', 'serums', 'toners', 'hand-creams', 'body-care', 'cleansing', 'fragrances', 'sun-protection', 'sets'];
    
    if (category && category !== 'all') {
      if (categoriesList.includes(category)) {
        sql += ' AND category = ?';
        params.push(category);
      } else if (collectionsList.includes(category)) {
        sql += ' AND collection = ?';
        params.push(category);
      }
    }
    
    if (collection && collection !== 'all' && collectionsList.includes(collection)) {
      sql += ' AND collection = ?';
      params.push(collection);
    }
    
    if (in_stock === 'true') { 
      sql += ' AND in_stock = 1'; 
    }
    if (search) { 
      sql += ' AND (name LIKE ? OR description LIKE ?)'; 
      params.push(`%${search}%`, `%${search}%`); 
    }
    
    if (sort === 'name') {
      sql += ' ORDER BY name ASC';
    } else if (sort === 'price-asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      sql += ' ORDER BY price DESC';
    } else {
      sql += ' ORDER BY id ASC';
    }
    
    const products = db.prepare(sql).all(...params);
    res.json({ success: true, products, count: products.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json({ success: true, product });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', authenticateAdmin, (req, res) => {
  try {
    const { name, category, collection, price, skin_type, in_stock, description, volume, image } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Название, категория и цена обязательны' });
    }
    const result = db.prepare(
      'INSERT INTO products (name, category, collection, price, skin_type, in_stock, description, volume, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category, collection || '', parseFloat(price), skin_type || 'all', in_stock ? 1 : 0, description || '', volume || '', image || '');
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, category, collection, price, skin_type, in_stock, description, volume, image } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    
    db.prepare(`
      UPDATE products SET 
        name = ?, category = ?, collection = ?, price = ?, skin_type = ?, 
        in_stock = ?, description = ?, volume = ?, image = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      category || existing.category,
      collection || existing.collection,
      parseFloat(price) || existing.price,
      skin_type || existing.skin_type,
      in_stock !== undefined ? (in_stock ? 1 : 0) : existing.in_stock,
      description || existing.description,
      volume || existing.volume,
      image || existing.image,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, product: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Товар удалён' });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.patch('/:id/toggle-stock', authenticateAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    const newStock = existing.in_stock ? 0 : 1;
    db.prepare('UPDATE products SET in_stock = ? WHERE id = ?').run(newStock, req.params.id);
    res.json({ success: true, in_stock: newStock });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;