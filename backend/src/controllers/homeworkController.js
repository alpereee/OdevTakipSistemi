const db = require('../config/database');

const createHomework = (req, res) => {
    console.log("[POST /api/homeworks] createHomework çalıştı. Gelen req.body:", req.body);
    const { ders_id, sinif_id, baslik, aciklama, teslim_tarihi, EstimatedDuration } = req.body;
    const ogretmen_id = req.userId; // Middleware'den gelecek

    if (!ders_id || !sinif_id || !baslik || EstimatedDuration === undefined || EstimatedDuration === null) {
        return res.status(400).json({ message: 'Lütfen ders_id, sinif_id, baslik ve EstimatedDuration alanlarını doldurun.' });
    }

    // Günlük Ödev Yükü Algoritması: Aynı sınıfa ve aynı teslim tarihine sahip ödevlerin toplam süresini bul
    const loadQuery = `SELECT SUM(EstimatedDuration) as total_duration FROM odevler WHERE sinif_id = ? AND teslim_tarihi = ?`;
    
    db.get(loadQuery, [sinif_id, teslim_tarihi], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Ödev yükü hesaplanırken hata oluştu', error: err.message });
        }

        const currentTotal = row.total_duration || 0;
        const newTotal = parseInt(currentTotal) + parseInt(EstimatedDuration);

        if (newTotal > 120) {
            return res.status(400).json({ warning: `Günlük maksimum ödev süresi aşıldı! (Mevcut: ${currentTotal} dk, Yeni Toplam: ${newTotal} dk. Max: 120 dk)` });
        }

        const query = `INSERT INTO odevler (ders_id, ogretmen_id, sinif_id, baslik, aciklama, teslim_tarihi, EstimatedDuration) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.run(query, [ders_id, ogretmen_id, sinif_id, baslik, aciklama, teslim_tarihi, EstimatedDuration], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Ödev eklenirken hata oluştu', error: err.message });
            }
            const newHomeworkId = this.lastID;
            
            // Sınıftaki öğrencilere bildirim gönder
            const notificationQuery = `INSERT INTO bildirimler (alici_id, baslik, icerik) 
                                       SELECT id, 'Yeni Ödev Eklendi', ? FROM users WHERE sinif_id = ? AND role_id = 3`;
            const notificationContent = `${baslik} başlıklı yeni bir ödeviniz var. Teslim: ${teslim_tarihi}`;
            
            db.run(notificationQuery, [notificationContent, sinif_id], (notifErr) => {
                if (notifErr) console.error("Bildirim eklenemedi:", notifErr);
            });

            res.status(201).json({ message: 'Ödev başarıyla eklendi', id: newHomeworkId });
        });
    });
};

// Sınıfa göre ödevleri listeleme
const getHomeworksByClass = (req, res) => {
    console.log("[GET /api/homeworks/class/:sinif_id] getHomeworksByClass çalıştı. Gelen req.params:", req.params);
    const { sinif_id } = req.params;

    const query = `SELECT o.*, d.ad as ders_adi, u.username as ogretmen_adi 
                   FROM odevler o 
                   JOIN dersler d ON o.ders_id = d.id 
                   JOIN users u ON o.ogretmen_id = u.id 
                   WHERE o.sinif_id = ?`;

    db.all(query, [sinif_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Ödevler getirilirken hata oluştu', error: err.message });
        }
        res.json(rows);
    });
};

// Bir ödeve ait teslimleri getir (Öğretmen için)
const getSubmissionsByHomework = (req, res) => {
    const { odev_id } = req.params;

    const query = `
        SELECT t.*, u.username as ogrenci_adi 
        FROM odev_teslimleri t
        JOIN users u ON t.ogrenci_id = u.id
        WHERE t.odev_id = ?
    `;

    db.all(query, [odev_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Teslimler getirilirken hata oluştu', error: err.message });
        }
        res.json(rows);
    });
};

// Ödev teslimini notlandır ve geri bildirim ekle (Öğretmen için)
const gradeSubmission = (req, res) => {
    const { teslim_id } = req.params;
    const { not_degeri, ogretmen_notu } = req.body;

    if (not_degeri === undefined || not_degeri === null) {
        return res.status(400).json({ message: 'Lütfen bir not değeri girin.' });
    }

    const query = `UPDATE odev_teslimleri SET not_degeri = ?, ogretmen_notu = ? WHERE id = ?`;

    db.run(query, [not_degeri, ogretmen_notu, teslim_id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Not verilirken hata oluştu.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Teslim bulunamadı.' });
        }
        res.json({ message: 'Not ve geri bildirim başarıyla kaydedildi.' });
    });
};

// Öğrencinin ödevlerini ve teslim durumlarını getir (Öğrenci ve Veli için)
const getHomeworksByStudent = (req, res) => {
    let { ogrenci_id } = req.params;
    
    // 'my' anahtar kelimesi: giriş yapan kullanıcının kendi ID'si
    if (ogrenci_id === 'my') {
        ogrenci_id = req.userId;
    } else {
        ogrenci_id = parseInt(ogrenci_id);
        if (isNaN(ogrenci_id)) {
            return res.status(400).json({ message: 'Geçersiz öğrenci ID.' });
        }
    }

    const query = `
        SELECT o.*, d.ad as ders_adi, u.username as ogretmen_adi, 
               t.not_degeri, t.ogretmen_notu, t.teslim_tarihi as teslim_edilen_tarih, t.id as teslim_id
        FROM odevler o 
        JOIN dersler d ON o.ders_id = d.id 
        JOIN users u ON o.ogretmen_id = u.id 
        JOIN users ogrenci ON ogrenci.id = ? AND ogrenci.sinif_id = o.sinif_id
        LEFT JOIN odev_teslimleri t ON o.id = t.odev_id AND t.ogrenci_id = ?
    `;

    db.all(query, [ogrenci_id, ogrenci_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Ödevler getirilirken hata oluştu', error: err.message });
        }
        res.json(rows);
    });
};

const submitHomework = (req, res) => {
    const { odev_id } = req.params;
    const { yanit_metni } = req.body;
    const ogrenci_id = req.userId;

    if (!yanit_metni) {
        return res.status(400).json({ message: 'Lütfen bir yanıt metni girin.' });
    }

    const query = `INSERT INTO odev_teslimleri (odev_id, ogrenci_id, yanit_metni) VALUES (?, ?, ?)`;

    db.run(query, [odev_id, ogrenci_id, yanit_metni], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Ödev teslimi sırasında hata oluştu', error: err.message });
        }
        
        const teslimId = this.lastID;

        // Öğrenciye XP ekle
        db.run(`UPDATE users SET xp = xp + 50 WHERE id = ?`, [ogrenci_id], (xpErr) => {
            if (xpErr) console.error("XP güncellenemedi:", xpErr);
            
            // Ödev durumunu "gonderildi" olarak güncelle (Opsiyonel ama mantıklı)
            db.run(`UPDATE odevler SET durum = 'gonderildi' WHERE id = ?`, [odev_id], () => {
                res.status(201).json({ message: 'Ödev başarıyla teslim edildi', id: teslimId });
            });
        });
    });
};

module.exports = {
    createHomework,
    getHomeworksByClass,
    getSubmissionsByHomework,
    gradeSubmission,
    getHomeworksByStudent,
    submitHomework
};
