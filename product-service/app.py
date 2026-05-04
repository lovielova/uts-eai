#dikerjakan oleh: gevira raudatul gaidza (102062400099)

from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

PORT              = 3002
ORDER_SERVICE_URL = 'http://localhost:3003'

# ============================================================
# STATIC DATA — simulasi database
# ============================================================
products = [
    { 'id': 1, 'name': 'Laptop ASUS VivoBook',  'price': 8500000,  'stock': 15, 'category': 'Elektronik' },
    { 'id': 2, 'name': 'Mouse Logitech M235',    'price': 250000,   'stock': 50, 'category': 'Aksesori' },
    { 'id': 3, 'name': 'Keyboard Mechanical',    'price': 750000,   'stock': 30, 'category': 'Aksesori' },
    { 'id': 4, 'name': 'Monitor LG 24 inch',     'price': 3200000,  'stock': 10, 'category': 'Elektronik' },
    { 'id': 5, 'name': 'Headset Sony WH-1000XM5','price': 4500000,  'stock': 8,  'category': 'Audio' },
]

# ============================================================
# PROVIDER — ProductService menyediakan data produk
# ============================================================

# GET /products — ambil semua produk
@app.route('/products', methods=['GET'])
def get_all_products():
    return jsonify({
        'status' : 'success',
        'service': 'ProductService',
        'data'   : products
    })

# GET /products/<id> — ambil produk by ID
@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({
            'status' : 'error',
            'service': 'ProductService',
            'message': f'Produk dengan ID {product_id} tidak ditemukan'
        }), 404
    return jsonify({
        'status' : 'success',
        'service': 'ProductService',
        'data'   : product
    })

# ============================================================
# CONSUMER — ProductService mengambil data penjualan dari OrderService
# ============================================================

# GET /products/<id>/sales — cek berapa kali produk ini dipesan
@app.route('/products/<int:product_id>/sales', methods=['GET'])
def get_product_sales(product_id):
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({
            'status' : 'error',
            'service': 'ProductService',
            'message': f'Produk dengan ID {product_id} tidak ditemukan'
        }), 404

    try:
        # Consume OrderService — minta order yang mengandung product_id ini
        response = requests.get(f'{ORDER_SERVICE_URL}/orders?product_id={product_id}')
        orders   = response.json().get('data', [])

        total_sold = sum(
            item['quantity']
            for order in orders
            for item in order.get('items', [])
            if item['product_id'] == product_id
        )

        return jsonify({
            'status'       : 'success',
            'service'      : 'ProductService',
            'consumed_from': 'OrderService (localhost:3003)',
            'product'      : product,
            'total_orders' : len(orders),
            'total_sold'   : total_sold
        })
    except Exception as e:
        return jsonify({
            'status' : 'error',
            'service': 'ProductService',
            'message': 'Gagal terhubung ke OrderService. Pastikan OrderService berjalan di port 3003.',
            'detail' : str(e)
        }), 503

# ============================================================
if __name__ == '__main__':
    print(f'✅ ProductService running at http://localhost:{PORT}')
    print(f'   Provider : GET /products | GET /products/<id>')
    print(f'   Consumer : GET /products/<id>/sales  →  OrderService:3003')
    app.run(port=PORT, debug=True)
