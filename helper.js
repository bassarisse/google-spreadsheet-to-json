var GoogleSpreadsheet = require('google-spreadsheet');

/**
 * google spreadsheet cells into json
 */
exports.cellsToJson = function(cells, options) {
    // setting up some options, such as defining if the data is horizontal or vertical
    options = options || {}

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
}

exports.spreadsheetToJson = function(options) {
    return new Promise(function(resolve, reject) {

        var worksheetIndex = options.worksheet || 0;
        var spreadsheetId = options.spreadsheetId;

        var spreadsheet = new GoogleSpreadsheet(spreadsheetId);

        if (options.token) {
            var tokentype = options.tokentype || 'Bearer';
            spreadsheet.setAuthToken({
                value: options.token,
                type: tokentype
            });
        } else if (options.user && options.password) {
            spreadsheet.setAuth(options.user, options.password, function(err) {
                if (err) {
                    return reject(err)
                }
            });
        }

        spreadsheet.getInfo(function(err, sheet_info) {
            if (err) {
                return reject(err)
            }

            sheet_info.worksheets[worksheetIndex].getCells(function(err, cells) {
                if (err) {
                    return reject(err)
                }

                var finalList = exports.cellsToJson(cells, options)
                if (options.stringify === undefined || options.stringify === true) {
                    finalList = JSON.stringify(finalList, null, options.beautify ? 4 : null)
                }
                return resolve(finalList)
            });
        });
    })
}
