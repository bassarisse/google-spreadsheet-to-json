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
    .option('-s, --credentials <s>', 'Service Account credentials JSON data or file path')
    .option('-t, --token <token>', 'Auth token acquired externally')
    .option('-y, --tokentype <tokentype>', 'Type of the informed token (defaults to "Bearer")')
    .option('-w, --worksheet <n>', 'Worksheet index (zero-based) or title (defaults to first worksheet, can be repeated)', handlePossibleList)
    .option('-a, --all-worksheets', 'Return all worksheets (worksheet option is ignored)')
    .option('-c, --hash <column>', 'Column to hash the final object')
    .option('-m, --property-mode <mode>', 'How to handle property names: "camel" (default), "pascal", "nospace" or "none"', /^(camel|pascal|nospace|none)$/i, 'camel')
    .option('-i, --vertical', 'Use the first column as header')
    .option('-l, --list-only', 'Just list the values in arrays')
    .option('-0, --include-header', 'Include header when using "list-only" option')
    .option('--header-start <n>', 'Header start line (auto-detected by default)')
    .option('--header-size <n>', 'Header lines quantity (defaults to 1)')
    .option('--ignore-col <n>', 'Column name (Excel-like labels) to be ignored (can be repeated, number are also supported)', handlePossibleList)
    .option('--ignore-row <n>', 'Row number to be ignored (can be repeated)', handlePossibleList)
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

function handlePossibleList(val, memo) {

    if (typeof memo !== 'undefined') {
        if (Array.isArray(memo)) {
            memo.push(val)
            return memo
        } else {
            return [memo, val]
        }
    }

    return val
}
