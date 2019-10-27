const fs = require('fs');
const extract = require('pdf-text-extract');
const UNParser = require('./parser');

const fileParse = (filename, parser) => {
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(filename, 'utf8', (err, data) => {
                console.log(`---- ${filename} ----`);
                resolve(parse(data, parser));
            });
        } catch(err) {
            reject(err);
        }
    });
};

const parse = (data, parser) => {
    return new Promise((resolve, reject) => {
        // split into pages
        data = data.split('\f');
        for (let i = 0; i < data.length; i++) {
            //platform agnostic split
            data[i] = data[i].split(/\r?\n/);
        }

        // time to parse the data
        try {
            resolve(parser(data));
        } catch (err) {
            reject(err);
        }
    });
};

fileParse('4.txt', UNParser).then(async (data) => {
    console.log(data);

}).catch(err => {
    console.log(err);
});
