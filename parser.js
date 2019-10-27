/**
 * an example parser.
 * Inputs:
 * data: array of pages, each page an array of lines
 *
 * Outputs:
 * Identifier
 * Date
 * Related pieces
 */
const language = require('@google-cloud/language');
const stopwords = require('most-common-words-by-language');

const client = new language.LanguageServiceClient();
const countries = require('country-list');

let common_words = stopwords.getWordsList('english', 200);
let all_countries = countries.getNames();
let all_continents = ['North America', "South America", "Europe", "Africa", "Antarctica", "Asia", "Oceania", "Americas"]

const parser = async (data) => {
    /**
     * lets make sure the headers seem right.
     * if they're not, explode really badly.
     */

    //console.log(data);

    // in the first page, the first element usually says United Nations, right?
    if (data[0][0] != 'United Nations') {
        throw new Error(`header should be United Nations, got ${data[0][0]}`);
    }

    // then comes the organ name
    // why are they called organs??
    const organ = data[0][1];
    // these are all the organs. Fill as necessary
    const allOrgans = [
        'General Assembly'
    ];
    if (!allOrgans.includes(organ)) {
        throw new Error(`unknown organ: ${organ}`);
    }

    // get the resolution identifier
    const identifier = data[0][3];
    // the regex should probably match:
    // A/RES/session/document no
    const identifierRegex = /A\/RES\/(?<session>\d*)\/(?<doc>\d*)/;
    try {
        ({session, doc} = identifier.match(identifierRegex).groups);
    } catch(err) {
        throw new Error(`Unable to find session, doc: ${session}, ${doc}`);
    }
    if (isNaN(parseInt(session))) {
        throw new Error(`session ${session} is not a number`);
    }
    if (isNaN(parseInt(doc))) {
        throw new Error(`doc ${doc} is not a number`);
    }

    // extract the date: last three words
    const date = new Date(data[0][4].split(' ').slice(-3));

    // extract summary
    let summary = data[0][6];
    let summaryRegex = /.* session Agenda item (\d*)( \(\w*\))?/;
    let results = summary.match(summaryRegex);
    results.shift();
    // extract agenda number
    const agenda = results.join('');
    // the summary comes after the agenda number
    // TODO: modify the regex to match multiple agenda numbers
    summary = summary.substring(summary.indexOf(agenda) + agenda.length + 1);

    const related = new Set();
    // given a line, extract any relevant resolutions.
    // how a resolution is referenced is nonstandard; however, we have identified some common ways:
    const resolutionRegexes = [
        // Resolution <session>/<document>
        /(?:resolution )(?<session>\d+)\/(?<doc>\d+)/ig,
        // A/<session>/<doc>(/<addendum>)?
        /A\/(?<session>[a-zA-Z1-9.]+)\/(?<doc>[a-zA-Z1-9.]+)(?:\/)?(?<mod>[a-zA-Z1-9.]+)?/g,
        // Resolution <document> A (<roman>)?
        /resolution (?<doc>\d+) A (?<roman>\([IVX]+\))/gi,
        // Reference other document?
        /(?<direct>\w+\/\w+\/\d+\/\d+(\/[a-zA-Z1-9.]+)?)/gi
    ];
    // given these named regex groups, re-render the links so they work relative to https://undocs.org/en/
    const resolutionRegexRender = [
        ({session, doc}) => {
            return `A/RES/${session}/${doc}`;
        },
        ({session, doc, mod}) => {
            if (doc && doc.endsWith('.')) {
                doc = doc.substring(0, doc.length - 1);
            }
            return `A/${session}/${doc}${mod ? `${mod}` : ''}`;
        },
        ({doc, roman}) => {
            return `A/RES/${doc} ${roman}`;
        },
        ({direct}) => {
            return direct;
        }
    ];

    let title;
    let countries = [];
    let continents = [];

    for (let page of data) {
        for (let line of page) {
            for (let i = 0; i < resolutionRegexes.length; i++) {
                for (let match of line.matchAll(resolutionRegexes[i])) {
                    if (match[0] != identifier) {
                        related.add(resolutionRegexRender[i](match.groups));
                    }
                }
            }
            // also search for the title
            if (line.startsWith(`${session}/${doc}.`)) {
                title = line.substring(line.indexOf(' ') + 1);
            }
            // finally search for locations
            if (line !== '') {
              for (country of all_countries) {
                if (line.includes(country) && countries.indexOf(country) == -1) {
                  countries.push(country);
                }
              }
              for (continent of all_continents) {
                if (line.includes(continent) && continents.indexOf(continent) == -1) {
                  continents.push(continent);
                }
              }
            }
        }
    }

    let tags = [];
    const document = {
      content: data.flat().join(" "),
      type: 'PLAIN_TEXT',
    };

    const [result] = await client.analyzeEntities({document});
    const entities = result.entities;

    entities.forEach(entity => {
    if (entity.type != "NUMBER" && entity.type != "DATE" && tags.indexOf(entity.name) == -1) {
      tags.push(entity.name);
    }
  });
    tags = tags.filter(x => !common_words.includes(x));

    return {organ, identifier, date, summary, related: [...related], title, countries, continents, tags};
}

module.exports = parser;
