const { expect } = require('chai')
const gsjson = require('../../')
const readCredentials = require('../helpers/readCredentials')

const longRunningTestTimeoutInMs = 10000
const spreadsheetId = '1G2_YLuQeKXCtpOWshqIBazzUeefuOMDZ5q10F2u9MHw'
const EMPTY_WORKSHEET = []

describe('Film Spreadsheet to JSON using Private Auth Credentials', () => {
  let credentials
  before(async () => {
    credentials = await readCredentials()
  })

  it('should request data from a live spreadsheet, and convert to JSON', async () => {
    const json = await gsjson({
      spreadsheetId,
      credentials
    })
    expect(json).to.deep.equal([{
      name: 'Forrest Gump',
      year: 1994
    }, {
      name: 'Matrix',
      year: 1999
    }])
  }).timeout(longRunningTestTimeoutInMs)

  it('should request multiple pages of data from a live spreadsheet, and convert to JSON', async () => {
    const json = await gsjson({
      spreadsheetId,
      credentials,
      allWorksheets: true
    })
    expect(json).to.deep.equal([[{
      name: 'Forrest Gump',
      year: 1994
    }, {
      name: 'Matrix',
      year: 1999
    }], EMPTY_WORKSHEET, [{
      name: 'Red',
      hex: '#FF0000',
      rgb: '255,0,0'
    }, {
      name: 'Green',
      hex: '#00FF00',
      rgb: '0,255,0'
    }, {
      name: 'Blue',
      hex: '#0000FF',
      rgb: '0,0,255'
    }]])
  }).timeout(longRunningTestTimeoutInMs)
})
