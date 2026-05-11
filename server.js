const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initializeDatabase, seedProducts } = require('./database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const favoriteRoutes = require('./routes/favorites');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Статика
app.use(express.static(path.join(__dirname, 'public')));

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeDatabase();
seedProducts();

app.listen(PORT, () => {
  console.log(`🌸 ADELEIDE сервер запущен: http://localhost:${PORT}`);
});