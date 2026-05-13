const db = require('../config/database');

const getSchools = (req, res) => {
    db.all(`SELECT * FROM okullar ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Okullar getirilemedi.' });
        res.json(rows);
    });
};

const createSchool = (req, res) => {
    const { ad, adres } = req.body;
    if (!ad) return res.status(400).json({ message: 'Okul adı zorunludur.' });

    db.run(`INSERT INTO okullar (ad, adres) VALUES (?, ?)`, [ad, adres], function(err) {
        if (err) return res.status(500).json({ message: 'Okul eklenemedi.' });
        res.status(201).json({ message: 'Okul eklendi.', id: this.lastID });
    });
};

module.exports = { getSchools, createSchool };
