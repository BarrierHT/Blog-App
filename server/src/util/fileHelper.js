const fs = require('fs');

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

exports.fileRemove = fileUrl => {
    console.log('fileUrl:', fileUrl);
    if (fs.existsSync(fileUrl)) {
        fs.unlink(fileUrl, err =>
            err ? console.log(err) : 'File removed Succesfully'
        );
    } else console.log('The given path doesnt exist');
};

exports.uploadFile = () => {
    const fileStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'src/data/images'),
        filename: (req, file, cb) =>
            cb(null, uuidv4() + '-' + file.originalname),
    });

    const fileFilter = (req, file, cb) => {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'
        )
            cb(null, true);
        else cb(null, false);
    };

    const upload = multer({
        storage: fileStorage,
        fileFilter,
        limits: { fileSize: 1048576 },
    });

    return upload;
};
