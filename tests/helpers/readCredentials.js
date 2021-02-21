const asyncFs = require('fs').promises
const logPrefix = '[google-spreadsheet-to-json readCredentials]'

async function getRawCredentialsFromFileSystem (filepath) {
  const credentialsFilePath = filepath || 'secure-credentials.json'
  let rawCredentialsFile
  try {
    rawCredentialsFile = await asyncFs.readFile(credentialsFilePath)
  } catch (ex) {
    console.warn(logPrefix, 'Unable to find/read secure credentials file:', credentialsFilePath, 'Exception:', ex.message)
  }
  return rawCredentialsFile
}

function getRawCredentialsFromEnvironment () {
  return process.env.GOOGLE_SERVICE_ACCOUNT_SECURE_CREDENTIALS
}

function parseCredentials (rawCredentials) {
  let credentials
  try {
    credentials = JSON.parse(rawCredentials)
  } catch (ex) {
    console.warn(logPrefix, 'Unable to parse raw credentials from', (rawCredentials || '').length, 'bytes; Exception:', ex.message)
  }
  return credentials || { error: 'Unable to parse credentials', rawInputLengthBytes: (rawCredentials || '').length }
}

function validateCredentials (credentials, logger) {
  const expectedKeys = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri', 'auth_provider_x509_cert_url', 'client_x509_cert_url']
  try {
    const keys = Object.keys(credentials)
    const missingKeys = expectedKeys.filter(key => !keys.includes(key))
    if (missingKeys.length) {
      logger(logPrefix, 'Expected keys not found in credentials:', missingKeys)
    }
    const unexpectedKeys = keys.filter(key => !expectedKeys.includes(key))
    if (unexpectedKeys.length) {
      logger(logPrefix, 'Unexpected keys found in credentials:', unexpectedKeys)
    }
  } catch (ex) {
    logger(logPrefix, 'Unable to analyse credentials - type:', typeof credentials, 'expected: Object', ex.message)
  }
}

async function getCredentials (filepath = false) {
  const environmentCredentials = getRawCredentialsFromEnvironment()
  let rawCredentials

  // switch priority based on input
  if (filepath) {
    rawCredentials = await getRawCredentialsFromFileSystem(filepath) || environmentCredentials
  } else {
    rawCredentials = environmentCredentials || await getRawCredentialsFromFileSystem(filepath)
  }

  const credentials = parseCredentials(rawCredentials)

  validateCredentials(credentials, console.warn)

  return credentials
}

module.exports = getCredentials
