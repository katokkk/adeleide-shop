const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'adeleide.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surname TEXT DEFAULT '',
      name TEXT NOT NULL,
      patronymic TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      loyalty_points REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      collection TEXT,
      price REAL NOT NULL,
      skin_type TEXT,
      in_stock INTEGER DEFAULT 1,
      description TEXT,
      volume TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS cart (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      bonus_used REAL DEFAULT 0,
      bonus_earned REAL DEFAULT 0,
      final_amount REAL NOT NULL,
      status TEXT DEFAULT 'В обработке',
      items TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Создаём админа, если его нет
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@adeleide.ru');
  if (!adminExists) {
    const hash = bcrypt.hashSync('qwerty123', 10);
    db.prepare('INSERT INTO users (surname, name, patronymic, email, password_hash, loyalty_points, total_orders, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      'Администратор', 'Admin', '', 'admin@adeleide.ru', hash, 0, 0, 1
    );
    console.log('✅ Администратор создан (admin@adeleide.ru / qwerty123)');
  }

  console.log('✅ База данных готова');
}

function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (count.cnt > 0) return;

  const products = [
    { name:'Крем для лица дневной с гиалуроновой кислотой 1,5%', category:'face-creams', collection:'golden', price:1035, skin_type:'all', in_stock:1, description:'Глубокое увлажнение на весь день.', volume:'50 мл', image:'1.jpg' },
    { name:'Осветляющий крем с витамином С 1,5%', category:'face-creams', collection:'golden', price:1035, skin_type:'all', in_stock:1, description:'Сияние и ровный тон кожи.', volume:'50 мл', image:'2.jpg' },
    { name:'Крем для лица с ретинолом 0,15%', category:'face-creams', collection:'golden', price:1035, skin_type:'all', in_stock:1, description:'Антивозрастной уход с ретинолом.', volume:'50 мл', image:'3.jpg' },
    { name:'Крем для чувствительной кожи SPF 20 SENSITIVE', category:'face-creams', collection:'sensitive-skin', price:753, skin_type:'sensitive', in_stock:1, description:'Защита и успокоение чувствительной кожи.', volume:'40 мл', image:'4.jpg' },
    { name:'BB-крем SPF 20+ для натурального макияжа', category:'face-creams', collection:'golden', price:1250, skin_type:'all', in_stock:1, description:'Тон, уход и защита в одном флаконе.', volume:'30 мл', image:'5.jpg' },
    { name:'Ночной восстанавливающий крем с пептидами', category:'face-creams', collection:'golden', price:1180, skin_type:'all', in_stock:1, description:'Восстановление во время сна.', volume:'50 мл', image:'6.jpg' },
    { name:'Увлажняющий крем с керамидами', category:'face-creams', collection:'golden', price:980, skin_type:'dry', in_stock:1, description:'Укрепление защитного барьера.', volume:'50 мл', image:'7.jpg' },
    { name:'Матирующий крем для жирной кожи', category:'face-creams', collection:'problem-skin', price:890, skin_type:'oily', in_stock:1, description:'Контроль блеска и сужение пор.', volume:'45 мл', image:'8.jpg' },
    { name:'Крем-лифтинг с коллагеном', category:'face-creams', collection:'golden', price:1350, skin_type:'all', in_stock:0, description:'Упругость и подтянутость кожи.', volume:'50 мл', image:'9.jpg' },
    { name:'Питательный крем с маслом ши', category:'face-creams', collection:'golden', price:950, skin_type:'dry', in_stock:1, description:'Глубокое питание сухой кожи.', volume:'50 мл', image:'10.jpg' },
    { name:'Крем с ниацинамидом 5%', category:'face-creams', collection:'problem-skin', price:1100, skin_type:'oily', in_stock:1, description:'Против воспалений и расширенных пор.', volume:'45 мл', image:'11.jpg' },
    { name:'Крем с азелаиновой кислотой', category:'face-creams', collection:'problem-skin', price:1050, skin_type:'problem', in_stock:1, description:'Выравнивание текстуры и борьба с акне.', volume:'40 мл', image:'12.jpg' },
    { name:'Солнцезащитный крем SPF 30', category:'face-creams', collection:'sun-protection', price:870, skin_type:'all', in_stock:1, description:'Надёжная защита от UVA/UVB лучей.', volume:'50 мл', image:'13.jpg' },
    { name:'Крем с пробиотиками для микрофлоры кожи', category:'face-creams', collection:'sensitive-skin', price:1200, skin_type:'sensitive', in_stock:1, description:'Баланс микробиома и здоровье кожи.', volume:'45 мл', image:'14.jpg' },
    { name:'Антивозрастной крем 45+', category:'face-creams', collection:'golden', price:1450, skin_type:'dry', in_stock:1, description:'Комплексный уход для зрелой кожи.', volume:'50 мл', image:'15.jpg' },
    { name:'Осветляющий крем для кожи вокруг глаз с витамином C', category:'eye-creams', collection:'golden', price:690, skin_type:'all', in_stock:1, description:'Уменьшение тёмных кругов и сияние.', volume:'15 мл', image:'16.jpg' },
    { name:'Крем вокруг глаз с гиалуроновой кислотой', category:'eye-creams', collection:'golden', price:720, skin_type:'all', in_stock:1, description:'Интенсивное увлажнение нежной зоны.', volume:'15 мл', image:'17.jpg' },
    { name:'Крем вокруг глаз с ретинолом', category:'eye-creams', collection:'golden', price:780, skin_type:'all', in_stock:1, description:'Против морщин и гусиных лапок.', volume:'15 мл', image:'18.jpg' },
    { name:'Крем вокруг глаз с кофеином', category:'eye-creams', collection:'active-life', price:650, skin_type:'all', in_stock:1, description:'Против отёчности и утренней свежести.', volume:'15 мл', image:'19.jpg' },
    { name:'Успокаивающий крем вокруг глаз', category:'eye-creams', collection:'sensitive-skin', price:680, skin_type:'sensitive', in_stock:1, description:'Для чувствительной зоны вокруг глаз.', volume:'15 мл', image:'20.jpg' },
    { name:'Крем-филлер вокруг глаз', category:'eye-creams', collection:'golden', price:850, skin_type:'all', in_stock:0, description:'Мгновенное заполнение морщин.', volume:'10 мл', image:'21.jpg' },
    { name:'Ночной крем вокруг глаз', category:'eye-creams', collection:'golden', price:760, skin_type:'all', in_stock:1, description:'Восстановление за ночь.', volume:'15 мл', image:'22.jpg' },
    { name:'Крем вокруг глаз SPF 15', category:'eye-creams', collection:'sun-protection', price:700, skin_type:'all', in_stock:1, description:'Защита нежной зоны от солнца.', volume:'15 мл', image:'23.jpg' },
    { name:'Сыворотка для лица гиалуроновая 2%', category:'serums', collection:'golden', price:1150, skin_type:'all', in_stock:1, description:'Глубокое увлажнение и антивозрастной уход.', volume:'30 мл', image:'24.jpg' },
    { name:'Сыворотка для лица с витамином C 2%', category:'serums', collection:'golden', price:1150, skin_type:'all', in_stock:1, description:'Яркость и антиоксидантная защита.', volume:'30 мл', image:'25.jpg' },
    { name:'Сыворотка с ретинолом 0,3%', category:'serums', collection:'golden', price:1250, skin_type:'all', in_stock:1, description:'Обновление клеток и омоложение.', volume:'30 мл', image:'26.jpg' },
    { name:'Сыворотка с ниацинамидом 10%', category:'serums', collection:'problem-skin', price:1080, skin_type:'oily', in_stock:1, description:'Контроль себума и сужение пор.', volume:'30 мл', image:'27.jpg' },
    { name:'Сыворотка с пептидами', category:'serums', collection:'golden', price:1350, skin_type:'all', in_stock:1, description:'Упругость и эластичность.', volume:'30 мл', image:'28.jpg' },
    { name:'Успокаивающая сыворотка с пантенолом', category:'serums', collection:'sensitive-skin', price:950, skin_type:'sensitive', in_stock:1, description:'Снятие покраснений и комфорт.', volume:'30 мл', image:'29.jpg' },
    { name:'Сыворотка с салициловой кислотой', category:'serums', collection:'problem-skin', price:1020, skin_type:'problem', in_stock:1, description:'Против акне и воспалений.', volume:'25 мл', image:'30.jpg' },
    { name:'Антиоксидантная сыворотка с феруловой кислотой', category:'serums', collection:'golden', price:1400, skin_type:'all', in_stock:1, description:'Мощная защита от свободных радикалов.', volume:'30 мл', image:'31.jpg' },
    { name:'Сыворотка с мочевиной 5%', category:'serums', collection:'urea-series', price:880, skin_type:'dry', in_stock:1, description:'Интенсивное увлажнение и отшелушивание.', volume:'30 мл', image:'32.jpg' },
    { name:'Сыворотка-бустер с гиалуроновой кислотой', category:'serums', collection:'golden', price:990, skin_type:'all', in_stock:1, description:'Усиление увлажнения в паре с кремом.', volume:'20 мл', image:'33.jpg' },
    { name:'Сыворотка с цинком', category:'serums', collection:'problem-skin', price:920, skin_type:'oily', in_stock:0, description:'Подсушивание и матирование.', volume:'25 мл', image:'34.jpg' },
    { name:'Сыворотка с коллагеном и эластином', category:'serums', collection:'golden', price:1280, skin_type:'all', in_stock:1, description:'Восстановление упругости.', volume:'30 мл', image:'35.jpg' },
    { name:'Тоник увлажняющий с гиалуроновой кислотой', category:'toners', collection:'golden', price:580, skin_type:'all', in_stock:1, description:'Подготовка кожи к уходу.', volume:'200 мл', image:'36.jpg' },
    { name:'Тоник с салициловой кислотой', category:'toners', collection:'problem-skin', price:550, skin_type:'oily', in_stock:1, description:'Очищение пор и контроль жирности.', volume:'200 мл', image:'37.jpg' },
    { name:'Тоник успокаивающий с ромашкой', category:'toners', collection:'sensitive-skin', price:520, skin_type:'sensitive', in_stock:1, description:'Мягкое очищение без спирта.', volume:'200 мл', image:'38.jpg' },
    { name:'Тоник с витамином C', category:'toners', collection:'golden', price:600, skin_type:'all', in_stock:1, description:'Сияние и свежесть.', volume:'200 мл', image:'39.jpg' },
    { name:'Тоник-мист освежающий', category:'toners', collection:'active-life', price:480, skin_type:'all', in_stock:1, description:'Освежение в течение дня.', volume:'150 мл', image:'40.jpg' },
    { name:'Тоник с молочной кислотой', category:'toners', collection:'golden', price:620, skin_type:'all', in_stock:1, description:'Мягкое отшелушивание.', volume:'200 мл', image:'41.jpg' },
    { name:'Крем для рук с маслом какао', category:'hand-creams', collection:'golden', price:380, skin_type:'all', in_stock:1, description:'Питание и защита рук.', volume:'75 мл', image:'42.jpg' },
    { name:'Крем для рук с мочевиной 5%', category:'hand-creams', collection:'urea-series', price:420, skin_type:'dry', in_stock:1, description:'Интенсивное восстановление.', volume:'75 мл', image:'43.jpg' },
    { name:'Крем для рук SPF 15', category:'hand-creams', collection:'sun-protection', price:350, skin_type:'all', in_stock:1, description:'Защита рук от фотостарения.', volume:'60 мл', image:'44.jpg' },
    { name:'Крем для рук с коллагеном', category:'hand-creams', collection:'golden', price:400, skin_type:'all', in_stock:1, description:'Упругость кожи рук.', volume:'75 мл', image:'45.jpg' },
    { name:'Крем для рук с пантенолом', category:'hand-creams', collection:'sensitive-skin', price:360, skin_type:'sensitive', in_stock:1, description:'Заживление микротрещин.', volume:'75 мл', image:'46.jpg' },
    { name:'Крем для рук ночной восстанавливающий', category:'hand-creams', collection:'golden', price:450, skin_type:'dry', in_stock:1, description:'Интенсивный ночной уход.', volume:'50 мл', image:'47.jpg' },
    { name:'Крем для тела с мочевиной 10%', category:'body-care', collection:'urea-series', price:890, skin_type:'dry', in_stock:1, description:'Глубокое увлажнение тела.', volume:'200 мл', image:'48.jpg' },
    { name:'Масло для тела питательное', category:'body-care', collection:'golden', price:750, skin_type:'dry', in_stock:1, description:'Бархатистая кожа после душа.', volume:'150 мл', image:'49.jpg' },
    { name:'Скраб для тела с солью Мёртвого моря', category:'body-care', collection:'golden', price:680, skin_type:'all', in_stock:1, description:'Обновление и гладкость.', volume:'250 г', image:'50.jpg' },
    { name:'Лосьон для тела увлажняющий', category:'body-care', collection:'golden', price:620, skin_type:'all', in_stock:1, description:'Лёгкое увлажнение на каждый день.', volume:'250 мл', image:'51.jpg' },
    { name:'Крем для тела с ретинолом', category:'body-care', collection:'golden', price:950, skin_type:'all', in_stock:0, description:'Омоложение кожи тела.', volume:'180 мл', image:'52.jpg' },
    { name:'Гель для душа с ароматом розы', category:'body-care', collection:'fragrances', price:480, skin_type:'all', in_stock:1, description:'Нежное очищение и аромат.', volume:'300 мл', image:'53.jpg' },
    { name:'Крем для тела солнцезащитный SPF 30', category:'body-care', collection:'sun-protection', price:820, skin_type:'all', in_stock:1, description:'Защита тела на пляже.', volume:'150 мл', image:'54.jpg' },
    { name:'Молочко для тела после загара', category:'body-care', collection:'sun-protection', price:700, skin_type:'all', in_stock:1, description:'Восстановление после солнца.', volume:'200 мл', image:'55.jpg' },
    { name:'Крем для тела с церамидами', category:'body-care', collection:'sensitive-skin', price:780, skin_type:'sensitive', in_stock:1, description:'Восстановление барьера кожи.', volume:'200 мл', image:'56.jpg' },
    { name:'Антицеллюлитный крем с кофеином', category:'body-care', collection:'active-life', price:920, skin_type:'all', in_stock:1, description:'Упругость и тонус.', volume:'180 мл', image:'57.jpg' },
    { name:'Гидрофильное масло для снятия макияжа', category:'cleansing', collection:'golden', price:650, skin_type:'all', in_stock:1, description:'Бережное растворение макияжа.', volume:'150 мл', image:'58.jpg' },
    { name:'Пенка для умывания с гиалуроновой кислотой', category:'cleansing', collection:'golden', price:520, skin_type:'all', in_stock:1, description:'Мягкое очищение без стянутости.', volume:'150 мл', image:'59.jpg' },
    { name:'Гель для умывания с салициловой кислотой', category:'cleansing', collection:'problem-skin', price:490, skin_type:'oily', in_stock:1, description:'Глубокое очищение пор.', volume:'150 мл', image:'60.jpg' },
    { name:'Мицеллярная вода', category:'cleansing', collection:'sensitive-skin', price:380, skin_type:'all', in_stock:1, description:'Деликатное удаление загрязнений.', volume:'250 мл', image:'61.jpg' },
    { name:'Скраб для лица энзимный', category:'cleansing', collection:'golden', price:570, skin_type:'all', in_stock:1, description:'Мягкое отшелушивание.', volume:'75 мл', image:'62.jpg' },
    { name:'Пенка для умывания с мочевиной', category:'cleansing', collection:'urea-series', price:460, skin_type:'dry', in_stock:1, description:'Увлажняющее очищение.', volume:'150 мл', image:'63.jpg' },
    { name:'Демакияж для глаз', category:'cleansing', collection:'sensitive-skin', price:420, skin_type:'sensitive', in_stock:1, description:'Без раздражения для глаз.', volume:'100 мл', image:'64.jpg' },
    { name:'Очищающая маска-плёнка', category:'cleansing', collection:'problem-skin', price:550, skin_type:'oily', in_stock:0, description:'Удаление чёрных точек.', volume:'60 мл', image:'65.jpg' },
    { name:'Парфюм ADELEIDE Fleur d\'Or', category:'fragrances', collection:'fragrances', price:2800, skin_type:'all', in_stock:1, description:'Цветочный аромат с нотами золотого жасмина.', volume:'50 мл', image:'66.jpg' },
    { name:'Парфюм ADELEIDE Bois Mystique', category:'fragrances', collection:'fragrances', price:3200, skin_type:'all', in_stock:1, description:'Древесный шлейф с сандалом.', volume:'50 мл', image:'67.jpg' },
    { name:'Парфюм ADELEIDE Rose Éternelle', category:'fragrances', collection:'fragrances', price:2600, skin_type:'all', in_stock:1, description:'Вечная роза в сердце аромата.', volume:'50 мл', image:'68.jpg' },
    { name:'Парфюм ADELEIDE Océan Frais', category:'fragrances', collection:'fragrances', price:2400, skin_type:'all', in_stock:1, description:'Свежесть океанского бриза.', volume:'50 мл', image:'69.jpg' },
    { name:'Парфюм ADELEIDE Ambre Nuit', category:'fragrances', collection:'fragrances', price:3500, skin_type:'all', in_stock:1, description:'Тёплый вечерний аромат с амброй.', volume:'50 мл', image:'70.jpg' },
    { name:'Парфюм ADELEIDE Jardin Secret', category:'fragrances', collection:'fragrances', price:2900, skin_type:'all', in_stock:0, description:'Тайный сад с зелёными нотами.', volume:'50 мл', image:'71.jpg' },
    { name:'Парфюм ADELEIDE Vanille Céleste', category:'fragrances', collection:'fragrances', price:2700, skin_type:'all', in_stock:1, description:'Небесная ваниль и мускус.', volume:'50 мл', image:'72.jpg' },
    { name:'Парфюм ADELEIDE Cuir Velours', category:'fragrances', collection:'fragrances', price:3100, skin_type:'all', in_stock:1, description:'Бархатистая кожа и специи.', volume:'50 мл', image:'73.jpg' },
    { name:'Солнцезащитный крем SPF 50', category:'sun-protection', collection:'sun-protection', price:950, skin_type:'all', in_stock:1, description:'Максимальная защита лица.', volume:'50 мл', image:'74.jpg' },
    { name:'Солнцезащитный стик SPF 30', category:'sun-protection', collection:'sun-protection', price:680, skin_type:'all', in_stock:1, description:'Удобный формат для точечной защиты.', volume:'15 г', image:'75.jpg' },
    { name:'Солнцезащитный спрей SPF 25', category:'sun-protection', collection:'sun-protection', price:780, skin_type:'all', in_stock:1, description:'Лёгкое распыление для тела.', volume:'150 мл', image:'76.jpg' },
    { name:'Крем после загара с алоэ', category:'sun-protection', collection:'sun-protection', price:620, skin_type:'all', in_stock:1, description:'Успокоение после солнца.', volume:'180 мл', image:'77.jpg' },
    { name:'Солнцезащитный флюид SPF 40', category:'sun-protection', collection:'sun-protection', price:1050, skin_type:'oily', in_stock:1, description:'Невесомый флюид без жирного блеска.', volume:'40 мл', image:'78.jpg' },
    { name:'Бальзам для губ SPF 20', category:'sun-protection', collection:'sun-protection', price:290, skin_type:'all', in_stock:1, description:'Защита нежной кожи губ.', volume:'10 мл', image:'79.jpg' },
    { name:'Набор «Золотой уход» — крем + сыворотка', category:'sets', collection:'golden', price:1900, skin_type:'all', in_stock:1, description:'Дневной крем и гиалуроновая сыворотка.', volume:'2 шт.', image:'80.jpg' },
    { name:'Набор «Для проблемной кожи»', category:'sets', collection:'problem-skin', price:1650, skin_type:'oily', in_stock:1, description:'Гель + тоник + сыворотка с салициловой кислотой.', volume:'3 шт.', image:'81.jpg' },
    { name:'Набор «Солнечная защита»', category:'sets', collection:'sun-protection', price:1500, skin_type:'all', in_stock:1, description:'Крем SPF 30 + бальзам SPF 20.', volume:'2 шт.', image:'82.jpg' },
    { name:'Набор «Увлажнение с мочевиной»', category:'sets', collection:'urea-series', price:1200, skin_type:'dry', in_stock:1, description:'Крем для тела + крем для рук с мочевиной.', volume:'2 шт.', image:'83.jpg' },
    { name:'Подарочный набор «Ароматы ADELEIDE»', category:'sets', collection:'fragrances', price:4500, skin_type:'all', in_stock:1, description:'Миниатюры 3 ароматов в подарочной упаковке.', volume:'3×10 мл', image:'84.jpg' }
  ];

  const insert = db.prepare('INSERT INTO products (name, category, collection, price, skin_type, in_stock, description, volume, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertAll = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.name, item.category, item.collection, item.price, item.skin_type, item.in_stock, item.description, item.volume, item.image);
    }
  });
  insertAll(products);
  console.log(`✅ Добавлено ${products.length} товаров`);
}

module.exports = { db, initializeDatabase, seedProducts };