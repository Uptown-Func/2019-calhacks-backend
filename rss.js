const rss = require('rss-parser');
const parser = new rss();
const fs = require('fs');
const request = require('request');
const pdf = require('pdf-text-extract');

const url = 'https://undocs.org/rss/gadocs.xml';
const pdfBase = 'https://undocs.org/pdf?symbol=en';
const filePrefix = './data/';
const cacheFile = `${filePrefix}cache.txt`;

const getRss = () => {
    return parser.parseURL(url).then(data => {
        data.items.shift();
        for (let item of data.items) {
            let pdfUrl = `${pdfBase}/${item.title}`;
            let pdfDest = `${filePrefix}${item.title.replace(/\//g, '-')}.pdf`;
            let w = fs.createWriteStream(pdfDest);
            w.on('close', () => {
                console.log(`finished: ${pdfDest}`);
                pdf(pdfDest, (err, data) => {
                    fs.writeFile(pdfDest.replace('.pdf', '.txt'), data, () => {
                    });
                });
            });
            request.get(pdfUrl).on('error', err => {
                console.log(err);
            }).pipe(w);
        }
    }).catch(err => {
        throw err;
    });
};

getRss();
