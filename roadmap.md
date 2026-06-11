# แผนการดำเนินงาน (Project Roadmap) - StoreMesh Assignment

ไฟล์นี้แสดงขั้นตอนการพัฒนาระบบ StoreMesh (Django + React + PostgreSQL + Docker) โดยแบ่งเป็นเฟสต่าง ๆ ขณะนี้ดำเนินการเสร็จสิ้นในส่วนของ **Phase 1** แล้ว

---

## 📋 ตารางสถานะการทำงาน (Tasks Checklist)

### 🟢 Phase 1: การตั้งค่าโครงสร้างโครงการและฐานข้อมูล (Project & Database Setup) — [เสร็จสิ้น]
- [x] ติดตั้งและกำหนดโครงสร้างโฟลเดอร์โครงการ (Backend Django, Frontend React/Vite)
- [x] เขียนไฟล์ `docker-compose.yml` เพื่อจัดการ Container สำหรับ:
  - Database (PostgreSQL)
  - Backend (Django)
  - Frontend (React)
- [x] ปรับปรุงไฟล์ [Dockerfile](file:///c:/Users/gluee/storemesh-assignment/backend/Dockerfile) ของ Django และ [Dockerfile](file:///c:/Users/gluee/storemesh-assignment/frontend/Dockerfile) ของ React ให้ทำงานร่วมกันได้อย่างถูกต้อง
- [x] ติดตั้งไลบรารีที่จำเป็นผ่าน `requirements.txt` (Django, DRF, JWT, CORS, Psycopg2)
- [x] กำหนดค่าไฟล์ [settings.py](file:///c:/Users/gluee/storemesh-assignment/backend/storemesh_api/settings.py):
  - ลงทะเบียนแอป (`rest_framework`, `rest_framework_simplejwt`, `corsheaders`, `shop`)
  - ตั้งค่า CorsMiddleware
  - ตั้งค่า CORS_ALLOWED_ORIGINS สำหรับ React
  - เชื่อมต่อฐานข้อมูลหลักเข้ากับ PostgreSQL ใน Docker
- [x] สร้างแอป `shop` ใน Django (`python manage.py startapp shop`)
- [x] สร้างไฟล์ [.gitignore](file:///c:/Users/gluee/storemesh-assignment/.gitignore) ที่คลอบคลุมทั้งโปรเจกต์ (Root, Backend, Frontend)

---

### 🟢 Phase 2: พัฒนาฐานข้อมูลและ API (Database Models & REST API Development) — [เสร็จสิ้น]
- [x] ออกแบบฐานข้อมูล (Database Schema) ใน [models.py](file:///c:/Users/gluee/storemesh-assignment/backend/shop/models.py) สำหรับ User (แยก Role), Product, Cart, CartItem, Order, และ OrderItem
- [x] ทำการสร้างและรัน Migrations (`makemigrations` & `migrate`) เพื่อสร้างตารางใน PostgreSQL เรียบร้อยแล้ว
- [x] สร้าง API Serializers และ ViewSets ด้วย Django REST Framework (DRF) ใน [serializers.py](file:///c:/Users/gluee/storemesh-assignment/backend/shop/serializers.py) และ [views.py](file:///c:/Users/gluee/storemesh-assignment/backend/shop/views.py)
- [x] กำหนด Route/Endpoints ของ API ใน [urls.py](file:///c:/Users/gluee/storemesh-assignment/backend/shop/urls.py) และ [urls.py](file:///c:/Users/gluee/storemesh-assignment/backend/storemesh_api/urls.py)
  - `/api/products/` (ดึงและจัดการรายการสินค้า)
  - `/api/orders/` (สร้างและดูรายการสั่งซื้อ)
  - `/api/cart/` (จัดการระบบตะกร้าสินค้าของผู้ซื้อ)
- [x] ตั้งค่าการตรวจสอบสิทธิ์ความปลอดภัย (Authentication & Authorization) ด้วย SimpleJWT (`/api/token/`)
- [x] สร้างไฟล์ Seed data สำหรับนำเข้าข้อมูลสินค้าทดสอบลงในฐานข้อมูล [seed_db.py](file:///c:/Users/gluee/storemesh-assignment/backend/shop/management/commands/seed_db.py) เรียบร้อยแล้ว

---

### 🟢 Phase 3: พัฒนาส่วนหน้าบ้านและการเชื่อมต่อ API (UI Design & Frontend Integration) — [เสร็จสิ้น]
- [x] ออกแบบหน้าตาเว็บ (UI/UX) ให้ทันสมัย สวยงาม และ Responsive (ใช้ HSL tailored dark theme & Glassmorphism)
- [x] พัฒนาคอมโพเนนต์หลักฝั่ง React ใน [App.tsx](file:///c:/Users/gluee/storemesh-assignment/frontend/src/App.tsx):
  - [x] หน้าแสดงรายการสินค้า (Product Catalog) พร้อมระบบกรองช่วงราคาและค้นหา
  - [x] หน้าแสดงรายละเอียดสินค้า (Product Detail Modal)
  - [x] ระบบตะกร้าสินค้า (Shopping Cart) ซิงค์ข้อมูลกับ Backend แบบ real-time
  - [x] หน้าเข้าสู่ระบบ/สมัครสมาชิก (Login / Register Card) พร้อมเลือกระหว่างบทบาท BUYER และ SELLER
- [x] จัดการ State ของระบบตะกร้าสินค้าและการเก็บ JWT Token ของผู้ใช้ใน LocalStorage
- [x] เชื่อมต่อ API ฝั่ง React เข้ากับ Django Backend โดยใช้ Fetch client (รองรับ Token injection และ Auto-logout)

---

### 🟢 Phase 4: การทดสอบ ระบบ Docker และการจัดทำเอกสาร (Testing, Docker Optimization & Docs) — [เสร็จสิ้น]
- [x] ทดสอบความถูกต้องของ API (Backend Unit Tests) (พัฒนา 19 Unit Tests ครอบคลุม Auth, Product, Cart, Orders)
- [x] ทดสอบความถูกต้องของ UI (Frontend Integration Tests) (ตรวจสอบผ่านการทำ production build และทดสอบรันหน้าเว็บใน Docker)
- [x] ตรวจสอบความสมบูรณ์และทดสอบการรันระบบทั้งหมดผ่าน `docker-compose up --build`
- [x] เขียนคู่มือการติดตั้งและการรันระบบใน [README.md](file:///c:/Users/gluee/storemesh-assignment/README.md) ของโปรเจกต์

