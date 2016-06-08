var GoogleSpreadsheet = require('google-spreadsheet');
var Promise = require('bluebird');

/**
 * google spreadsheet cells into json
 */
exports.cellsToJson = function(cells, options) {
    
    // setting up some options, such as defining if the data is horizontal or vertical
    options = options || {};

    var rowProp = options.vertical ? 'col' : 'row';
    var colProp = options.vertical ? 'row' : 'col';
    var isHashed = options.hash && !options.listOnly;
    var finalList = isHashed ? {} : [];

    // organizing (and ordering) the cells into arrays

    var rows = cells.reduce(function(rows, cell) {
        var rowIndex = cell[rowProp] - 1;
        if (typeof rows[rowIndex] === 'undefined')
            rows[rowIndex] = [];
        rows[rowIndex].push(cell);
        return rows;
    }, []);

    rows.forEach(function(col) {
        col.sort(function(cell1, cell2) {
            return cell1[colProp] - cell2[colProp];
        });
    });

    // find the first row with data to use it as property names

    for (var firstRowIndex = 0; firstRowIndex < rows.length; firstRowIndex++) {
        if (rows[firstRowIndex])
            break;
    }

    // creating the property names map (to detect the name by index)

    var properties = (rows[firstRowIndex] || []).reduce(function(properties, cell) {
        if (typeof cell.value !== 'string' || cell.value === '')
            return properties;

        properties[cell[colProp]] = cell.value
        .toLowerCase()
        .replace(/[- ]/ig, ' ')
        .split(' ')
        .map(function(val, index) {
            return !index ? val : val.charAt(0).toUpperCase() + val.slice(1);
        })
        .join('');

        return properties;
    }, {});

    // removing first rows, before and including the one that is used as property names

    rows.splice(0, firstRowIndex + 1);

    // iterating through remaining row to fetch the values and build the final data object

    rows.forEach(function(cells) {

        var newObject = options.listOnly ? [] : {};
        var hasValues = false;

        cells.forEach(function(cell) {

            var val;
            var colNumber = cell[colProp];

            if (!options.listOnly && !properties[colNumber])
                return;

            if (typeof cell.numericValue !== 'undefined') {
                val = parseFloat(cell.numericValue);
                hasValues = true;
            } else if (cell.value === 'TRUE') {
                val = true;
                hasValues = true;
            } else if (cell.value === 'FALSE') {
                val = false;
                hasValues = true;
            } else if (cell.value !== '') {
                val = cell.value;
                hasValues = true;
            }

            if (options.listOnly)
                newObject[colNumber - 1] = val;
            else
                newObject[properties[colNumber]] = val;
        });

        if (hasValues) {
            if (isHashed) {
                finalList[newObject[options.hash]] = newObject;
            } else {
                finalList.push(newObject);
            }
        }
    });

    return finalList;
};

exports.spreadsheetToJson = function(options) {
    return Promise.try(function() {

        var spreadsheet = Promise.promisifyAll(new GoogleSpreadsheet(options.spreadsheetId));

        if (options.token) {

            var tokentype = options.tokentype || 'Bearer';

            spreadsheet.setAuthToken({
                value: options.token,
                type: tokentype
            });

        } else if (options.user && options.password) {

            return spreadsheet.setAuthAsync(options.user, options.password).return(spreadsheet);

        }

        return spreadsheet;
    })
    .then(function(spreadsheet) {
        return spreadsheet.getInfoAsync();
    })
    .then(function(sheetInfo) {

        var worksheetIndex = options.worksheet || 0;
        var worksheet = Promise.promisifyAll(sheetInfo.worksheets[worksheetIndex]);

        return worksheet.getCellsAsync();
    })
    .then(function(cells) {

        var finalList = exports.cellsToJson(cells, options);

        if (typeof options.stringify === 'undefined' || options.stringify === true) {
            return JSON.stringify(finalList, null, options.beautify ? 4 : null);
        }

        return finalList;
    });
};
