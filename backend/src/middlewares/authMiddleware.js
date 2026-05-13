const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Erişim reddedildi: Token gerekli.' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role_id;
        next();
    });
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({ message: 'Kullanıcı rolü bulunamadı.' });
        }

        if (roles.includes(req.userRole)) {
            next();
        } else {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }
    };
};

module.exports = {
    verifyToken,
    checkRole
};
