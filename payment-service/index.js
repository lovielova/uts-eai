// dikerjakan oleh: Riri Rizkiya Auliya (102062400062)
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT             = 3004;
const ORDER_SERVICE_URL = 'http://localhost:3003';

// ============================================================
// STATIC DATA — simulasi database payments
// ============================================================
let payments = [
  { id: 1, order_id: 1, amount: 8750000, method: 'transfer', status: 'success', paid_at: '2025-04-01T10:05:00Z' },
  { id: 2, order_id: 3, amount: 3200000, method: 'transfer', status: 'success', paid_at: '2025-04-03T09:35:00Z' },
];

let nextPaymentId = 3;

// ============================================================
// PROVIDER — PaymentService menyediakan data pembayaran
// ============================================================

// GET /payments — ambil semua data payment
app.get('/payments', (req, res) => {
  res.json({
    status : 'success',
    service: 'PaymentService',
    data   : payments
  });
});

// GET /payments/:id — ambil payment by ID
app.get('/payments/:id', (req, res) => {
  const payment = payments.find(p => p.id === parseInt(req.params.id));
  if (!payment) {
    return res.status(404).json({
      status : 'error',
      service: 'PaymentService',
      message: `Payment dengan ID ${req.params.id} tidak ditemukan`
    });
  }
  res.json({
    status : 'success',
    service: 'PaymentService',
    data   : payment
  });
});

// GET /payments/order/:order_id — cek status bayar suatu order
app.get('/payments/order/:order_id', (req, res) => {
  const payment = payments.find(p => p.order_id === parseInt(req.params.order_id));
  if (!payment) {
    return res.status(404).json({
      status : 'error',
      service: 'PaymentService',
      message: `Belum ada payment untuk Order ID ${req.params.order_id}`
    });
  }
  res.json({
    status : 'success',
    service: 'PaymentService',
    data   : payment
  });
});

// ============================================================
// CONSUMER — PaymentService mengambil data order dari OrderService
// untuk memvalidasi order sebelum diproses
// ============================================================

// POST /payments — proses pembayaran baru
// Body: { "order_id": 2, "amount": 750000, "method": "transfer" }
app.post('/payments', async (req, res) => {
  const { order_id, amount, method = 'transfer' } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({
      status : 'error',
      service: 'PaymentService',
      message: 'Body harus berisi order_id dan amount'
    });
  }

  try {
    // --- CONSUME OrderService: validasi order ada & belum dibayar ---
    const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/orders/${order_id}`);
    const order         = orderResponse.data.data;

    // Cek apakah sudah pernah dibayar
    const existingPayment = payments.find(p => p.order_id === order_id);
    if (existingPayment) {
      return res.status(400).json({
        status  : 'error',
        service : 'PaymentService',
        message : `Order ID ${order_id} sudah pernah dibayar`,
        existing: existingPayment
      });
    }

    // Cek amount cocok dengan total order
    if (amount !== order.total) {
      return res.status(400).json({
        status         : 'error',
        service        : 'PaymentService',
        message        : 'Jumlah pembayaran tidak sesuai dengan total order',
        expected_amount: order.total,
        received_amount: amount
      });
    }

    // Simpan payment baru
    const newPayment = {
      id      : nextPaymentId++,
      order_id: order_id,
      amount  : amount,
      method  : method,
      status  : 'success',
      paid_at : new Date().toISOString()
    };
    payments.push(newPayment);

    res.status(201).json({
      status        : 'success',
      service       : 'PaymentService',
      consumed_from : 'OrderService (localhost:3003)',
      message       : 'Pembayaran berhasil diproses',
      data          : newPayment
    });

  } catch (error) {
    // Kalau OrderService tidak ditemukan / tidak jalan, tetap proses (graceful)
    const newPayment = {
      id      : nextPaymentId++,
      order_id: order_id,
      amount  : amount,
      method  : method,
      status  : 'success',
      paid_at : new Date().toISOString()
    };
    payments.push(newPayment);

    res.status(201).json({
      status        : 'success',
      service       : 'PaymentService',
      consumed_from : 'OrderService (localhost:3003)',
      message       : 'Pembayaran diproses (OrderService tidak dapat diverifikasi)',
      data          : newPayment
    });
  }
});

// ============================================================
app.listen(PORT, () => {
  console.log(`✅ PaymentService running at http://localhost:${PORT}`);
  console.log(`   Provider : GET /payments | GET /payments/:id | GET /payments/order/:order_id`);
  console.log(`   Consumer : POST /payments  →  OrderService:3003`);
});
