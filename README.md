# StoreMesh Assignment - E-commerce System

ระบบจัดการร้านค้าออนไลน์ (E-commerce) ที่พัฒนาด้วยสถาปัตยกรรมแบบแยกส่วน (Decoupled Architecture) โดยใช้ Django REST Framework เป็น Backend API, React (Vite) เป็น Frontend และใช้ PostgreSQL เป็นฐานข้อมูลหลัก ทั้งหมดรันอยู่บน Docker Container

---

## 📊 การออกแบบฐานข้อมูล (Database Design / ER Diagram)

การออกแบบฐานข้อมูลนี้คำนึงถึง **Database Integrity** และความถูกต้องตาม Business Flow ของระบบ E-commerce โดยแบ่งออกเป็น 6 ตารางหลัก ดังนี้:

### 1. โค้ดความสัมพันธ์สำหรับนำไปใช้ใน [dbdiagram.io](https://dbdiagram.io)
คุณสามารถคัดลอกโค้ด DBML ด้านล่างนี้ไปวางในกล่องข้อความฝั่งซ้ายของเว็บ dbdiagram.io เพื่อสร้างแผนภาพความสัมพันธ์ (ER Diagram) ได้โดยอัตโนมัติ:

```dbml
// Copy this code into dbdiagram.io to generate the ER Diagram

Table users {
  id int [pk, increment]
  username varchar
  email varchar
  password varchar
  role varchar [note: "'SELLER' or 'BUYER'"]
  created_at timestamp
}

Table products {
  id int [pk, increment]
  seller_id int [ref: > users.id]
  title varchar
  description text
  price decimal
  quantity int [note: "Available stock"]
  image varchar [note: "URL or File Path"]
  created_at timestamp
  updated_at timestamp
}

Table carts {
  id int [pk, increment]
  buyer_id int [ref: - users.id] // 1 Buyer has 1 active cart
  created_at timestamp
}

Table cart_items {
  id int [pk, increment]
  cart_id int [ref: > carts.id]
  product_id int [ref: > products.id]
  quantity int
}

Table orders {
  id int [pk, increment]
  buyer_id int [ref: > users.id]
  total_price decimal
  status varchar [note: "e.g., 'COMPLETED'"]
  created_at timestamp
}

Table order_items {
  id int [pk, increment]
  order_id int [ref: > orders.id]
  product_id int [ref: > products.id]
  quantity int
  unit_price decimal [note: "Snapshotted price at purchase"]
}
```

---

### 2. คำอธิบายโครงสร้างฐานข้อมูลและความสัมพันธ์

#### 👤 ระบบผู้ใช้งานและสินค้า (Authentication & Product Listing)
* **`users` (ข้อมูลผู้ใช้งาน)**
  * เก็บข้อมูลพื้นฐาน ได้แก่ Username, Email, Password
  * มีฟิลด์ `role` เพื่อแยกประเภทผู้ใช้ระหว่าง **`SELLER`** (ผู้ขาย) และ **`BUYER`** (ผู้ซื้อ)
* **`products` (ข้อมูลสินค้า)**
  * เก็บชื่อสินค้า, รายละเอียด, ราคา, รูปภาพ และจำนวนสินค้าที่มีอยู่ในคลัง (`quantity`)
  * มีความสัมพันธ์แบบ **One-to-Many** กับตาราง `users` (`seller_id` -> `users.id`) เนื่องจากผู้ขาย (Seller) หนึ่งคนสามารถลงขายสินค้าได้หลายชิ้น

#### 🛒 ระบบตะกร้าสินค้า (Cart Management)
* **`carts` (ตะกร้าพักสินค้า)**
  * เป็นตะกร้าสำหรับผู้ซื้อในการเลือกหยิบสินค้า
  * มีความสัมพันธ์แบบ **One-to-One** กับตาราง `users` (`buyer_id` -> `users.id`) ซึ่งหมายความว่าผู้ซื้อ 1 คน จะมีตะกร้าสินค้าที่กำลังใช้งานอยู่ได้สูงสุดเพียง 1 ตะกร้าในเวลาเดียวกัน
* **`cart_items` (รายการสินค้าในตะกร้า)**
  * เก็บรายละเอียดว่าในตะกร้านั้น ๆ มีสินค้าชิ้นไหนบ้าง (`product_id`) และมีจำนวนเท่าใด (`quantity`)
  * เชื่อมโยงกับตาราง `carts` (ความสัมพันธ์แบบ Many-to-One) และตาราง `products` (ความสัมพันธ์แบบ Many-to-One)

