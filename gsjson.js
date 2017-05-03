#!/usr/bin/env node

var fs = require('fs')
var program = require('commander')
var Promise = require('bluebird')
var helper = require('./helper')
var packageData = require('./package.json')

program
    .version(packageData.version)
    .usage('<spreadsheet-id> [file] [options]')
    .option('-b, --beautify', 'Beautify final JSON')
    .option('-s, --credentials <string>', 'Service Account credentials JSON data or file path')
    .option('-t, --token <token>', 'Auth token acquired externally')
    .option('-y, --tokentype <tokentype>', 'Type of the informed token (defaults to Bearer)')
    .option('-w, --worksheet <n>', 'Worksheet index or title (defaults to first worksheet, can be repeated)', handleWorksheetIdentifiers)
    .option('-c, --hash <column>', 'Column to hash the final object')
    .option('-m, --property-mode <mode>', 'How to handle property names: "camel" (default), "pascal", "nospace" or "none"', /^(camel|pascal|nospace|none)$/i, 'camel')
    .option('-i, --vertical', 'Use the first column as header')
    .option('-l, --list-only', 'Just list the values in arrays')
    .option('-0, --include-header', 'Include header when using "list-only" option')
    .parse(process.argv)

if (program.args.length < 1) {
    program.help()
}

program.spreadsheetId = program.args[0] || program.spreadsheetId

var filename = program.args[1]

helper.spreadsheetToJson(program)
.then(function(result) {
    return JSON.stringify(result, null, program.beautify ? 4 : null)
})
.then(function(result) {

    if (filename) {
        return Promise.promisify(fs.writeFile)(filename, result, 'utf-8')
    } else {
        process.stdout.write(result)
    }

})
.catch(function(err) {
    throw err
})

function handlePossibleIntValue(val) {
    if (/^\d+$/.test(val))
        return parseInt(val, 10)
    return val
}

function handleWorksheetIdentifiers(val, memo) {

    var identifier = handlePossibleIntValue(val)

    if (typeof memo !== 'undefined') {
        if (Array.isArray(memo)) {
            memo.push(identifier)
            return memo
        } else {
            return [memo, identifier]
        }
    }

    return identifier
}
