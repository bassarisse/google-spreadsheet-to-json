var GoogleSpreadsheet = require('google-spreadsheet');
var Promise = require('bluebird');

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWords(phrase) {
    return phrase.replace(/[- ]/ig, ' ').split(' ');
}

function handlePropertyName(cellValue, handleMode) {

    var handleModeType = typeof handleMode;

    if (handleModeType === 'function')
        return handleMode(cellValue);

    var propertyName = (cellValue || '').trim();

    if (handleMode === 'camel' || handleModeType === 'undefined')
        return getWords(propertyName.toLowerCase()).map(function(word, index) {
            return !index ? word : capitalize(word);
        }).join('');

    if (handleMode === 'pascal')
        return getWords(propertyName.toLowerCase()).map(function(word) {
            return capitalize(word);
        }).join('');

    if (handleMode === 'nospace')
        return getWords(propertyName).join('');
    
    return propertyName;
}

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

        properties[cell[colProp]] = handlePropertyName(cell.value, options.propertyMode);

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
            } else if (cell.value !== '' && typeof cell.value !== 'undefined') {
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

        var selectedWorksheet;
        var worksheetIdentifier = options.worksheet;
        if (typeof worksheetIdentifier === 'undefined')
            worksheetIdentifier = 0;

        if (typeof worksheetIdentifier === 'number') {
            selectedWorksheet = sheetInfo.worksheets[worksheetIdentifier];
        } else {
            selectedWorksheet = sheetInfo.worksheets.filter(function(worksheet) {
                return worksheet.title === worksheetIdentifier;
            })[0];
        }

        if (!selectedWorksheet)
            throw new Error("No worksheet found!");

        return Promise.promisifyAll(selectedWorksheet).getCellsAsync();
    })
    .then(function(cells) {

        var finalList = exports.cellsToJson(cells, options);

        if (typeof options.stringify === 'undefined' || options.stringify === true) {
            return JSON.stringify(finalList, null, options.beautify ? 4 : null);
        }

        return finalList;
    });
};
