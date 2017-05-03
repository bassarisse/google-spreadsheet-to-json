var GoogleSpreadsheet = require('google-spreadsheet')
var Promise = require('bluebird')

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getWords(phrase) {
    return phrase.replace(/[- ]/ig, ' ').split(' ')
}

function handlePropertyName(cellValue, handleMode) {

    var handleModeType = typeof handleMode

    if (handleModeType === 'function')
        return handleMode(cellValue)

    var propertyName = (cellValue || '').trim()

    if (handleMode === 'camel' || handleModeType === 'undefined')
        return getWords(propertyName.toLowerCase()).map(function(word, index) {
            return !index ? word : capitalize(word)
        }).join('')

    if (handleMode === 'pascal')
        return getWords(propertyName.toLowerCase()).map(function(word) {
            return capitalize(word)
        }).join('')

    if (handleMode === 'nospace')
        return getWords(propertyName).join('')

    return propertyName
}

function normalizeWorksheetIdentifiers(option) {

    if (typeof option === 'undefined')
        return [0]

    if (!Array.isArray(option))
        return [option]

    return option
}

/**
 * google spreadsheet cells into json
 */
exports.cellsToJson = function(cells, options) {

    // setting up some options, such as defining if the data is horizontal or vertical
    options = options || {}

    var rowProp = options.vertical ? 'col' : 'row'
    var colProp = options.vertical ? 'row' : 'col'
    var isHashed = options.hash && !options.listOnly
    var includeHeaderAsValue = options.listOnly && options.includeHeader
    var finalList = isHashed ? {} : []

    // organizing (and ordering) the cells into arrays

    var rows = cells.reduce(function(rows, cell) {
        var rowIndex = cell[rowProp] - 1
        if (typeof rows[rowIndex] === 'undefined')
            rows[rowIndex] = []
        rows[rowIndex].push(cell)
        return rows
    }, [])

    rows.forEach(function(col) {
        col.sort(function(cell1, cell2) {
            return cell1[colProp] - cell2[colProp]
        })
    })

    // find the first row with data to use it as property names

    for (var firstRowIndex = 0; firstRowIndex < rows.length; firstRowIndex++) {
        if (rows[firstRowIndex])
            break
    }

    // creating the property names map (to detect the name by index)

    var properties = (rows[firstRowIndex] || []).reduce(function(properties, cell) {
        if (typeof cell.value !== 'string' || cell.value === '')
            return properties

        properties[cell[colProp]] = handlePropertyName(cell.value, options.propertyMode)

        return properties
    }, {})

    // removing first rows, before and including (or not) the one that is used as property names

    rows.splice(0, firstRowIndex + (includeHeaderAsValue ? 0 : 1))

    // iterating through remaining row to fetch the values and build the final data object

    rows.forEach(function(cells) {

        var newObject = options.listOnly ? [] : {}
        var hasValues = false

        cells.forEach(function(cell) {

            var val
            var colNumber = cell[colProp]

            if (!options.listOnly && !properties[colNumber])
                return

            if (typeof cell.numericValue !== 'undefined') {
                val = parseFloat(cell.numericValue)
                hasValues = true
            } else if (cell.value === 'TRUE') {
                val = true
                hasValues = true
            } else if (cell.value === 'FALSE') {
                val = false
                hasValues = true
            } else if (cell.value !== '' && typeof cell.value !== 'undefined') {
                val = cell.value
                hasValues = true
            }

            if (options.listOnly)
                newObject[colNumber - 1] = val
            else
                newObject[properties[colNumber]] = val
        })

        if (hasValues) {
            if (isHashed) {
                finalList[newObject[options.hash]] = newObject
            } else {
                finalList.push(newObject)
            }
        }
    })

    return finalList
}

exports.getWorksheets = function(options) {
    return Promise.try(function() {

        var spreadsheet = Promise.promisifyAll(new GoogleSpreadsheet(options.spreadsheetId))

        if (options.token) {

            spreadsheet.setAuthToken({
                value: options.token,
                type: options.tokentype || 'Bearer'
            })

        }

        return spreadsheet
    })
    .then(function(spreadsheet) {
        return spreadsheet.getInfoAsync()
    })
    .then(function(sheetInfo) {
        return sheetInfo.worksheets.map(function(worksheet) {
            return Promise.promisifyAll(worksheet)
        })
    })
}

exports.spreadsheetToJson = function(options) {
    return exports.getWorksheets(options)
    .then(function(worksheets) {

        var identifiers = normalizeWorksheetIdentifiers(options.worksheet)

        var selectedWorksheets = worksheets.filter(function(worksheet, index) {
            return identifiers.indexOf(index) !== -1 || identifiers.indexOf(worksheet.title) !== -1
        })

        // if an array is not passed here, expects only first result
        if (!Array.isArray(options.worksheet)) {
            selectedWorksheets = selectedWorksheets.slice(0, 1)
            if (selectedWorksheets.length === 0)
                throw new Error('No worksheet found!')
        }

        return selectedWorksheets
    })
    .then(function(worksheets) {
        return Promise.all(worksheets.map(function(worksheet) {
            return worksheet.getCellsAsync()
        }))
    })
    .then(function(results) {

        var finalList = results.map(function(cells) {
            return exports.cellsToJson(cells, options)
        })

        if (Array.isArray(options.worksheet))
            return finalList
        else
            return finalList[0]
    })
}
