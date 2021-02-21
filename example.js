const gsjson = require('./')

const credentials = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
}

async function example () {
  try {
    const result = await gsjson({
      spreadsheetId: 'abc123456789',
      credentials
      // other options...
    })
    console.log(result.length)
    console.log(result)
  } catch (ex) {
    console.log(ex.message)
    console.log(ex.stack)
  }
}

example()
