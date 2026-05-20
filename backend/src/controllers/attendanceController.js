const db = require('../config/database');

const getAttendanceByStudent = (req, res) => {
    const { student_id } = req.params;
    const query = \`SELECT * FROM devamsizliklar WHERE ogrenci_id = ? ORDER BY tarih DESC\`;
    
    db.all(query, [student_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Devamsızlık kayıtları getirilemedi', error: err.message });
        }
        res.json(rows);
    });
};

const addAttendance = (req, res) => {
    const { ogrenci_id, tarih, durum } = req.body;
    
    if (!ogrenci_id || !tarih || !durum) {
        return res.status(400).json({ message: 'Lütfen öğrenci, tarih ve durum bilgilerini girin.' });
    }

    const query = \`INSERT INTO devamsizliklar (ogrenci_id, tarih, durum) VALUES (?, ?, ?)\`;
    
    db.run(query, [ogrenci_id, tarih, durum], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Devamsızlık eklenirken hata oluştu', error: err.message });
        }
        res.status(201).json({ message: 'Devamsızlık başarıyla eklendi', id: this.lastID });
    });
};

module.exports = {
    getAttendanceByStudent,
    addAttendance
};
