const fs = require('fs')
const { GoogleSpreadsheet } = require('google-spreadsheet')

// constants used for converting column names into number/index
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const ALPHABET_BASE = ALPHABET.length
const NOT_FOUND = -1

function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getWords (phrase) {
  return phrase.replace(/[- ]/ig, ' ').split(' ')
}

// Service Account credentials are first parsed as JSON and, in case this fails,
// they are considered a file path
function parseServiceAccountCredentials (credentials) {
  if (typeof credentials === 'string') {
    try {
      return JSON.parse(credentials)
    } catch (ex) {
      return JSON.parse(fs.readFileSync(credentials, 'utf8'))
    }
  }
  return credentials || {}
}

function handlePropertyName (cellValue, handleMode) {
  const handleModeType = typeof handleMode

  if (handleModeType === 'function') { return handleMode(cellValue) }

  const propertyName = (cellValue + '').trim()

  if (handleMode === 'camel' || handleModeType === 'undefined') {
    return getWords(propertyName.toLowerCase()).map(function (word, index) {
      return !index ? word : capitalize(word)
    }).join('')
  }

  if (handleMode === 'pascal') {
    return getWords(propertyName.toLowerCase()).map(function (word) {
      return capitalize(word)
    }).join('')
  }

  if (handleMode === 'nospace') { return getWords(propertyName).join('') }

  return propertyName
}

function handleIntValue (val) {
  return parseInt(val, 10) || 0
}

// returns a number if the string can be parsed as an integer
function handlePossibleIntValue (val) {
  if (typeof val === 'string' && /^\d+$/.test(val)) { return handleIntValue(val) }
  return val
}

function normalizePossibleIntList (option, defaultValue) {
  return normalizeList(option, defaultValue).map(handlePossibleIntValue)
}

// should always return an array
function normalizeList (option, defaultValue) {
  if (typeof option === 'undefined') { return defaultValue || [] }

  return Array.isArray(option) ? option : [option]
}

function setPropertyTree (object, tree, value) {
  if (!Array.isArray(tree)) { tree = [tree] }

  const prop = tree[0]
  if (!prop) { return }

  object[prop] = tree.length === 1 ? value : (typeof object[prop] === 'object' ? object[prop] : {})

  setPropertyTree(object[prop], tree.slice(1), value)
}

function parseColIdentifier (col) {
  const colType = typeof col

  if (colType === 'string') {
    return col.trim().replace(/[ .]/i, '').toLowerCase().split('').reverse().reduce(function (totalValue, letter, index) {
      const alphaIndex = ALPHABET.indexOf(letter)

      if (alphaIndex === NOT_FOUND) { throw new Error('Column identifier format is invalid') }

      const value = alphaIndex + 1

      return totalValue + value * Math.pow(ALPHABET_BASE, index)
    }, 0)
  }

  if (colType !== 'number') { throw new Error('Column identifier value type is invalid') }

  return col
}

function cellHasValue (cell) {
  return cell && cell.value
}

