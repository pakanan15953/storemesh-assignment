# StoreMesh Assignment - E-commerce System

ระบบ Storefront Management System พัฒนาด้วยสถาปัตยกรรมแบบแยกส่วน (Decoupled Architecture) โดยแบ่งออกเป็น Django REST Framework (Backend API), React with TypeScript (Frontend) และใช้ PostgreSQL เป็นฐานข้อมูลหลัก ทั้งหมดควบคุมการทำงานด้วย Docker Container

---

## Database Design

การออกแบบ Database Schema นี้เน้นเรื่อง Database Integrity และการไหลของข้อมูลให้ถูกต้องตามระบบ E-commerce โดยแบ่งตารางหลักออกเป็น 6 ตาราง:

### ER Diagram
![ER Diagram](./ER%20Diagram.png)

### DBML (Database Markup Language) for dbdiagram.io
คัดลอกโค้ด DBML ด้านล่างไปใช้ใน [dbdiagram.io](https://dbdiagram.io) เพื่อดู ER Diagram แบบ Interactive ได้:

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

### Database Schema Explanation

#### 👤 ระบบผู้ใช้งานและสินค้า (Authentication & Product Listing)
* **`users` (ข้อมูลผู้ใช้งาน)**
  * เก็บข้อมูลพื้นฐาน ได้แก่ Username, Email, Password
  * มีฟิลด์ `role` เพื่อแยกสิทธิ์การใช้งานระหว่าง **`SELLER`** (ผู้ขาย) และ **`BUYER`** (ผู้ซื้อ)
* **`products` (ข้อมูลสินค้า)**
  * เก็บชื่อสินค้า, รายละเอียด, ราคา, รูปภาพ และจำนวนสินค้าที่มีอยู่ในคลัง (`quantity`)
  * มีความสัมพันธ์แบบ **One-to-Many** กับตาราง `users` (`seller_id` -> `users.id`) เนื่องจากผู้ขาย (Seller) หนึ่งคนสามารถลงขายสินค้าได้หลายชิ้น

#### 🛒 ระบบตะกร้าสินค้า (Cart Management)
* **`carts` (ตะกร้าพักสินค้า)**
  * ตะกร้าสำหรับผู้ซื้อในการเลือกหยิบสินค้า
  * มีความสัมพันธ์แบบ **One-to-One** กับตาราง `users` (`buyer_id` -> `users.id`) เพื่อบังคับให้ผู้ซื้อ 1 คนมีตะกร้าสินค้าที่กำลังใช้งานอยู่ได้สูงสุดเพียง 1 ตะกร้า ณ เวลาเดียวกัน
* **`cart_items` (รายการสินค้าในตะกร้า)**
  * เก็บรายละเอียดว่าในตะกร้านั้น ๆ มีสินค้าชิ้นไหนบ้าง (`product_id`) และมีจำนวนเท่าใด (`quantity`)
  * เชื่อมโยงกับตาราง `carts` (Many-to-One) และตาราง `products` (Many-to-One)

#### 📦 ระบบสั่งซื้อและตัดสต็อก (Order & Inventory Management)
* **`orders` (คำสั่งซื้อหลัก)**
  * บันทึกข้อมูลหลังจากผู้ซื้อทำการยืนยันสั่งซื้อสินค้า (Checkout)
  * เก็บข้อมูลผู้ซื้อ (`buyer_id`), ราคารวมของคำสั่งซื้อ (`total_price`), สถานะคำสั่งซื้อ (`status` เช่น `PENDING`, `COMPLETED`), และเวลาที่ทำรายการ
* **`order_items` (รายการสินค้าในคำสั่งซื้อ)**
  * **Snapshot Price (`unit_price`):** เก็บราคา ณ วันที่สั่งซื้อจริง เพื่อป้องกันปัญหาประวัติยอดรวมออเดอร์เพี้ยน หากผู้ขายมีการแก้ไขราคาสินค้าในภายหลัง
  * เชื่อมโยงกับตาราง `orders` และ `products` เพื่อระบุรายละเอียดของสินค้าในออเดอร์นั้นๆ

---

## Tech Stack

* **Backend:** Django REST Framework (Python 3.10)
* **Frontend:** React + TypeScript + Vite (Tailwind CSS v4 & shadcn/ui)
* **Database:** PostgreSQL (v15)
* **Containerization:** Docker & Docker Compose

---

## Setup & Installation

### Prerequisites
* ติดตั้ง **Docker Desktop** ในเครื่องคอมพิวเตอร์ของคุณให้เรียบร้อย
* **สำคัญ:** ตรวจสอบให้มั่นใจว่าโปรแกรม **Docker Desktop** เปิดทำงานอยู่ก่อนเริ่มรันคำสั่งด้านล่าง
* คัดลอกไฟล์ **.env.example** เป็น **.env** ที่ระดับนอกสุดของโปรเจกต์ เพื่อตั้งค่ารหัสผ่านฐานข้อมูลและตัวแปรต่างๆ

### 1. Run Services with Docker Compose
รันคำสั่งด้านล่างนี้เพื่อดาวน์โหลด อิมเมจ และเริ่มทำงานเซิร์ฟเวอร์ทั้งหมด (Database, Backend, Frontend):
```bash
docker-compose up --build
```
ระบบจะเปิดพอร์ตการใช้งานดังนี้:
* **Frontend:** [http://localhost:5173](http://localhost:5173) (หน้าเว็บ React App)
* **Backend:** [http://localhost:8000](http://localhost:8000) (หน้า Django REST Framework API)
* **API Documentation (Swagger UI):** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) (คู่มืออธิบายและทดลองเรียกใช้ API ทั้งหมด)
* **Database:** `localhost:5432` (PostgreSQL)

#### Connection via GUI Client (DBeaver, Navicat, pgAdmin)
เชื่อมต่อเข้าสู่ PostgreSQL Container ผ่าน Database GUI Tool ด้วยค่าคอนฟิกดังนี้:
* **Connection Type / DBMS:** `PostgreSQL`
* **Host / IP Address:** `localhost` (หรือ `127.0.0.1`)
* **Port:** `5432`
* **Database Name:** `storemesh_db`
* **Username / Role:** `admin`
* **Password:** `password`

---

### 2. Database Migrations & Seeding
> [!NOTE]
> **ระบบจัดการอัตโนมัติ:** ขั้นตอนนี้ได้รับการตั้งค่าให้รันโดยอัตโนมัติทันทีที่สั่ง `docker compose up` เรียบร้อยแล้ว (ระบบจะ migrate และ seed ข้อมูลเริ่มต้นให้เองทันที) หากท่านต้องการรันคำสั่งจัดการฐานข้อมูลแบบแมนนวลในภายหลัง สามารถใช้คำสั่งตามด้านล่างนี้ได้:

1. **รัน Migration ของ Django:**
```bash
docker-compose exec backend python manage.py migrate
```

2. **นำเข้าข้อมูลทดสอบและผู้ใช้งานเริ่มต้น (Seed Database):**
```bash
docker-compose exec backend python manage.py seed_db
```

---

### 3. Test Accounts
หลังรันคำสั่ง Seed เรียบร้อยแล้ว สามารถเข้าระบบผ่านหน้าเว็บด้วยบัญชีทดสอบดังนี้:

| Username | Password | Role | รายละเอียดสิทธิ์ |
|---|---|---|---|
| `buyer1` | `password123` | `BUYER` | ค้นหา/กรองสินค้า, จัดการตะกร้าสินค้า และสร้างคำสั่งซื้อ (Checkout) |
| `seller1` | `password123` | `SELLER` | เพิ่ม แก้ไข ลบสินค้าของตนเอง และดูรายการออเดอร์ของสินค้าตนเอง |
| `seller2` | `password123` | `SELLER` | จัดการสินค้าของตนเอง (ไม่สามารถแก้ไขสินค้าของ `seller1` ได้) |

---

### Running Tests

**1. รัน Unit Tests ในฝั่ง Django API (มีทั้งหมด 23 เคสเพื่อตรวจเช็กความถูกต้อง):**
```bash
docker-compose exec backend python manage.py test
```

**2. ตรวจสอบการรัน Build ในฝั่ง React Frontend:**
```bash
docker-compose exec frontend npm run build
```

---

## Git Branching Strategy
โปรเจกต์นี้เลือกใช้รูปแบบการแบ่งกิ่ง Git แบบ **Feature Branching** เพื่อความเป็นระเบียบและความปลอดภัยในการผสานรวมโค้ด:
* **`main` / `master`**: กิ่งหลักที่เก็บโค้ดรุ่นที่เสถียรที่สุด (Production-ready) ที่ได้รับการทดสอบและรันผ่าน CI Pipeline เรียบร้อยแล้ว
* **`develop`**: กิ่งรวบรวมฟีเจอร์และอัปเดตต่างๆ ก่อนที่จะทดสอบขั้นสุดท้ายเพื่อรวมเข้าสู่กิ่งหลัก
* **`feature/*`**: กิ่งที่แตกแขนงออกไปสำหรับพัฒนาฟีเจอร์ย่อย (เช่น `feature/auth`, `feature/cart`, `feature/ci-cd`) เมื่อฟีเจอร์เสร็จสมบูรณ์และผ่านการทำ Unit Test จะทำการสร้าง Pull Request เพื่อตรวจเช็กคุณภาพก่อนรวมเข้าสู่กิ่งหลัก
