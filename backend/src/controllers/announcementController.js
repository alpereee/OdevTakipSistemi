const db = require('../config/database');

const getAnnouncements = (req, res) => {
    const query = `
        SELECT d.*, u.username as yayinlayan_adi 
        FROM duyurular d
        JOIN users u ON d.yayinlayan_id = u.id
        ORDER BY d.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Duyurular getirilemedi.', error: err.message });
        res.json(rows);
    });
};

const createAnnouncement = (req, res) => {
    const { baslik, icerik } = req.body;
    const yayinlayan_id = req.userId; // Token'dan gelir

    if (!baslik || !icerik) return res.status(400).json({ message: 'Başlık ve içerik gereklidir.' });

    const query = `INSERT INTO duyurular (baslik, icerik, yayinlayan_id) VALUES (?, ?, ?)`;
    db.run(query, [baslik, icerik, yayinlayan_id], function(err) {
        if (err) return res.status(500).json({ message: 'Duyuru oluşturulamadı.', error: err.message });
        res.status(201).json({ message: 'Duyuru başarıyla yayınlandı.', id: this.lastID });
    });
};

const deleteAnnouncement = (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM duyurular WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ message: 'Duyuru silinemedi.' });
        res.json({ message: 'Duyuru silindi.' });
    });
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
