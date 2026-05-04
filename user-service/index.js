//dikerjakan oleh: Herfiani Fantastika Salma (102062400140)

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT             = 3001;
const ORDER_SERVICE_URL = 'http://localhost:3003';

// ============================================================
// STATIC DATA — simulasi database
// ============================================================
const users = [
  { id: 1, name: 'Budi Santoso', email: 'budi@mail.com',  phone: '081234567890', address: 'Jl. Merdeka No.1, Bandung' },
  { id: 2, name: 'Siti Rahayu',  email: 'siti@mail.com',  phone: '082345678901', address: 'Jl. Sudirman No.2, Jakarta' },
  { id: 3, name: 'Andi Wijaya',  email: 'andi@mail.com',  phone: '083456789012', address: 'Jl. Gatot Subroto No.3, Surabaya' },
  { id: 4, name: 'Dewi Lestari', email: 'dewi@mail.com',  phone: '084567890123', address: 'Jl. Diponegoro No.4, Yogyakarta' },
];

// ============================================================
// PROVIDER — UserService menyediakan data user
// ============================================================

// GET /users — ambil semua user
app.get('/users', (req, res) => {
  res.json({
    status : 'success',
    service: 'UserService',
    data   : users
  });
});

// GET /users/:id — ambil user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({
      status : 'error',
      service: 'UserService',
      message: `User dengan ID ${req.params.id} tidak ditemukan`
    });
  }
  res.json({
    status : 'success',
    service: 'UserService',
    data   : user
  });
});

// ============================================================
// CONSUMER — UserService mengambil order history dari OrderService
// ============================================================

// GET /users/:id/orders — ambil history order milik user tertentu
app.get('/users/:id/orders', async (req, res) => {
  const userId = parseInt(req.params.id);
  const user   = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      status : 'error',
      service: 'UserService',
      message: `User dengan ID ${userId} tidak ditemukan`
    });
  }

  try {
    // Consume OrderService — minta data order berdasarkan user_id
    const response = await axios.get(`${ORDER_SERVICE_URL}/orders?user_id=${userId}`);

    res.json({
      status        : 'success',
      service       : 'UserService',
      consumed_from : 'OrderService (localhost:3003)',
      user          : user,
      order_history : response.data.data
    });
  } catch (error) {
    res.status(503).json({
      status : 'error',
      service: 'UserService',
      message: 'Gagal terhubung ke OrderService. Pastikan OrderService berjalan di port 3003.',
      detail : error.message
    });
  }
});

// ============================================================
app.listen(PORT, () => {
  console.log(`✅ UserService running at http://localhost:${PORT}`);
  console.log(`   Provider  : GET /users | GET /users/:id`);
  console.log(`   Consumer  : GET /users/:id/orders  →  OrderService:3003`);
});