// google spreadsheet cells into json
function cellsToJson (allCells, options) {
  // setting up some options, such as defining if the data is horizontal or vertical
  options = options || {}

  const rowProp = options.vertical ? 'columnIndex' : 'rowIndex'
  const colProp = options.vertical ? 'rowIndex' : 'columnIndex'
  const isHashed = options.hash && !options.listOnly
  const includeHeaderAsValue = options.listOnly && options.includeHeader
  const headerStartNumber = options.headerStart ? parseColIdentifier(options.headerStart) : 0
  const headerSize = Math.min(handleIntValue(options.headerSize)) || 1
  const ignoredRows = normalizePossibleIntList(options.ignoreRow)
  const ignoredCols = normalizePossibleIntList(options.ignoreCol).map(parseColIdentifier)
  const ignoredDataNumbers = options.vertical ? ignoredRows : ignoredCols
  ignoredDataNumbers.sort().reverse()

  let maxCol = 0

  // organizing (and ordering) the cells into arrays

  const rows = []
  const cellsWithValues = allCells.filter(cellHasValue)
  cellsWithValues.forEach(function (cell) {
    if (ignoredRows.indexOf(cell.rowIndex) !== NOT_FOUND || ignoredCols.indexOf(cell.columnIndex) !== NOT_FOUND) { return }

    maxCol = Math.max(maxCol, cell[colProp])

    const rowIndex = cell[rowProp]
    if (typeof rows[rowIndex] === 'undefined') { rows[rowIndex] = [] }
    rows[rowIndex].push(cell)
  })

  rows.forEach(function (col) {
    col.sort(function (cell1, cell2) {
      return cell1[colProp] - cell2[colProp]
    })
  })

  // find the first row with data (or the specified header start line) to use it as property names

  let firstRowIndex
  for (firstRowIndex = 0; firstRowIndex < rows.length; firstRowIndex++) {
    const cells = rows[firstRowIndex]

    if (!cells) { continue }

    if (headerStartNumber && headerStartNumber !== cells[0][rowProp]) { continue }

    break
  }

  let properties

  if (!options.listOnly) {
    // creating the property names map (to detect the name by index),
    // considering the header size

    properties = {}
    const headerEndRowIndex = firstRowIndex + headerSize - 1

    const headerRows = rows.filter(function (row, index) {
      return index >= firstRowIndex && index <= headerEndRowIndex
    }).reverse()

    for (let colNumber = 0; colNumber <= maxCol; colNumber++) {
      let foundFirstCell = false

      const propertyMap = headerRows.map(function (row, index) {
        let headerCell = row.filter(function (cell) {
          return cell[colProp] === colNumber
        })[0]

        // the first header cell (from the bottom to top) must be from this column,
        // so we don't check to the left
        const isCellValid = cellHasValue(headerCell)
        if (!foundFirstCell && isCellValid) {
          foundFirstCell = true
        } else if (foundFirstCell && !isCellValid) {
          // finding the nearest filled cell to the left
          headerCell = row.filter(function (cell) {
            return cell[colProp] < colNumber
          }).reverse()[0]

          if (isCellValid) {
            // then we check if the cell found has other filled cells below,
            // and ignore it if not

            const hasCellBelow = headerRows.filter(function (r, i) {
              return i === index - 1
            }).some(function (r) {
              return cellHasValue(r.filter(function (cell) {
                return cell[colProp] === headerCell[colProp]
              })[0])
            })

            if (!hasCellBelow) { headerCell = null }
          }
        }

        return headerCell
      }).map(function (cell) {
        const isCellValid = cellHasValue(cell)
        return isCellValid ? handlePropertyName(cell.value, options.propertyMode) : false
      }).filter(n => n).reverse()

      if (propertyMap.length) { properties[colNumber] = propertyMap }
    }
  }

  // removing (or not) the first rows, before and including the ones that is used as header
  if (!includeHeaderAsValue) { rows.splice(0, firstRowIndex + headerSize) }

  // iterating through remaining row to fetch the values and build the final data object

  const finalList = isHashed ? {} : []

  rows.forEach(function (cells) {
    const newObject = options.listOnly ? [] : {}
    let hasValues = false

    cells.forEach(function (cell) {
      let val
      const colNumber = cell[colProp]

      if (properties && !properties[colNumber]) { return }

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
        ignoredDataNumbers.forEach(function (number) {
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

async function setupSpreadsheet ({ spreadsheetId, credentials, apiKey }) {
  const doc = new GoogleSpreadsheet(spreadsheetId)
  const parsedCredentials = parseServiceAccountCredentials(credentials)

  if (parsedCredentials.client_email && parsedCredentials.private_key) {
    await doc.useServiceAccountAuth(parsedCredentials)
  }

  if (apiKey) {
    doc.useApiKey(apiKey)
  }

  /* Future goal: Add OAuth client mechanism as documented
   * https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=oauth
   */

  return doc
}

async function getWorksheets (options) {
  const { spreadsheetId, credentials } = options
  let spreadsheet
  try {
    spreadsheet = await setupSpreadsheet({ spreadsheetId, credentials })
    await spreadsheet.loadInfo()
  } catch (ex) {
    console.error('Unable to setup spreadsheet:', ex.message, 'using options:', Object.keys(options || {}))
  }

  return spreadsheet.sheetsByIndex || []
}

function selectWorksheetsBasedOn (worksheets, options) {
  const { worksheet } = options
  const allWorksheets = !!options.allWorksheets
  const expectMultipleWorksheets = allWorksheets || Array.isArray(worksheet)
  const identifiers = normalizePossibleIntList(options.worksheet, [0])

  if (allWorksheets) {
    return worksheets
  }

  let selectedWorksheets = worksheets.filter((worksheet, index) => {
    return identifiers.indexOf(index) !== NOT_FOUND || identifiers.indexOf(worksheet.title) !== NOT_FOUND
  })

  if (!expectMultipleWorksheets) {
    selectedWorksheets = selectedWorksheets.slice(0, 1)
  }

  if (selectedWorksheets.length === 0) {
    throw new Error('[google-spreadsheet-to-json] [helper.js] No worksheet found!')
  }

  return selectedWorksheets
}

async function spreadsheetToJson (options) {
  const worksheets = await getWorksheets(options)

  const selectedWorksheets = selectWorksheetsBasedOn(worksheets, options)

  const worksheetsMappedToCells = await Promise.all(selectedWorksheets.map(getAllCells))
  const worksheetsMappedToJson = worksheetsMappedToCells.map(cells => {
    return cellsToJson(cells, options)
  })

  const { worksheet } = options
  const allWorksheets = !!options.allWorksheets
  const expectMultipleWorksheets = allWorksheets || Array.isArray(worksheet)
  return expectMultipleWorksheets ? worksheetsMappedToJson : worksheetsMappedToJson[0]
}

async function getAllCells (worksheet) {
  const cells = []
  try {
    await worksheet.loadCells()
    let j = 0
    while (j < worksheet.rowCount) {
      let i = 0
      while (i < worksheet.columnCount) {
        cells.push(worksheet.getCell(j, i))
        i++
      }
      j++
    }
  } catch (ex) {
    if (ex.message === 'Cannot read property \'rowCount\' of undefined') {
      // skip worksheet - does not contain cells
    } else {
      const { title, index } = (worksheet || {})._rawProperties
      console.warn('Get all cells failed for worksheet:', { title, index }, 'Error:', ex.message)
    }
  }
  return cells
}

module.exports = {
  getWorksheets,
  spreadsheetToJson,
  cellsToJson
}
