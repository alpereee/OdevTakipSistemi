const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
    } else {
        console.log('SQLite veritabanına bağlanıldı.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Roles Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        )`);

        // Users Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles (id)
        )`);

        // Dersler Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS dersler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL
        )`);

        // Ödevler Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS odevler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ders_id INTEGER NOT NULL,
            ogretmen_id INTEGER NOT NULL,
            sinif_id INTEGER NOT NULL,
            baslik TEXT NOT NULL,
            aciklama TEXT,
            teslim_tarihi DATETIME,
            durum TEXT DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor', 'gonderildi')),
            EstimatedDuration INTEGER NOT NULL DEFAULT 60,
            olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ders_id) REFERENCES dersler (id),
            FOREIGN KEY (ogretmen_id) REFERENCES users (id)
        )`);

        // Geri Bildirim Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS geri_bildirimler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            veli_id INTEGER NOT NULL,
            mesaj TEXT NOT NULL,
            tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (veli_id) REFERENCES users (id)
        )`);

        // Ödev Teslimleri Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS odev_teslimleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            odev_id INTEGER NOT NULL,
            ogrenci_id INTEGER NOT NULL,
            yanit_metni TEXT,
            not_degeri INTEGER,
            ogretmen_notu TEXT,
            teslim_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (odev_id) REFERENCES odevler (id),
            FOREIGN KEY (ogrenci_id) REFERENCES users (id)
        )`);

        // Duyurular Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS duyurular (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            baslik TEXT NOT NULL,
            icerik TEXT NOT NULL,
            yayinlayan_id INTEGER NOT NULL,
            tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (yayinlayan_id) REFERENCES users (id)
        )`);

        // Mesajlar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS mesajlar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gonderen_id INTEGER NOT NULL,
            alici_id INTEGER NOT NULL,
            mesaj TEXT NOT NULL,
            tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (gonderen_id) REFERENCES users (id),
            FOREIGN KEY (alici_id) REFERENCES users (id)
        )`);


        // Okullar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS okullar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL,
            adres TEXT,
            tarih DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sınıflar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS siniflar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL,
            ogretmen_id INTEGER NOT NULL,
            FOREIGN KEY (ogretmen_id) REFERENCES users (id)
        )`);

        // Devamsızlıklar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS devamsizliklar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ogrenci_id INTEGER NOT NULL,
            tarih DATE NOT NULL,
            durum TEXT NOT NULL CHECK(durum IN ('Tam Gün', 'Yarım Gün', 'Raporlu', 'İzinli')),
            FOREIGN KEY (ogrenci_id) REFERENCES users (id)
        )`, () => {
            // Örnek devamsızlık verisi (ogrenci_ayse - id: 3 için)
            db.get("SELECT COUNT(*) as count FROM devamsizliklar", [], (err, row) => {
                if (row && row.count === 0) {
                    const stmt = db.prepare("INSERT INTO devamsizliklar (ogrenci_id, tarih, durum) VALUES (?, ?, ?)");
                    stmt.run(3, "2026-05-10", "Tam Gün");
                    stmt.run(3, "2026-05-12", "Raporlu");
                    stmt.finalize();
                }
            });
        });

        // Rolleri ekle (Eğer yoksa)
        const roles = [
            { id: 1, name: 'Yönetici' },
            { id: 2, name: 'Öğretmen' },
            { id: 3, name: 'Öğrenci' },
            { id: 4, name: 'Veli' }
        ];

        const insertRole = db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)`);
        roles.forEach(role => insertRole.run(role.id, role.name));
        insertRole.finalize();

        // Örnek Kullanıcıları ekle
        db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
            if (row && row.count === 0) {
                console.log('Örnek kullanıcılar oluşturuluyor...');
                
                const users = [
                    { username: 'admin', password: '123', role_id: 1 },
                    { username: 'ogretmen_ali', password: '123', role_id: 2 },
                    { username: 'ogrenci_ayse', password: '123', role_id: 3 },
                    { username: 'veli_ahmet', password: '123', role_id: 4 }
                ];

                const insertUser = db.prepare(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`);
                
                for (let user of users) {
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(user.password, salt);
                    insertUser.run(user.username, hash, user.role_id);
                }
                insertUser.finalize();
                console.log('Örnek kullanıcılar oluşturuldu! Şifreler: 123');
            }
        });
    });
}

module.exports = db;
