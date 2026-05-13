const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    db.get('SELECT users.*, roles.name as role_name FROM users JOIN roles ON users.role_id = roles.id WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
        }

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Hatalı şifre.' });
        }

        // Token oluştur (1 gün geçerli)
        const token = jwt.sign(
            { id: user.id, role_id: user.role_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                username: user.username,
                role_id: user.role_id,
                role_name: user.role_name
            }
        });
    });
};

const resetPassword = async (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.status(400).json({ message: 'Eksik bilgi' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        
        db.run(`UPDATE users SET password_hash = ? WHERE username = ?`, [hash, username], function(err) {
            if (err) return res.status(500).json({ message: 'Hata oluştu' });
            if (this.changes === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
            res.json({ message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    login,
    resetPassword
};
