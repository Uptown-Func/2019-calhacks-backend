/**
 * an example parser. Takes in data, returns the following:
 * Identifier
 * Date
 * Related pieces
 */

const parser = (data) => {
    /**
     * lets make sure the headers seem right.
     * if they're not, explode really badly.
     */

    console.log(data);

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
    const identifierRegex = /A\/RES\/(\d*)\/(\d*)/;
    const [_, session, doc] = identifier.match(identifierRegex);
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

    const related = [];


    return {organ, identifier, date, summary};
}

module.exports = parser;
