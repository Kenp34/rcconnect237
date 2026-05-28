const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    // Dossier de destination
    destination: (req, file, cb) => cb(null, './uploads/'),

    // Nom du fichier : timestamp + nombre aléatoire + extension originale
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // Max 5 MB
    fileFilter: (req, file, cb) => {
        // N'accepter que les images
        /jpeg|jpg|png|gif|webp/.test(file.mimetype)
            ? cb(null, true)       // Accepter
            : cb(new Error('Format non supporté')); // Refuser
    }
});

module.exports = upload;