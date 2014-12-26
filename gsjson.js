#!/usr/bin/env node

var GoogleSpreadsheet = require("google-spreadsheet");
var fs = require('fs');
var program = require('commander');

program
    .version('0.1.0')
    .usage('<spreadsheet-id> <file> [options]')
    .option('-u, --user [user]', 'User to login')
    .option('-p, --password [password]', 'Password to login')
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

if (program.user && program.password) {
    spreadsheet.setAuth(program.user, program.password, function(err) {
        run();
    });
} else {
    run();
}

function run() {

    spreadsheet.getInfo(function(err, sheet_info) {

        sheet_info.worksheets[worksheetIndex].getCells(function(err, cells) {

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

                    if (program.listOnly)
                        newObject.push(val);
                    else
                        newObject[properties[cell[colProp]]] = val;
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
                process.exit(0);
            });

        });
    });
}