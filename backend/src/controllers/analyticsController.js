const db = require('../config/database');

// Sınıfın o günkü ödev yükünü hesaplar. Eğer 60 dakikayı geçerse uyarı döner.
const getHomeworkLoad = (req, res) => {
    const { sinif_id, tarih } = req.query;

    if (!sinif_id) {
        return res.status(400).json({ message: 'Lütfen sinif_id parametresini belirtin.' });
    }

    // Eğer tarih verilmemişse, bugünün tarihini (YYYY-MM-DD) al
    let targetDate = tarih;
    if (!targetDate) {
        const today = new Date();
        targetDate = today.toISOString().split('T')[0];
    }

    // Belirtilen sınıfa ait ve oluşturulma tarihi hedef tarih olan ödevlerin EstimatedDuration toplamını al
    // olusturma_tarihi datetime olduğu için date(olusturma_tarihi) fonksiyonunu kullanarak sadece tarihi karşılaştırıyoruz.
    const query = `
        SELECT SUM(EstimatedDuration) as toplam_sure 
        FROM odevler 
        WHERE sinif_id = ? AND date(olusturma_tarihi) = ?
    `;

    db.get(query, [sinif_id, targetDate], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Analitik verisi hesaplanırken hata oluştu', error: err.message });
        }

        const toplamSure = row.toplam_sure || 0;
        let response = {
            sinif_id: sinif_id,
            tarih: targetDate,
            toplam_sure_dakika: toplamSure
        };

        if (toplamSure > 120) {
            response.warning = 'Yüksek Ödev Yükü';
        }

        res.json(response);
    });
};

module.exports = {
    getHomeworkLoad
};
