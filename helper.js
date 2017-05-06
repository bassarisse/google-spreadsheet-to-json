
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
// they are considered a file path
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

function handleIntValue(val) {
    return parseInt(val, 10) || 0
}

// returns a number if the string can be parsed as an integer
function handlePossibleIntValue(val) {
    if (typeof val === 'string' && /^\d+$/.test(val))
        return handleIntValue(val)
    return val
}

function normalizePossibleIntList(option, defaultValue) {
    return normalizeList(option, defaultValue).map(handlePossibleIntValue)
}

// should always return an array
function normalizeList(option, defaultValue) {

    if (typeof option === 'undefined')
        return defaultValue || []

    return Array.isArray(option) ? option : [option]
}

function setPropertyTree(object, tree, value) {

    if (!Array.isArray(tree))
        tree = [tree]

    var prop = tree[0]
    if (!prop)
        return

    object[prop] = tree.length === 1 ? value : (typeof object[prop] === 'object' ? object[prop] : {})

    setPropertyTree(object[prop], tree.slice(1), value)

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

function cellIsValid(cell) {
    return !!cell && typeof cell.value === 'string' && cell.value !== ''
}

// google spreadsheet cells into json
exports.cellsToJson = function(allCells, options) {

    // setting up some options, such as defining if the data is horizontal or vertical
    options = options || {}

    var rowProp = options.vertical ? 'col' : 'row'
    var colProp = options.vertical ? 'row' : 'col'
    var isHashed = options.hash && !options.listOnly
    var includeHeaderAsValue = options.listOnly && options.includeHeader
    var headerStartNumber = options.headerStart ? parseColIdentifier(options.headerStart) : 0
    var headerSize = Math.min(handleIntValue(options.headerSize)) || 1
    var ignoredRows = normalizePossibleIntList(options.ignoreRow)
    var ignoredCols = normalizePossibleIntList(options.ignoreCol).map(parseColIdentifier)
    var ignoredDataNumbers = options.vertical ? ignoredRows : ignoredCols
    ignoredDataNumbers.sort().reverse()

    var maxCol = 0

    // organizing (and ordering) the cells into arrays

    var rows = []

    allCells.forEach(function(cell) {

        if (ignoredRows.indexOf(cell.row) !== -1 || ignoredCols.indexOf(cell.col) !== -1)
            return

        maxCol = Math.max(maxCol, cell[colProp])

        var rowIndex = cell[rowProp] - 1
        if (typeof rows[rowIndex] === 'undefined')
            rows[rowIndex] = []
        rows[rowIndex].push(cell)

    })

    rows.forEach(function(col) {
        col.sort(function(cell1, cell2) {
            return cell1[colProp] - cell2[colProp]
        })
    })

    // find the first row with data (or the specified header start line) to use it as property names

    for (var firstRowIndex = 0; firstRowIndex < rows.length; firstRowIndex++) {
        var cells = rows[firstRowIndex]

        if (!cells)
            continue

        if (headerStartNumber && headerStartNumber !== cells[0][rowProp])
            continue

        break
    }

    var properties

    if (!options.listOnly) {

        // creating the property names map (to detect the name by index),
        // considering the header size

        properties = {}
        var headerEndRowIndex = firstRowIndex + headerSize - 1

        var headerRows = rows.filter(function(row, index) {
            return index >= firstRowIndex && index <= headerEndRowIndex
        }).reverse()

        for (var colNumber = 1; colNumber <= maxCol; colNumber++) {

            var foundFirstCell = false

            var propertyMap = headerRows.map(function (row, index) {

                var headerCell = row.filter(function(cell) {
                    return cell[colProp] === colNumber
                })[0]

                if (!foundFirstCell && cellIsValid(headerCell))
                    foundFirstCell = true

                // the first header cell (from the bottom to top) must be from this column,
                // so we don't check to the left

                else if (foundFirstCell && !cellIsValid(headerCell)) {

                    // finding the nearest filled cell to the left
                    headerCell = row.filter(function(cell) {
                        return cell[colProp] < colNumber
                    }).reverse()[0]

                    if (cellIsValid(headerCell)) {
                        // then we check if the cell found has other filled cells below,
                        // and ignore it if not

                        var hasCellBelow = headerRows.filter(function (r, i) {
                            return i === index - 1
                        }).some(function(r) {
                            return cellIsValid(r.filter(function(cell) {
                                return cell[colProp] === headerCell[colProp]
                            })[0])
                        })

                        if (!hasCellBelow)
                            headerCell = null

                    }
                }

                return headerCell

            }).map(function(cell) {

                if (!cellIsValid(cell))
                    return

                return handlePropertyName(cell.value, options.propertyMode)

            }).filter(function(n) {
                return n
            }).reverse()

            if (propertyMap.length)
                properties[colNumber] = propertyMap

        }

    }

    // removing (or not) the first rows, before and including the ones that is used as header
    if (!includeHeaderAsValue)
        rows.splice(0, firstRowIndex + headerSize)

    // iterating through remaining row to fetch the values and build the final data object

    var finalList = isHashed ? {} : []

    rows.forEach(function(cells) {

        var newObject = options.listOnly ? [] : {}
        var hasValues = false

        cells.forEach(function(cell) {

            var val
            var colNumber = cell[colProp]

            if (properties && !properties[colNumber])
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
                setPropertyTree(newObject, properties[colNumber], val)
            }

        })

        if (hasValues) {

            if (options.listOnly) {
                // this is guaranteed because the list is sorted as needed
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

        var identifiers = normalizePossibleIntList(options.worksheet, [0])

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
