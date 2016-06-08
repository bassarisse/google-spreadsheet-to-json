var helper = require('./helper')
module.exports = function(options) {
    options.stringify = false
    return helper.spreadsheetToJson(options)
}
