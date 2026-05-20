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

const addBatchAttendance = (req, res) => {
    const { records, tarih } = req.body; // records: [{ogrenci_id, durum}]
    
    if (!records || !Array.isArray(records) || !tarih) {
        return res.status(400).json({ message: 'Eksik bilgi: tarih veya records.' });
    }

    const query = `INSERT INTO devamsizliklar (ogrenci_id, tarih, durum) VALUES (?, ?, ?)`;
    
    let errorOccurred = false;
    let completed = 0;
    
    records.forEach(rec => {
        db.run(query, [rec.ogrenci_id, tarih, rec.durum], (err) => {
            if (err) errorOccurred = true;
            completed++;
            if (completed === records.length) {
                if (errorOccurred) {
                    res.status(500).json({ message: 'Bazı kayıtlar eklenirken hata oluştu.' });
                } else {
                    res.status(201).json({ message: 'Toplu yoklama başarıyla kaydedildi.' });
                }
            }
        });
    });
    
    if (records.length === 0) {
        res.status(400).json({ message: 'Kayıt bulunamadı.' });
    }
};

module.exports = {
    getAttendanceByStudent,
    addAttendance,
    addBatchAttendance
};