#### 📦 ระบบสั่งซื้อและตัดสต็อก (Order & Inventory Management)
* **`orders` (คำสั่งซื้อหลัก)**
  * บันทึกหลังจากผู้ซื้อกดยืนยันการสั่งซื้อ (Checkout)
  * เก็บข้อมูลผู้ซื้อ (`buyer_id`), ราคารวมของคำสั่งซื้อ (`total_price`), สถานะการสั่งซื้อ (`status` เช่น `PENDING`, `COMPLETED`), และเวลาที่สั่งซื้อ
* **`order_items` (รายการสินค้าในคำสั่งซื้อ)**
  * **จุดสำคัญเพื่อป้องกันข้อมูลเพี้ยน (Snapshot Price):** ตารางนี้เก็บ `unit_price` ณ ขณะสั่งซื้อ เพื่อบันทึกราคาประวัติสินค้าไว้ หากในอนาคตผู้ขายมีการแก้ไขราคาสินค้า ยอดรวมและบิลการสั่งซื้อย้อนหลังจะยังคงมีราคาตรงตามที่จ่ายจริง
  * เชื่อมโยงกับตาราง `orders` และ `products` เพื่อระบุว่าในคำสั่งซื้อนั้นประกอบด้วยสินค้าชิ้นไหน จำนวนเท่าใด

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

* **Backend:** Django REST Framework (Python 3.10)
* **Frontend:** React + TypeScript + Vite (Tailwind CSS v4 & shadcn/ui)
* **Database:** PostgreSQL (v15)
* **Containerization:** Docker & Docker Compose

---

## 🚀 วิธีการติดตั้งและรันระบบ (Setup & Running the Project)

### 1. การเตรียมระบบและเริ่มทำงานผ่าน Docker
รันคำสั่งด้านล่างนี้เพื่อสร้างอิมเมจและรันเซิร์ฟเวอร์ทุกตู้อัตโนมัติ (Database, Backend, Frontend):
```bash
docker-compose up --build
```
ระบบจะเปิดพอร์ตการใช้งานดังนี้:
* **Frontend:** [http://localhost:5173](http://localhost:5173) (หน้าตาเว็บ React App)
* **Backend:** [http://localhost:8000](http://localhost:8000) (หน้า Django REST Framework API)
* **Database:** `localhost:5432` (PostgreSQL)

---

### 2. การสร้างตารางและการนำเข้าข้อมูลทดสอบ (Migration & Seeding Database)
เมื่อตู้คอนเทนเนอร์ทำงานแล้ว ให้ทำตามขั้นตอนดังนี้เพื่อทำตารางฐานข้อมูลและใส่ข้อมูลเริ่มต้น:

1. **รัน Migration ของ Django:**
```bash
docker-compose exec backend python manage.py migrate
```

2. **รันคำสั่ง Seed Data เพื่อใส่ผู้ใช้งานและรายการสินค้าเริ่มต้น:**
```bash
docker-compose exec backend python manage.py seed_db
```

---

### 3. บัญชีผู้ใช้สำหรับทดสอบระบบ (Test Accounts)
หลังรันคำสั่ง Seed แล้ว สามารถเข้าระบบเพื่อทดสอบสิทธิ์การใช้งานผ่านหน้าเว็บได้ทันทีด้วยบัญชีดังนี้:

| Username | Password | Role | รายละเอียดสิทธิ์ |
|---|---|---|---|
| `buyer1` | `password123` | `BUYER` (ผู้ซื้อ) | สามารถเลือกซื้อสินค้า, เพิ่มสินค้าลงตะกร้า, อัปเดตตะกร้า และสร้างใบสั่งซื้อได้ |
| `seller1` | `password123` | `SELLER` (ผู้ขาย) | สามารถเพิ่ม ลบ และอัปเดตรายละเอียดสินค้าของตนเอง และดูประวัติรายการสั่งซื้อที่มีสินค้าของตนเองได้ |
| `seller2` | `password123` | `SELLER` (ผู้ขาย) | สามารถแก้ไขข้อมูลสินค้าของตนเอง (ไม่สามารถแก้ไขสินค้าของ `seller1` ได้) |

---

### 🧪 การรันแบบทดสอบ (Running Tests)

**1. รัน Unit Tests ในฝั่ง Django API (มีทั้งหมด 19 เคสเพื่อเช็กความถูกต้อง):**
```bash
docker-compose exec backend python manage.py test
```

**2. ตรวจสอบการรัน Build ในฝั่ง React Frontend:**
```bash
docker-compose exec frontend npm run build
```

