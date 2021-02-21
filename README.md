google-spreadsheet-to-json
==========================

** 2020-02-20 : This fork of `bassarisse/google-spreadsheet-to-json` project adds more tests; implements against the Google v4 API using the latest version of `theoephraim/node-google-spreadsheet` and Service Account credentials. **

Please raise an issue or suggestions on the original repo and tag me @johnbeech you see space for improvements - like missing tests or broken functionality.

## Description

A simple tool to export Google Spreadsheets to JSON files. Can be used though Node API or CLI.

## Installation

Command-line:
```
$ npm install -g google-spreadsheet-to-json
```

Node API:
```
$ npm install --save google-spreadsheet-to-json
```

## Help

```
$ gsjson --help

Usage: gsjson <spreadsheet-id> [file] [options]

Options:

  -h, --help                   output usage information
  -V, --version                output the version number
  -b, --beautify               Beautify final JSON
  -s, --credentials <s>        Service Account credentials JSON data or file path
  -t, --token <token>          Auth token acquired externally
  -y, --tokentype <tokentype>  Type of the informed token (defaults to "Bearer")
  -w, --worksheet <n>          Worksheet index (zero-based) or title (defaults to first worksheet, can be repeated)
  -a, --all-worksheets         Return all worksheets (worksheet option is ignored)
  -c, --hash <column>          Column to hash the final object
  -m, --property-mode <mode>   How to handle property names: "camel" (default), "pascal", "nospace" or "none"
  -i, --vertical               Use the first column as header
  -l, --list-only              Just list the values in arrays
  -0, --include-header         Include header when using "list-only" option
  --header-start <n>           Header start line (auto-detected by default)
  --header-size <n>            Header lines quantity (defaults to 1)
  --ignore-col <n>             Column name (Excel-like labels) to be ignored (can be repeated, number are also supported)
  --ignore-row <n>             Row number to be ignored (can be repeated)
```


## Usage (CLI)

Public spreadsheets:
```
$ gsjson abc123456789 data.json
```

Private spreadsheets:
```
$ gsjson abc123456789 data.json -s creds.json
$ gsjson abc123456789 data.json -t authtoken
```

You can also redirect the output if you omit the filename:
```
$ gsjson abc123456789 >> data.json
```

## Usage (Node API)

With the exception of `beautify` and the file path, the same options from the CLI applies here (options like `include-header` becomes `includeHeader`).

```javascript
const gsjson = require('google-spreadsheet-to-json');

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
```

### Notes

- A spreadsheet ID can be extracted from its URL - for example `https://docs.google.com/spreadsheets/d/1G2_YLuQeKXCtpOWshqIBazzUeefuOMDZ5q10F2u9MHw/edit#gid=0` becomes `1G2_YLuQeKXCtpOWshqIBazzUeefuOMDZ5q10F2u9MHw`
- If an array is passed on the `worksheet` option (in CLI, this can be done by repeating the argument) or the `allWorksheets` option is used, the output from each worksheet is returned inside an array; however the order is not guaranteed.

## About authentication

Since Google enforces OAuth 2.0, this module offers arguments for Service Account JSON credentials or an auth token.

The `credentials` option can receive a file path, the JSON data (string) or an object (on Node API).

For quick tests, there's a method to acquire a temporary token:
- Access Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
- Enter the scope: https://spreadsheets.google.com/feeds/
- Authorize and retrieve your access token

For more detailed information regarding auth methods: https://github.com/theoephraim/node-google-spreadsheet

## Known issues

- Public spreadsheets are not currently supported - although there is a way to access raw JSON from a spreadsheet which could be supported in future: `https://spreadsheets.google.com/feeds/cells/1G2_YLuQeKXCtpOWshqIBazzUeefuOMDZ5q10F2u9MHw/1/public/full?alt=json` - this works if the option "File > Publish to the web" is used in the Google Spreadsheets GUI, even if the spreadsheet is visible to everyone. This problem won't occur when authenticated.

## Examples

See [EXAMPLES.md](./EXAMPLES.md)

## Change Log

See [CHANGELOG.md](./CHANGELOG.md)

## TO-DO

- Improve options documentation (especially header size)
- Create more test cases

## License
google-spreadsheet-to-json is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.


## Contributors

- @bassarisse Bruno Assarisse
- @cigolpl Mateusz
- @johnbeech John Beech (Connected Web)
