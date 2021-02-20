const { expect } = require('chai')
const gsjson = require('../../')
const readCredentials = require('../helpers/readCredentials')

const longRunningTestTimeoutInMs = 10000
const spreadsheetId = '1G2_YLuQeKXCtpOWshqIBazzUeefuOMDZ5q10F2u9MHw'

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
})
