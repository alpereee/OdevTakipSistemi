const db = require('../config/database');

const getSettings = (req, res) => {
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err) return res.status(500).json({ message: 'Ayarlar getirilemedi', error: err.message });
        res.json(row || { school_name: 'Ödev Takip Sistemi', education_term: '2025-2026', system_status: 'Aktif' });
    });
};

const updateSettings = (req, res) => {
    const { school_name, education_term, system_status } = req.body;
    const query = `UPDATE settings SET school_name = ?, education_term = ?, system_status = ? WHERE id = 1`;
    db.run(query, [school_name, education_term, system_status], function(err) {
        if (err) return res.status(500).json({ message: 'Ayarlar güncellenirken hata oluştu', error: err.message });
        res.json({ message: 'Ayarlar başarıyla güncellendi' });
    });
};

module.exports = { getSettings, updateSettings };
