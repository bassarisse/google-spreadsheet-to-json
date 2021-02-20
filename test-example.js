const readCredentials = require('./tests/helpers/readCredentials')

async function testExample () {
  const credentials = await readCredentials()
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = credentials.client_email
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = credentials.private_key
  require('./example.js')
}

testExample()
