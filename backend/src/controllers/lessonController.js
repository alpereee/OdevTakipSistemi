const db = require('../config/database');

const getAllLessons = (req, res) => {
    db.all('SELECT * FROM dersler', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Dersler getirilirken hata oluştu', error: err.message });
        }
        res.json(rows);
    });
};

module.exports = {
    getAllLessons
};
