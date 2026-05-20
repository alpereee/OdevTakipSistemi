const db = require('../config/database');

const getMyNotifications = (req, res) => {
    const userId = req.userId;
    const query = `SELECT * FROM bildirimler WHERE alici_id = ? ORDER BY tarih DESC`;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Bildirimler alınamadı', error: err.message });
        }
        res.json(rows);
    });
};

const markAsRead = (req, res) => {
    const userId = req.userId;
    const query = `UPDATE bildirimler SET okundu = 1 WHERE alici_id = ?`;
    
    db.run(query, [userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Bildirimler güncellenemedi', error: err.message });
        }
        res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
    });
};

module.exports = {
    getMyNotifications,
    markAsRead
};
