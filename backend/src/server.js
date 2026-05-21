require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Rotalar
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json()); // JSON istek gövdelerini parse etmek için

// Rotaları Bağlama
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// GEÇİCİ SEED ROTASI (Canlı sunucuda test verisi oluşturmak için)
app.get('/api/run-seed', async (req, res) => {
    try {
        const runSeed = require('./config/seed');
        await runSeed();
        res.json({ message: 'Veritabanı başarıyla tohumlandı!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tohumlama hatası', details: error.message });
    }
});

// Ana Dizin (Basit bir karşılama)
app.get('/', (req, res) => {
    res.json({ message: 'Ödev Takip Sistemi API iskeleti çalışıyor.' });
});

// Port Ayarı ve Sunucuyu Başlatma
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} portunda çalışıyor.`);
});
