const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database'); // Use existing connection

const runSeed = async () => {
    return new Promise((resolve, reject) => {
        const schema = `
            DROP TABLE IF EXISTS devamsizliklar;
            DROP TABLE IF EXISTS mesajlar;
            DROP TABLE IF EXISTS duyurular;
            DROP TABLE IF EXISTS odev_teslimleri;
            DROP TABLE IF EXISTS geri_bildirimler;
            DROP TABLE IF EXISTS odevler;
            DROP TABLE IF EXISTS dersler;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS roles;
            DROP TABLE IF EXISTS okullar;

            CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
            CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles (id));
            CREATE TABLE dersler (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL);
            CREATE TABLE odevler (id INTEGER PRIMARY KEY AUTOINCREMENT, ders_id INTEGER NOT NULL, ogretmen_id INTEGER NOT NULL, sinif_id INTEGER NOT NULL, baslik TEXT NOT NULL, aciklama TEXT, dosya_yolu TEXT, teslim_tarihi DATETIME, durum TEXT DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor', 'gonderildi')), sure_dakika INTEGER NOT NULL, olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (ders_id) REFERENCES dersler (id), FOREIGN KEY (ogretmen_id) REFERENCES users (id));
            CREATE TABLE geri_bildirimler (id INTEGER PRIMARY KEY AUTOINCREMENT, veli_id INTEGER NOT NULL, mesaj TEXT NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (veli_id) REFERENCES users (id));
            CREATE TABLE odev_teslimleri (id INTEGER PRIMARY KEY AUTOINCREMENT, odev_id INTEGER NOT NULL, ogrenci_id INTEGER NOT NULL, dosya_yolu TEXT, not_degeri INTEGER, ogretmen_notu TEXT, teslim_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (odev_id) REFERENCES odevler (id), FOREIGN KEY (ogrenci_id) REFERENCES users (id));
            CREATE TABLE duyurular (id INTEGER PRIMARY KEY AUTOINCREMENT, baslik TEXT NOT NULL, icerik TEXT NOT NULL, yayinlayan_id INTEGER NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (yayinlayan_id) REFERENCES users (id));
            CREATE TABLE mesajlar (id INTEGER PRIMARY KEY AUTOINCREMENT, gonderen_id INTEGER NOT NULL, alici_id INTEGER NOT NULL, mesaj TEXT NOT NULL, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (gonderen_id) REFERENCES users (id), FOREIGN KEY (alici_id) REFERENCES users (id));
            CREATE TABLE okullar (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, adres TEXT, tarih DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE devamsizliklar (id INTEGER PRIMARY KEY AUTOINCREMENT, ogrenci_id INTEGER NOT NULL, tarih DATE NOT NULL, durum TEXT NOT NULL CHECK(durum IN ('Tam Gün', 'Yarım Gün', 'Raporlu', 'İzinli')), FOREIGN KEY (ogrenci_id) REFERENCES users (id));
        `;

        db.exec(schema, async (err) => {
            if (err) return reject(new Error('Tablolar oluşturulurken hata: ' + err.message));

            try {
                // Promisify run to avoid silent failures
                const runQuery = (sql, params = []) => new Promise((res, rej) => {
                    db.run(sql, params, function(e) {
                        if (e) rej(e);
                        else res(this);
                    });
                });

                // 1. Roles
                const roles = [
                    { id: 1, name: 'Yönetici' },
                    { id: 2, name: 'Öğretmen' },
                    { id: 3, name: 'Öğrenci' },
                    { id: 4, name: 'Veli' }
                ];
                for (let r of roles) {
                    await runQuery(`INSERT INTO roles (id, name) VALUES (?, ?)`, [r.id, r.name]);
                }

                // 2. Schools
                const schools = [
                    { ad: 'Atatürk İlkokulu', adres: 'Ankara Merkez' },
                    { ad: 'Cumhuriyet Ortaokulu', adres: 'İstanbul Şişli' },
                    { ad: 'Fatih Anadolu Lisesi', adres: 'İzmir Konak' },
                    { ad: 'Bilim Koleji', adres: 'Antalya Muratpaşa' },
                    { ad: 'Sanat Lisesi', adres: 'Bursa Osmangazi' }
                ];
                for (let s of schools) {
                    await runQuery(`INSERT INTO okullar (ad, adres) VALUES (?, ?)`, [s.ad, s.adres]);
                }

                // 3. Dersler
                const dersler = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'];
                for (let d of dersler) {
                    await runQuery(`INSERT INTO dersler (ad) VALUES (?)`, [d]);
                }

                // 4. Users
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync('123', salt);
                
                await runQuery(`INSERT INTO users (id, username, password_hash, role_id) VALUES (?, ?, ?, ?)`, [1, 'admin', hash, 1]);
                for(let i=1; i<=5; i++) await runQuery(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`, [`ogretmen${i}`, hash, 2]);
                for(let i=1; i<=5; i++) await runQuery(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`, [`ogrenci${i}`, hash, 3]);
                for(let i=1; i<=5; i++) await runQuery(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`, [`veli${i}`, hash, 4]);

                // 5. Odevler (Ensure Teacher IDs match! ogretmen1 is ID=2)
                const homeworks = [
                    { ders_id: 1, ogretmen_id: 2, sinif_id: 1, baslik: 'Türev Uygulamaları', aciklama: 'Türev alma kuralları ile ilgili 50 soru', teslim_tarihi: '2026-05-20', durum: 'bekliyor', sure_dakika: 120 },
                    { ders_id: 2, ogretmen_id: 3, sinif_id: 1, baslik: 'Kompozisyon', aciklama: 'Yaz tatili planlarınız hakkında kompozisyon', teslim_tarihi: '2026-05-21', durum: 'bekliyor', sure_dakika: 60 },
                    { ders_id: 3, ogretmen_id: 4, sinif_id: 1, baslik: 'Hücre Modeli', aciklama: 'Bitki hücresi 3 boyutlu model yapımı', teslim_tarihi: '2026-05-25', durum: 'bekliyor', sure_dakika: 180 },
                    { ders_id: 4, ogretmen_id: 5, sinif_id: 1, baslik: 'Coğrafi Keşifler', aciklama: 'Harita üzerinde keşif yollarının çizilmesi', teslim_tarihi: '2026-05-22', durum: 'bekliyor', sure_dakika: 90 },
                    { ders_id: 5, ogretmen_id: 6, sinif_id: 1, baslik: 'Present Perfect Tense', aciklama: '10 cümle kurma ödevi', teslim_tarihi: '2026-05-18', durum: 'gonderildi', sure_dakika: 45 }
                ];
                for (let hw of homeworks) {
                    await runQuery(`INSERT INTO odevler (ders_id, ogretmen_id, sinif_id, baslik, aciklama, teslim_tarihi, durum, sure_dakika) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                        [hw.ders_id, hw.ogretmen_id, hw.sinif_id, hw.baslik, hw.aciklama, hw.teslim_tarihi, hw.durum, hw.sure_dakika]);
                }

                // 6. Teslimler (ogrenci1 is ID=7)
                const submissions = [
                    { odev_id: 5, ogrenci_id: 7, not: 95, yorum: 'Harika bir iş!' },
                    { odev_id: 5, ogrenci_id: 8, not: 80, yorum: 'Biraz daha pratik yapmalısın.' },
                    { odev_id: 5, ogrenci_id: 9, not: 100, yorum: 'Kusursuz!' },
                    { odev_id: 5, ogrenci_id: 10, not: 60, yorum: 'Zamanlar karışmış.' },
                    { odev_id: 5, ogrenci_id: 11, not: 75, yorum: 'İyi deneme.' }
                ];
                for (let sub of submissions) {
                    await runQuery(`INSERT INTO odev_teslimleri (odev_id, ogrenci_id, not_degeri, ogretmen_notu) VALUES (?, ?, ?, ?)`, [sub.odev_id, sub.ogrenci_id, sub.not, sub.yorum]);
                }

                // 7. Mesajlar
                const messages = [
                    { g: 2, a: 7, msg: 'Ödevini zamanında teslim ettiğin için teşekkürler.' },
                    { g: 7, a: 2, msg: 'Rica ederim hocam.' },
                    { g: 12, a: 2, msg: 'Çocuğumun durumu nasıl?' }, // veli1=12
                    { g: 2, a: 12, msg: 'Gayet başarılı gidiyor.' },
                    { g: 3, a: 8, msg: 'Matematik notlarında düşüş var.' }
                ];
                for (let m of messages) {
                    await runQuery(`INSERT INTO mesajlar (gonderen_id, alici_id, mesaj) VALUES (?, ?, ?)`, [m.g, m.a, m.msg]);
                }

                console.log('Tüm veriler başarıyla eklendi! (Şifreler: 123)');
                resolve();

            } catch (err) {
                console.error("Veri eklenirken hata:", err);
                reject(new Error('Veri ekleme hatası: ' + err.message));
            }
        });
    });
};

if (require.main === module) {
    runSeed().then(() => process.exit(0)).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = runSeed;
