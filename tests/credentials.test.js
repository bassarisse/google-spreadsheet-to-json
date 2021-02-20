const { expect } = require('chai')
const readCredentials = require('./helpers/readCredentials')
const expectedKeys = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri', 'auth_provider_x509_cert_url', 'client_x509_cert_url']

describe('Read Credentials', () => {
  let warn, warnings
  beforeEach(() => {
    warn = console.warn
    warnings = []
    console.warn = (...messages) => {
      warnings.push(messages)
    }
  })

  afterEach(() => {
    console.warn = warn
  })

  describe('From local file', () => {
    it('should read credentials from the local system', async () => {
      const actual = await readCredentials('secure-credentials-example.json')
      const actualKeys = Object.keys(actual)
      expect(actualKeys).to.deep.equal(expectedKeys)
      expect(warnings).to.deep.equal([])
    })
  })

  describe('From environment variable', () => {
    before(() => {
      process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS = '{ "project_id": "project id for unit test", "private_key": "<private key string long>" }'
    })

    it('should read credentials from local environment variables', async () => {
      const actual = await readCredentials()
      expect(actual).to.deep.equal({
        project_id: 'project id for unit test',
        private_key: '<private key string long>'
      })
    })

    after(() => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS
    })
  })

  describe('Basic validation on loaded key', () => {
    it('should log a warning if the parsed credential does not have expected keys', async () => {
      process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS = '{}'
      await readCredentials()
      expect(warnings).to.deep.equal([[
        '[google-spreadsheet-to-json readCredentials]',
        'Expected keys not found in credentials:',
        expectedKeys
      ]])
    })

    it('should log a warning if the parsed credential has unexpected keys', async () => {
      process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS = '{ "unexpected_key": "checking for keys in parsed json" }'
      await readCredentials()
      expect(warnings).to.deep.equal([[
        '[google-spreadsheet-to-json readCredentials]',
        'Expected keys not found in credentials:',
        expectedKeys
      ], [
        '[google-spreadsheet-to-json readCredentials]',
        'Unexpected keys found in credentials:',
        ['unexpected_key']
      ]])
    })

    after(() => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS
    })
  })
})
