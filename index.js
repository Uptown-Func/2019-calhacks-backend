const fs = require('fs');
const UNParser = require('./parser');

const parse = (filename) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        console.log(`---- ${filename} ----`);

        data = data.split('\f'); // split into pages
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].split(/\r?\n/); //platform agnostic split
        }

        // time to parse the data
        data = UNParser(data);

        console.log(data);
    });
}

parse('4.txt');
parse('5.txt');

