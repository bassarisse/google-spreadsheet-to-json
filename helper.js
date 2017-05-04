
var fs = require('fs')
var GoogleSpreadsheet = require('google-spreadsheet')
var Promise = require('bluebird')

// constants used for converting column names into number/index
var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
var ALPHABET_BASE = ALPHABET.length

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getWords(phrase) {
    return phrase.replace(/[- ]/ig, ' ').split(' ')
}

// Service Account credentials are first parsed as JSON and, in case this fails,
// they are required literally, as a file path
function parseServiceAccountCredentials(credentials) {

    if (typeof credentials === 'string') {
        try {
            return JSON.parse(credentials)
        } catch(ex) {
            return JSON.parse(fs.readFileSync(credentials, 'utf8'))
        }
    }

    return credentials
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

// should always return an array
function normalizeWorksheetIdentifiers(option) {

    if (typeof option === 'undefined')
        return [0]

    return Array.isArray(option) ? option : [option]
}

// should always return an array
function normalizeList(option) {

    if (typeof option === 'undefined')
        return []

    return Array.isArray(option) ? option : [option]
}

function parseColIdentifier(col) {

    var colType = typeof col

    if (colType === 'string') {
        return col.trim().replace(/[ \.]/i, '').toLowerCase().split('').reverse().reduce(function(totalValue, letter, index) {

            var alphaIndex = ALPHABET.indexOf(letter)

            if (alphaIndex === -1)
                throw new Error('Column identifier format is invalid')

            var value = alphaIndex + 1

            return totalValue + value * Math.pow(ALPHABET_BASE, index)
        }, 0)
    }

    if (colType !== 'number')
        throw new Error('Column identifier value type is invalid')

    return col
}

// google spreadsheet cells into json
exports.cellsToJson = function(allCells, options) {

    // setting up some options, such as defining if the data is horizontal or vertical
    options = options || {}

    var rowProp = options.vertical ? 'col' : 'row'
    var colProp = options.vertical ? 'row' : 'col'
    var isHashed = options.hash && !options.listOnly
    var includeHeaderAsValue = options.listOnly && options.includeHeader
    var finalList = isHashed ? {} : []
    var ignoredRows = normalizeList(options.ignoreRow)
    var ignoredCols = normalizeList(options.ignoreCol).map(parseColIdentifier)
    var ignoredDataNumbers = options.vertical ? ignoredRows : ignoredCols

    // organizing (and ordering) the cells into arrays

    var rows = allCells.reduce(function(rows, cell) {

        if (ignoredRows.indexOf(cell.row) !== -1 || ignoredCols.indexOf(cell.col) !== -1)
            return rows

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

    if (!includeHeaderAsValue)
        rows.splice(0, firstRowIndex + 1)

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

            if (options.listOnly) {
                newObject[colNumber - 1] = val
            } else {
                newObject[properties[colNumber]] = val
            }

        })

        if (hasValues) {

            if (options.listOnly) {
                ignoredDataNumbers.forEach(function(number) {
                    newObject.splice(number - 1, 1)
                })
            }

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

        if (options.credentials)
            return spreadsheet.useServiceAccountAuthAsync(parseServiceAccountCredentials(options.credentials)).return(spreadsheet)

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

    var allWorksheets = !!options.allWorksheets
    var expectMultipleWorksheets = allWorksheets || Array.isArray(options.worksheet)

    return exports.getWorksheets(options)
    .then(function(worksheets) {

        if (allWorksheets)
            return worksheets

        var identifiers = normalizeWorksheetIdentifiers(options.worksheet)

        var selectedWorksheets = worksheets.filter(function(worksheet, index) {
            return identifiers.indexOf(index) !== -1 || identifiers.indexOf(worksheet.title) !== -1
        })

        if (!expectMultipleWorksheets)
            selectedWorksheets = selectedWorksheets.slice(0, 1)

        if (selectedWorksheets.length === 0)
            throw new Error('No worksheet found!')

        return selectedWorksheets
    })
    .then(function(worksheets) {
        return Promise.all(worksheets.map(function(worksheet) {
            return worksheet.getCellsAsync()
        }))
    })
    .then(function(results) {

        var finalList = results.map(function(allCells) {
            return exports.cellsToJson(allCells, options)
        })

        return expectMultipleWorksheets ? finalList : finalList[0]
    })
}
