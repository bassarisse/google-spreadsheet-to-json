var gsjson = require('./index')

gsjson({
    spreadsheetId: 'spreadsheetId',
    token: 'token'
})
.then(function(res) {
    console.log(res)
    console.log(res.length)
})
.catch(function(err) {
    console.log(err.stack)
})
