const db = require('../config/database');

const getAllLessons = (req, res) => {
    db.all('SELECT * FROM dersler', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Dersler getirilirken hata oluştu', error: err.message });
        }
        res.json(rows);
    });
};

const createLesson = (req, res) => {
    const { ad } = req.body;
    if (!ad) {
        return res.status(400).json({ message: 'Ders adı zorunludur.' });
    }

    db.run('INSERT INTO dersler (ad) VALUES (?)', [ad], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Ders eklenirken hata oluştu', error: err.message });
        }
        res.status(201).json({ message: 'Ders başarıyla eklendi', id: this.lastID });
    });
};

module.exports = {
    getAllLessons,
    createLesson
};
