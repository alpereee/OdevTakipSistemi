const db = require('../config/database');

// Yeni geri bildirim ekleme
const createFeedback = (req, res) => {
    const { mesaj } = req.body;
    const veli_id = req.userId; // Middleware'den gelecek (Veli)

    if (!mesaj || mesaj.trim() === '') {
        return res.status(400).json({ message: 'Lütfen bir mesaj girin.' });
    }

    const query = `INSERT INTO geri_bildirimler (veli_id, mesaj) VALUES (?, ?)`;

    db.run(query, [veli_id, mesaj], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Geri bildirim gönderilirken hata oluştu', error: err.message });
        }
        res.status(201).json({ message: 'Geri bildiriminiz başarıyla öğretmenlere iletildi.', id: this.lastID });
    });
};

module.exports = {
    createFeedback
};
