#!/usr/bin/env node

var GoogleSpreadsheet = require('google-spreadsheet');
var program = require('commander');
var packageData = require('./package.json');
var helper = require('./helper')

program
    .version(packageData.version)
    .usage('<spreadsheet-id> <file> [options]')
    .option('-u, --user [user]', 'User to login')
    .option('-p, --password [password]', 'Password to login')
    .option('-t, --token [token]', 'Auth token acquired externally')
    .option('-y, --tokentype [tokentype]', 'Type of the informed token (defaults to Bearer)')
    .option('-w, --worksheet <n>', 'Worksheet index', parseInt)
    .option('-c, --hash [column]', 'Column to hash the final JSON')
    .option('-i, --vertical', 'Use the first column as header')
    .option('-l, --list-only', 'Ignore headers and just list the values in arrays')
    .option('-b, --beautify', 'Beautify final JSON')
    .parse(process.argv);

if (program.args.length < 2) {
    program.help();
}

program.spreadsheetId = program.args[0] || program.spreadsheetId

helper.spreadsheetToJson(program)
.then(function(res) {
    console.log(res);
})
.catch(function(err) {
    console.log(err.stack);
})

