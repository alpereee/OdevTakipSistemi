const db = require('../config/database');

const getSchools = (req, res) => {
    db.all(`SELECT * FROM okullar ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Okullar getirilemedi.' });
        res.json(rows);
    });
};

module.exports = { getSchools };
