# ใช้ Node.js เวอร์ชัน 20 ที่มีขนาดเล็ก
FROM node:20-alpine

# ตั้งค่าโฟลเดอร์ทำงานหลักใน Container
WORKDIR /app

# คัดลอก package.json มาเพื่อติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดหน้าบ้านทั้งหมดเข้าไป
COPY . .