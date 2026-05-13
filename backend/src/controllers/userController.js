const db = require('../config/database');
const bcrypt = require('bcryptjs');

const getAdminDashboard = (req, res) => {
    res.json({
        message: 'Yönetici paneline hoş geldiniz. Bu veriyi sadece Yöneticiler görebilir.',
        user: { id: req.userId, role: req.userRole }
    });
};

const getTeacherDashboard = (req, res) => {
    res.json({
        message: 'Öğretmen paneline hoş geldiniz. Sınıfınızı ve öğrencilerinizi buradan yönetebilirsiniz.',
        user: { id: req.userId, role: req.userRole }
    });
};

const getStudentDashboard = (req, res) => {
    res.json({
        message: 'Öğrenci paneline hoş geldiniz. Ödevlerinizi buradan takip edebilirsiniz.',
        user: { id: req.userId, role: req.userRole }
    });
};

const getParentDashboard = (req, res) => {
    res.json({
        message: 'Veli paneline hoş geldiniz. Öğrencinizin durumunu buradan takip edebilirsiniz.',
        user: { id: req.userId, role: req.userRole }
    });
};

const getCommonData = (req, res) => {
    res.json({
        message: 'Bu veriyi sadece Yönetici ve Öğretmenler görebilir.'
    });
};

// --- KULLANICI YÖNETİMİ ---

const getAllUsers = (req, res) => {
    const query = `
        SELECT users.id, users.username, users.role_id, users.created_at, roles.name as role_name 
        FROM users 
        JOIN roles ON users.role_id = roles.id
        ORDER BY users.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Kullanıcılar getirilirken hata oluştu.', error: err.message });
        }
        res.json(rows);
    });
};

const createUser = async (req, res) => {
    const { username, password, role_id } = req.body;

    if (!username || !password || !role_id) {
        return res.status(400).json({ message: 'Lütfen kullanıcı adı, şifre ve rol alanlarını doldurun.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        db.run(`INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)`, [username, hash, role_id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
                }
                return res.status(500).json({ message: 'Kullanıcı eklenirken hata oluştu.', error: err.message });
            }
            res.status(201).json({ message: 'Kullanıcı başarıyla eklendi.', id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

const deleteUser = (req, res) => {
    const { id } = req.params;

    if (id == req.userId) {
        return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz.' });
    }

    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Kullanıcı silinirken hata oluştu.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json({ message: 'Kullanıcı başarıyla silindi.' });
    });
};

const updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
        return res.status(400).json({ message: 'Lütfen yeni bir rol belirtin.' });
    }

    db.run(`UPDATE users SET role_id = ? WHERE id = ?`, [role_id, id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Rol güncellenirken hata oluştu.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json({ message: 'Kullanıcı rolü başarıyla güncellendi.' });
    });
};

module.exports = {
    getAdminDashboard,
    getTeacherDashboard,
    getStudentDashboard,
    getParentDashboard,
    getCommonData,
    getAllUsers,
    createUser,
    deleteUser,
    updateUserRole
};
