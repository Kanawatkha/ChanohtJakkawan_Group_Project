const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// 1. บอก Server ว่าไฟล์ Frontend (HTML, CSS, JS, Images) อยู่ที่โฟลเดอร์ 'public'
// path.join(__dirname, '../public') คือการถอยกลับไป 1 ขั้นจาก src แล้วเข้า public
app.use(express.static(path.join(__dirname, '../public')));

// 2. Route หลัก: เมื่อเข้าเว็บ (/) ให้ส่งไฟล์ index.html ไปแสดงผล
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 3. เริ่มรัน Server
app.listen(port, () => {
    console.log(`-----------------------------------------------`);
    console.log(`🚀 Server is running!`);
    console.log(`🌍 Open your browser at: http://localhost:${port}`);
    console.log(`-----------------------------------------------`);
});