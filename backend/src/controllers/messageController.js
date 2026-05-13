const db = require('../config/database');

const getMessages = (req, res) => {
    const user_id = req.userId; // Kendisine gelen mesajlar
    const query = `
        SELECT m.*, u.username as gonderen_adi 
        FROM mesajlar m
        JOIN users u ON m.gonderen_id = u.id
        WHERE m.alici_id = ?
        ORDER BY m.id DESC
    `;
    db.all(query, [user_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Mesajlar getirilemedi.' });
        res.json(rows);
    });
};

const sendMessage = (req, res) => {
    const gonderen_id = req.userId;
    const { alici_id, mesaj } = req.body;

    if (!alici_id || !mesaj) return res.status(400).json({ message: 'Alıcı ve mesaj içeriği zorunludur.' });

    const query = `INSERT INTO mesajlar (gonderen_id, alici_id, mesaj) VALUES (?, ?, ?)`;
    db.run(query, [gonderen_id, alici_id, mesaj], function(err) {
        if (err) return res.status(500).json({ message: 'Mesaj gönderilemedi.', error: err.message });
        res.status(201).json({ message: 'Mesaj başarıyla gönderildi.' });
    });
};

module.exports = { getMessages, sendMessage };
