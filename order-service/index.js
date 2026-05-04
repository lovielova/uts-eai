//dikerjakan oleh: dealova cheilgie alea (102062430001)

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT               = 3003;
const USER_SERVICE_URL    = 'http://localhost:3001';
const PRODUCT_SERVICE_URL = 'http://localhost:3002';
const PAYMENT_SERVICE_URL = 'http://localhost:3004';

// ============================================================
// STATIC DATA — simulasi database orders
// ============================================================
let orders = [
  {
    id        : 1,
    user_id   : 1,
    status    : 'paid',
    total     : 8750000,
    created_at: '2025-04-01T10:00:00Z',
    items     : [
      { product_id: 1, name: 'Laptop ASUS VivoBook', quantity: 1, price: 8500000 },
      { product_id: 2, name: 'Mouse Logitech M235',   quantity: 1, price: 250000  },
    ]
  },
  {
    id        : 2,
    user_id   : 2,
    status    : 'pending',
    total     : 750000,
    created_at: '2025-04-02T12:00:00Z',
    items     : [
      { product_id: 3, name: 'Keyboard Mechanical', quantity: 1, price: 750000 },
    ]
  },
  {
    id        : 3,
    user_id   : 1,
    status    : 'paid',
    total     : 3200000,
    created_at: '2025-04-03T09:30:00Z',
    items     : [
      { product_id: 4, name: 'Monitor LG 24 inch', quantity: 1, price: 3200000 },
    ]
  },
];

let nextOrderId = 4;

// ============================================================
// PROVIDER — OrderService menyediakan data order
// ============================================================

// GET /orders — ambil semua order (bisa filter by user_id atau product_id)
app.get('/orders', (req, res) => {
  const { user_id, product_id } = req.query;
  let result = [...orders];

  if (user_id) {
    result = result.filter(o => o.user_id === parseInt(user_id));
  }
  if (product_id) {
    result = result.filter(o =>
      o.items.some(item => item.product_id === parseInt(product_id))
    );
  }

  res.json({
    status : 'success',
    service: 'OrderService',
    total  : result.length,
    data   : result
  });
});

// GET /orders/:id — ambil order by ID
app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({
      status : 'error',
      service: 'OrderService',
      message: `Order dengan ID ${req.params.id} tidak ditemukan`
    });
  }
  res.json({
    status : 'success',
    service: 'OrderService',
    data   : order
  });
});

// ============================================================
// CONSUMER — OrderService mengambil data dari UserService & ProductService
// lalu meneruskan ke PaymentService
// ============================================================

// POST /orders — buat order baru
// Body: { "user_id": 1, "items": [{ "product_id": 1, "quantity": 2 }] }
app.post('/orders', async (req, res) => {
  const { user_id, items } = req.body;

  if (!user_id || !items || items.length === 0) {
    return res.status(400).json({
      status : 'error',
      service: 'OrderService',
      message: 'Body harus berisi user_id dan items (array)'
    });
  }

  try {
    // --- CONSUME UserService: validasi user ada ---
    const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${user_id}`);
    const user         = userResponse.data.data;

    // --- CONSUME ProductService: validasi & ambil info tiap produk ---
    const enrichedItems = [];
    let   total         = 0;

    for (const item of items) {
      const prodResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.product_id}`);
      const product      = prodResponse.data.data;

      enrichedItems.push({
        product_id: product.id,
        name      : product.name,
        quantity  : item.quantity,
        price     : product.price
      });
      total += product.price * item.quantity;
    }

    // Simpan order baru
    const newOrder = {
      id        : nextOrderId++,
      user_id   : user.id,
      status    : 'pending',
      total     : total,
      created_at: new Date().toISOString(),
      items     : enrichedItems
    };
    orders.push(newOrder);

    // --- CONSUME PaymentService: proses pembayaran ---
    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
      order_id: newOrder.id,
      amount  : total
    });

    // Update status order sesuai hasil payment
    newOrder.status = paymentResponse.data.data.status === 'success' ? 'paid' : 'pending';

    res.status(201).json({
      status         : 'success',
      service        : 'OrderService',
      consumed_from  : ['UserService (localhost:3001)', 'ProductService (localhost:3002)', 'PaymentService (localhost:3004)'],
      order          : newOrder,
      payment_result : paymentResponse.data.data,
      user           : user
    });

  } catch (error) {
    res.status(503).json({
      status : 'error',
      service: 'OrderService',
      message: 'Gagal memproses order. Pastikan semua service berjalan.',
      detail : error.message
    });
  }
});

// ============================================================
app.listen(PORT, () => {
  console.log(`✅ OrderService running at http://localhost:${PORT}`);
  console.log(`   Provider : GET /orders | GET /orders/:id`);
  console.log(`   Consumer : POST /orders  →  UserService:3001 + ProductService:3002 + PaymentService:3004`);
});
