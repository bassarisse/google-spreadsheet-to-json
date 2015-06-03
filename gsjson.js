#!/usr/bin/env node

var GoogleSpreadsheet = require("google-spreadsheet");
var fs = require('fs');
var program = require('commander');

program
    .version('0.1.5')
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

var worksheetIndex = program.worksheet || 0;
var spreadsheetId = program.args[0];
var filename = program.args[1];

var spreadsheet = new GoogleSpreadsheet(spreadsheetId);

if (program.token) {
    var tokentype = program.tokentype || "Bearer";
    spreadsheet.setAuthToken({
        value: program.token,
        type: tokentype
    });
    run();
} else if (program.user && program.password) {
    spreadsheet.setAuth(program.user, program.password, function(err) {
        if (err)
            throw err;
        run();
    });
} else {
    run();
}

function run() {

    spreadsheet.getInfo(function(err, sheet_info) {
        if (err)
            throw err;

        sheet_info.worksheets[worksheetIndex].getCells(function(err, cells) {
            if (err)
                throw err;

            var rowProp = program.vertical ? "col" : "row";
            var colProp = program.vertical ? "row" : "col";

            var rows = cells.reduce(function(rows, cell) {
                var rowIndex = cell[rowProp] - 1;
                if (typeof rows[rowIndex] === "undefined")
                    rows[rowIndex] = [];
                rows[rowIndex].push(cell);
                return rows;
            }, []);

            rows.forEach(function(col) {
                col.sort(function(cell1, cell2) {
                    return cell1[colProp] - cell2[colProp];
                });
            });

            var isHashed = program.hash && !program.listOnly;
            var finalList = isHashed ? {} : [];
            var properties = rows[0].reduce(function(properties, cell) {
                if (cell.value === "")
                    return properties;

                properties[cell[colProp]] = cell.value
                    .toLowerCase()
                    .replace(/[- ]/ig, " ")
                    .split(" ")
                    .map(function(val, index) {
                        return !index ? val : val.charAt(0).toUpperCase() + val.slice(1);
                    })
                    .join("");

                return properties;
            }, {});

            rows.splice(0, 1);
            rows.forEach(function(col) {

                var newObject = program.listOnly ? [] : {};
                var hasValues = false;

                col.forEach(function(cell) {
                    var val;

                    if (typeof cell.numericValue !== "undefined") {
                        val = parseFloat(cell.numericValue);
                        hasValues = true;
                    } else if (cell.value === "TRUE") {
                        val = true;
                        hasValues = true;
                    } else if (cell.value === "FALSE") {
                        val = false;
                        hasValues = true;
                    } else if (cell.value !== "") {
                        val = cell.value;
                        hasValues = true;
                    }

                    var colNumber = cell[colProp];

                    if (program.listOnly)
                        newObject[colNumber - 1] = val;
                    else
                        newObject[properties[colNumber]] = val;
                });

                if (hasValues) {
                    if (isHashed)
                        finalList[newObject[program.hash]] = newObject;
                    else
                        finalList.push(newObject);
                }
            });

            var json = JSON.stringify(finalList, null, program.beautify ? 4 : null);

            fs.writeFile(filename, json, "utf-8", function(err) {
                if (err)
                    throw err;
                process.exit(0);
            });

        });
    });
}