const db = require('../config/database');

const getAttendanceByStudent = (req, res) => {
    const { ogrenci_id } = req.params;
    db.all(`SELECT * FROM devamsizliklar WHERE ogrenci_id = ? ORDER BY tarih DESC`, [ogrenci_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Devamsızlıklar getirilemedi.' });
        res.json(rows);
    });
};

module.exports = { getAttendanceByStudent };
