const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

// Veritabanı dosyasını sil (Temiz bir başlangıç için)
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Eski veritabanı silindi.');
}

// Veritabanı nesnesini oluştur
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı oluşturulurken hata:', err.message);
        return;
    }
    console.log('Yeni veritabanı oluşturuldu.');
    createTablesAndSeed();
});

function createTablesAndSeed() {
    const schema = `
        CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles (id));
        CREATE TABLE IF NOT EXISTS dersler (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS odevler (id INTEGER PRIMARY KEY AUTOINCREMENT, ders_id INTEGER NOT NULL, ogretmen_id INTEGER NOT NULL, sinif_id INTEGER NOT NULL, baslik TEXT NOT NULL, aciklama TEXT, dosya_yolu TEXT, teslim_tarihi DATETIME, durum TEXT DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor', 'gonderildi')), sure_dakika INTEGER NOT NULL, olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (ders_id) REFERENCES dersler (id), FOREIGN KEY (ogretmen_id) REFERENCES users (id));
        CREATE TABLE IF NOT EXISTS geri_bildirimler (id INTEGER PRIMARY KEY AUTOINCREMENT, veli_id INTEGER NOT NULL, mesaj TEXT NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (veli_id) REFERENCES users (id));
        CREATE TABLE IF NOT EXISTS odev_teslimleri (id INTEGER PRIMARY KEY AUTOINCREMENT, odev_id INTEGER NOT NULL, ogrenci_id INTEGER NOT NULL, dosya_yolu TEXT, not_degeri INTEGER, ogretmen_notu TEXT, teslim_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (odev_id) REFERENCES odevler (id), FOREIGN KEY (ogrenci_id) REFERENCES users (id));
        CREATE TABLE IF NOT EXISTS duyurular (id INTEGER PRIMARY KEY AUTOINCREMENT, baslik TEXT NOT NULL, icerik TEXT NOT NULL, yayinlayan_id INTEGER NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (yayinlayan_id) REFERENCES users (id));
        CREATE TABLE IF NOT EXISTS mesajlar (id INTEGER PRIMARY KEY AUTOINCREMENT, gonderen_id INTEGER NOT NULL, alici_id INTEGER NOT NULL, mesaj TEXT NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (gonderen_id) REFERENCES users (id), FOREIGN KEY (alici_id) REFERENCES users (id));
        CREATE TABLE IF NOT EXISTS okullar (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, adres TEXT, tarih DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS devamsizliklar (id INTEGER PRIMARY KEY AUTOINCREMENT, ogrenci_id INTEGER NOT NULL, tarih DATE NOT NULL, durum TEXT NOT NULL CHECK(durum IN ('Tam Gün', 'Yarım Gün', 'Raporlu', 'İzinli')), FOREIGN KEY (ogrenci_id) REFERENCES users (id));
    `;

    db.exec(schema, async (err) => {
        if (err) return console.error(err);

        db.serialize(async () => {
            // Rolleri Ekle
            const roles = [
                { id: 1, name: 'Yönetici' },
                { id: 2, name: 'Öğretmen' },
                { id: 3, name: 'Öğrenci' },
                { id: 4, name: 'Veli' }
            ];
            const insertRole = db.prepare(`INSERT INTO roles (id, name) VALUES (?, ?)`);
            roles.forEach(role => insertRole.run(role.id, role.name));
            insertRole.finalize();

            // Okulları Ekle
            const schools = [
                { ad: 'Atatürk İlkokulu', adres: 'Ankara Merkez' },
                { ad: 'Cumhuriyet Ortaokulu', adres: 'İstanbul Şişli' },
                { ad: 'Fatih Anadolu Lisesi', adres: 'İzmir Konak' },
                { ad: 'Bilim Koleji', adres: 'Antalya Muratpaşa' },
                { ad: 'Sanat Lisesi', adres: 'Bursa Osmangazi' }
            ];
            const insertSchool = db.prepare(`INSERT INTO okullar (ad, adres) VALUES (?, ?)`);
            schools.forEach(school => insertSchool.run(school.ad, school.adres));
            insertSchool.finalize();

            // Dersleri Ekle
            const dersler = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'];
            const insertDers = db.prepare(`INSERT INTO dersler (ad) VALUES (?)`);
            dersler.forEach(ders => insertDers.run(ders));
            insertDers.finalize();

            // Kullanıcıları Ekle (Admin, 5 Öğretmen, 5 Öğrenci, 5 Veli)
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('123', salt);
            const insertUser = db.prepare(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`);
            
            insertUser.run('admin', hash, 1);
            for(let i=1; i<=5; i++) insertUser.run(`ogretmen${i}`, hash, 2);
            for(let i=1; i<=5; i++) insertUser.run(`ogrenci${i}`, hash, 3);
            for(let i=1; i<=5; i++) insertUser.run(`veli${i}`, hash, 4);
            insertUser.finalize();

            // Ödevleri Ekle
            const insertHomework = db.prepare(`INSERT INTO odevler (ders_id, ogretmen_id, sinif_id, baslik, aciklama, teslim_tarihi, durum, sure_dakika) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            insertHomework.run(1, 2, 1, 'Türev Uygulamaları', 'Türev alma kuralları ile ilgili 50 soru', '2026-05-20', 'bekliyor', 120);
            insertHomework.run(2, 2, 1, 'Kompozisyon', 'Yaz tatili planlarınız hakkında kompozisyon', '2026-05-21', 'bekliyor', 60);
            insertHomework.run(3, 3, 1, 'Hücre Modeli', 'Bitki hücresi 3 boyutlu model yapımı', '2026-05-25', 'bekliyor', 180);
            insertHomework.run(4, 4, 1, 'Coğrafi Keşifler', 'Harita üzerinde keşif yollarının çizilmesi', '2026-05-22', 'bekliyor', 90);
            insertHomework.run(5, 5, 1, 'Present Perfect Tense', '10 cümle kurma ödevi', '2026-05-18', 'gonderildi', 45);
            insertHomework.finalize();

            // Teslimleri Ekle
            const insertSubmission = db.prepare(`INSERT INTO odev_teslimleri (odev_id, ogrenci_id, not_degeri, ogretmen_notu) VALUES (?, ?, ?, ?)`);
            insertSubmission.run(5, 7, 95, 'Harika bir iş!'); // odev_id:5, ogrenci1 (id:7)
            insertSubmission.run(5, 8, 80, 'Biraz daha pratik yapmalısın.'); // ogrenci2 (id:8)
            insertSubmission.run(5, 9, 100, 'Kusursuz!'); // ogrenci3 (id:9)
            insertSubmission.run(5, 10, 60, 'Zamanlar karışmış.'); // ogrenci4 (id:10)
            insertSubmission.run(5, 11, 75, 'İyi deneme.'); // ogrenci5 (id:11)
            insertSubmission.finalize();

            // Mesajları Ekle
            const insertMessage = db.prepare(`INSERT INTO mesajlar (gonderen_id, alici_id, mesaj) VALUES (?, ?, ?)`);
            insertMessage.run(2, 7, 'Ödevini zamanında teslim ettiğin için teşekkürler.'); // ogretmen1 -> ogrenci1
            insertMessage.run(7, 2, 'Rica ederim hocam.');
            insertMessage.run(12, 2, 'Çocuğumun durumu nasıl?'); // veli1(12) -> ogretmen1(2)
            insertMessage.run(2, 12, 'Gayet başarılı gidiyor.'); 
            insertMessage.run(3, 8, 'Matematik notlarında düşüş var.'); 
            insertMessage.finalize();

            // Devamsızlıkları Ekle
            const insertAttendance = db.prepare(`INSERT INTO devamsizliklar (ogrenci_id, tarih, durum) VALUES (?, ?, ?)`);
            insertAttendance.run(7, '2026-05-01', 'Tam Gün');
            insertAttendance.run(7, '2026-05-05', 'Raporlu');
            insertAttendance.run(8, '2026-05-02', 'İzinli');
            insertAttendance.run(9, '2026-05-10', 'Yarım Gün');
            insertAttendance.run(10, '2026-05-11', 'Tam Gün');
            insertAttendance.finalize();

            console.log('Tüm veriler başarıyla eklendi! (Şifreler: 123)');
        });
    });
}
