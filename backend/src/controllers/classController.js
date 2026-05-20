const db = require('../config/database');

const getClasses = (req, res) => {
    const ogretmen_id = req.userId;
    db.all(`SELECT * FROM siniflar WHERE ogretmen_id = ?`, [ogretmen_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Sınıflar getirilemedi.' });
        res.json(rows);
    });
};

const createClass = (req, res) => {
    const { ad } = req.body;
    const ogretmen_id = req.userId;

    if (!ad) return res.status(400).json({ message: 'Sınıf adı zorunludur.' });

    db.run(`INSERT INTO siniflar (ad, ogretmen_id) VALUES (?, ?)`, [ad, ogretmen_id], function(err) {
        if (err) return res.status(500).json({ message: 'Sınıf eklenemedi.' });
        res.status(201).json({ message: 'Sınıf eklendi.', id: this.lastID });
    });
};

module.exports = { getClasses, createClass };
