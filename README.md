google-spreadsheet-to-json
==========================

[![NPM version](https://badge.fury.io/js/google-spreadsheet-to-json.png)](http://badge.fury.io/js/google-spreadsheet-to-json)

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

With the exception of `beautify`, the same options from the CLI applies here (options like `include-header` becomes `includeHeader`).

```javascript
var gsjson = require('google-spreadsheet-to-json');

gsjson({
    spreadsheetId: 'abc123456789',
    // other options...
})
.then(function(result) {
    console.log(result.length);
    console.log(result);
})
.catch(function(err) {
    console.log(err.message);
    console.log(err.stack);
});
```


### Notes

- A spreadsheet ID can be extracted from its URL.
- If an array is passed on the `worksheet` option (in CLI, this can be done by repeating the argument) or the `allWorksheets` option is used, the output from each worksheet is returned inside an array (the order is not guaranteed).


## About authentication

Since Google enforces OAuth 2.0, this module offers arguments for Service Account JSON credentials or an auth token.

The `credentials` option can receive a file path, the JSON data (string) or an object (on Node API).

For quick tests, there's a method to acquire a temporary token:
- Access Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
- Enter the scope: https://spreadsheets.google.com/feeds/
- Authorize and retrieve your access token

For more detailed information regarding auth methods: https://github.com/theoephraim/node-google-spreadsheet


## Known issues

- Public spreadsheets can only be used without authentication if the option "File > Publish to the web" is used in the Google Spreadsheets GUI, even if the spreadsheet is visible to everyone. This problem won't occur when authenticated.


## Example 1 (array of objects):

|Id |Name |Age |Newsletter |
|---|-----|----|-----------|
|1|Joisse Wendell|25|TRUE|
|2|Brand Katelin|16|FALSE|
|3|Gloriana Goldie||TRUE|

Command-line:
```
$ gsjson abc123456789 data.json -b
```

Node API:
```javascript
gsjson({
    spreadsheetId: 'abc123456789'
})
```

Output:
```json
[
    {
        "id": 1,
        "name": "Joisse Wendell",
        "age": 25,
        "newsletter": true
    },
    {
        "id": 2,
        "name": "Brand Katelin",
        "age": 16,
        "newsletter": false
    },
    {
        "id": 3,
        "name": "Gloriana Goldie",
        "newsletter": true
    }
]
```


## Example 2 (hashed object, with pascal case properties):

|id |first name |last name |age |newsletter |
|---|-----------|----------|----|-----------|
|1|Joisse|Wendell|25|TRUE|
|2|Brand|Katelin|16|FALSE|
|3|Gloriana|Goldie||TRUE|

Command-line:
```
$ gsjson abc123456789 data.json -b -c id -m pascal
```

Node API:
```javascript
gsjson({
    spreadsheetId: 'abc123456789',
    hash: 'id',
    propertyMode: 'pascal'
})
```

Output:
```json
{
    "1": {
        "Id": 1,
        "FirstName": "Joisse",
        "LastName": "Wendell",
        "Age": 25,
        "Newsletter": true
    },
    "2": {
        "Id": 2,
        "FirstName": "Brand",
        "LastName": "Katelin",
        "Age": 16,
        "Newsletter": false
    },
    "3": {
        "Id": 3,
        "FirstName": "Gloriana",
        "LastName": "Goldie",
        "Newsletter": true
    }
}
```


## Example 3 (list of values, selecting the second worksheet):

|Id |Name |Age |Newsletter |
|---|-----|----|-----------|
|1|Joisse Wendell|25|TRUE|
|2|Brand Katelin|16|FALSE|
|3|Gloriana Goldie||TRUE|

Command-line:
```
$ gsjson abc123456789 data.json -b -l -w 1
```

Node API:
```javascript
gsjson({
    spreadsheetId: 'abc123456789',
    listOnly: true,
    worksheet: 1
})
```

Output:
```json
[
    [
        1,
        "Joisse Wendell",
        25,
        true
    ],
    [
        2,
        "Brand Katelin",
        16,
        false
    ],
    [
        3,
        "Gloriana Goldie",
        null,
        true
    ]
]
```


## Example 4 (selecting multiple worksheets by title):

|Id |Name |Dead |
|---|-----|-----|
|1|Jon Snow|FALSE|
|2|Hodor|FALSE|

|Id |Saint |Main Attack |
|---|------|------------|
|1|Seiya|Pegasus Ryu Sei Ken|
|2|Ikki|Hoyoku Tensho|

Command-line:
```
$ gsjson abc123456789 data.json -b -w "Game Of Thrones" -w "Saint Seiya"
```

Node API:
```javascript
gsjson({
    spreadsheetId: 'abc123456789',
    worksheet: ['Game Of Thrones', 'Saint Seiya']
})
```

Output:
```json
[
    [
        {
            "id": 1,
            "name": "Jon Snow",
            "dead": false
        },
        {
            "id": 2,
            "name": "Hodor",
            "dead": false
        }
    ],
    [
        {
            "id": 1,
            "saint": "Seiya",
            "mainAttack": "Pegasus Ryu Sei Ken"
        },
        {
            "id": 2,
            "saint": "Ikki",
            "mainAttack": "Hoyoku Tensho"
        }
    ]
]
```


## Example 5 (vertical data, without beautifying):

|Id |1  |2  |3  |
|---|---|---|---|
|Name|Joisse Wendell|Brand Katelin|Gloriana Goldie|
|Age|25|16||
|Newsletter|TRUE|FALSE|TRUE|

Command-line:
```
$ gsjson abc123456789 data.json -i
```

Output:
```json
[{"id":1,"name":"Joisse Wendell","age":25,"newsletter":true},{"id":2,"name":"Brand Katelin","age":16,"newsletter":false},{"id":3,"name":"Gloriana Goldie","newsletter":true}]
```


## Change log

See specific file.


## TO-DO

- Improve options documentation (especially header size)
- Create more test cases


## License
google-spreadsheet-to-json is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.
