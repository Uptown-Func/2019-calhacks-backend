const fs = require('fs');
const extract = require('pdf-text-extract');
const UNParser = require('./parser');
const language = require('@google-cloud/language');

const client = new language.LanguageServiceClient();

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

fileParse('5.txt', UNParser).then(async (data) => {
    console.log(data);

    let tags = [];
    const document = {
      content: data[0].flat().join(" "),
      type: 'PLAIN_TEXT',
    };

    const [result] = await client.analyzeEntities({document});
    const entities = result.entities;

    entities.forEach(entity => {
    if (entity.type != "NUMBER" && entity.type != "DATE") {
      //console.log(entity.name);
      //console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
      tags.push([entity.name, entity.type]);
    }
  });
    console.log(tags);
}).catch(err => {
    console.log(err);
});
