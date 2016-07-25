google-spreadsheet-to-json
==========================

[![NPM version](https://badge.fury.io/js/google-spreadsheet-to-json.png)](http://badge.fury.io/js/google-spreadsheet-to-json)

A simple tool to export Google Spreadsheets to JSON files. Can be used though Node API or command-line.


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
    -u, --user <user>            User to login
    -p, --password <password>    Password to login
    -t, --token <token>          Auth token acquired externally
    -y, --tokentype <tokentype>  Type of the informed token (defaults to Bearer)
    -w, --worksheet <n>          Worksheet index or title (defaults to first worksheet, can be repeated)
    -c, --hash <column>          Column to hash the final object
    -m, --property-mode <mode>   How to handle property names: "camel" (default), "pascal", "nospace" or "none"
    -i, --vertical               Use the first column as header
    -l, --list-only              Just list the values in arrays
    -0, --include-header         Include header when using "list-only" option
```


### Note

A spreadsheet ID can be extracted from its URL.


## Usage (command-line)

Public spreadsheets:
```
$ gsjson abc123456789 data.json
```

Private spreadsheets:
```
$ gsjson abc123456789 data.json -t authtoken
```

You can also redirect the output if you omit the filename:
```
$ gsjson abc123456789 -t authtoken >> data.json
```


## Usage (Node API)

With the exception of `beautify`, the same options from the command-line applies here (options like `include-header` becomes `includeHeader`).

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


## Known issues

- Public spreadsheets can only be used without authentication if the option "File > Publish to the web" is used in the Google Spreadsheets GUI, even if the spreadsheet is visible to everyone. This problem won't occur when authenticated.

- Since Google now enforces OAuth 2.0, this module offers an argument for the auth token. One of the methods to acquire a temporary token:
  - Access Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
  - Enter the scope: https://spreadsheets.google.com/feeds/
  - Authorize and retrieve your access token


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

## License
google-spreadsheet-to-json is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.