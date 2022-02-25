const fs = require('fs');

exports.fileRemove = fileUrl => {
    if (fs.existsSync(fileUrl)) {
        fs.unlink(fileUrl, err =>
            err ? console.log(err) : 'File removed Succesfully'
        );
    } else console.log('The given path doesnt exist');
};
