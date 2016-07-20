#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var Promise = require('bluebird');
var helper = require('./helper');
var packageData = require('./package.json');

program
    .version(packageData.version)
    .usage('<spreadsheet-id> [file] [options]')
    .option('-u, --user <user>', 'User to login')
    .option('-p, --password <password>', 'Password to login')
    .option('-t, --token <token>', 'Auth token acquired externally')
    .option('-y, --tokentype <tokentype>', 'Type of the informed token (defaults to Bearer)')
    .option('-w, --worksheet <n>', 'Worksheet index or title', handlePossibleIntValue)
    .option('-c, --hash <column>', 'Column to hash the final object')
    .option('-m, --property-mode <mode>', 'How to handle property names: "camel" (default), "pascal", "nospace" or "none"', /^(camel|pascal|nospace|none)$/i, 'camel')
    .option('-i, --vertical', 'Use the first column as header')
    .option('-l, --list-only', 'Just list the values in arrays')
    .option('-0, --include-header', 'Include header when using "list-only" option')
    .option('-b, --beautify', 'Beautify final JSON')
    .parse(process.argv);

if (program.args.length < 1) {
    program.help();
}

program.spreadsheetId = program.args[0] || program.spreadsheetId;

var filename = program.args[1];

helper.spreadsheetToJson(program)
.then(function(res) {

    if (filename) {
        return Promise.promisify(fs.writeFile)(filename, res, 'utf-8');
    } else {
        process.stdout.write(res);
    }

})
.catch(function(err) {
    throw err;
});

function handlePossibleIntValue(val) {
    if (/^\d+$/.test(val))
        return parseInt(val, 10);
    return val;
}
