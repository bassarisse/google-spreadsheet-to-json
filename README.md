google-spreadsheet-to-json
==========================

[![NPM version](https://badge.fury.io/js/google-spreadsheet-to-json.png)](http://badge.fury.io/js/google-spreadsheet-to-json)

A simple Node.js command-line tool to export Google Spreadsheets to JSON files.


## Installation

```
npm install -g google-spreadsheet-to-json
```


## Help

```
> gsjson --help

  Usage: gsjson <spreadsheet-id> <file> [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -u, --user [user]          User to login
    -p, --password [password]  Password to login
    -w, --worksheet <n>        Worksheet index
    -c, --hash [column]        Column to hash the final JSON
    -i, --vertical             Use the first column as header
    -l, --list-only            Ignore headers and just list the values in arrays
    -b, --beautify             Beautify final JSON
```


## Usage - Public Spreadsheets

```
gsjson abc123456789 data.json
```


## Usage - Private Spreadsheets

```
gsjson abc123456789 data.json -u username -p password
```


## Note

A spreadsheet ID can be extracted from its URL.


## License
google-spreadsheet-to-json is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.