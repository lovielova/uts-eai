# UTS Enterprise Application Integration
## E-Commerce Service Integration System

### Arsitektur Sistem

```
UserService    (Node.js)  → localhost:3001
ProductService (Python)   → localhost:3002
OrderService   (Node.js)  → localhost:3003
PaymentService (Node.js)  → localhost:3004
```

### Alur Komunikasi Antar Service

```
POST /orders (OrderService)
  ├── consume → UserService:3001/users/:id        (validasi user)
  ├── consume → ProductService:3002/products/:id  (ambil info produk)
  └── consume → PaymentService:3004/payments      (proses pembayaran)

POST /payments (PaymentService)
  └── consume → OrderService:3003/orders/:id      (validasi order)

GET /users/:id/orders (UserService)
  └── consume → OrderService:3003/orders          (history order)

GET /products/:id/sales (ProductService)
  └── consume → OrderService:3003/orders          (data penjualan)
```

---

## Cara Menjalankan

### 1. UserService (Terminal 1)
```bash
cd user-service
npm install
npm start
```

### 2. ProductService (Terminal 2)
```bash
cd product-service
pip install -r requirements.txt
python app.py
```

### 3. OrderService (Terminal 3)
```bash
cd order-service
npm install
npm start
```

### 4. PaymentService (Terminal 4)
```bash
cd payment-service
npm install
npm start
```

---

## Endpoint Summary

### UserService (port 3001)
| Method | Endpoint | Peran | Deskripsi |
|--------|----------|-------|-----------|
| GET | /users | Provider | Ambil semua user |
| GET | /users/:id | Provider | Ambil user by ID |
| GET | /users/:id/orders | Consumer | Ambil history order user (consume OrderService) |

### ProductService (port 3002)
| Method | Endpoint | Peran | Deskripsi |
|--------|----------|-------|-----------|
| GET | /products | Provider | Ambil semua produk |
| GET | /products/:id | Provider | Ambil produk by ID |
| GET | /products/:id/sales | Consumer | Cek data penjualan produk (consume OrderService) |

### OrderService (port 3003)
| Method | Endpoint | Peran | Deskripsi |
|--------|----------|-------|-----------|
| GET | /orders | Provider | Ambil semua order |
| GET | /orders/:id | Provider | Ambil order by ID |
| POST | /orders | Consumer | Buat order baru (consume UserService + ProductService + PaymentService) |

### PaymentService (port 3004)
| Method | Endpoint | Peran | Deskripsi |
|--------|----------|-------|-----------|
| GET | /payments | Provider | Ambil semua payment |
| GET | /payments/:id | Provider | Ambil payment by ID |
| GET | /payments/order/:order_id | Provider | Cek payment by order ID |
| POST | /payments | Consumer | Proses pembayaran (consume OrderService) |

---

## Contoh Request & Response

### Buat Order Baru
**POST** `http://localhost:3003/orders`
```json
{
  "user_id": 1,
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 2, "quantity": 2 }
  ]
}
```
