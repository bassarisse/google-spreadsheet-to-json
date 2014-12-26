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


### Note

A spreadsheet ID can be extracted from its URL.


## Usage - Public Spreadsheets

```
gsjson abc123456789 data.json
```


## Usage - Private Spreadsheets

```
gsjson abc123456789 data.json -u username -p password
```


## Known issues

- Although public spreadsheets should work without authentication, currently an error is occurring. If this happens to you, try providing username and password.


## Example 1 (simple array):

Id | Name | Age | Newsletter
-- | ---- | --- | ----------
1 | Joisse Wendell | 25 | TRUE
2 | Brand Katelin | 16 | FALSE
3 | Gloriana Goldie |  | TRUE

Command:
```
gsjson abc123456789 data.json -b
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


## Example 2 (hashed object):

Id | Name | Age | Newsletter
-- | ---- | --- | ----------
1 | Joisse Wendell | 25 | TRUE
2 | Brand Katelin | 16 | FALSE
3 | Gloriana Goldie |  | TRUE

Command:
```
gsjson abc123456789 data.json -c id -b
```

Output:
```json
{
    "1": {
        "id": 1,
        "name": "Joisse Wendell",
        "age": 25,
        "newsletter": true
    },
    "2": {
        "id": 2,
        "name": "Brand Katelin",
        "age": 16,
        "newsletter": false
    },
    "3": {
        "id": 3,
        "name": "Gloriana Goldie",
        "newsletter": true
    }
}
```


## Example 3 (vertical data, without beautifying):

Id | 1 | 2 | 3
-- | - | - | -
Name | Joisse Wendell | Brand Katelin | Gloriana Goldie
Age | 25 | 16 | 
Newsletter | TRUE | FALSE | TRUE

Command:
```
gsjson abc123456789 data.json -i
```

Output:
```json
[{"id":1,"name":"Joisse Wendell","age":25,"newsletter":true},{"id":2,"name":"Brand Katelin","age":16,"newsletter":false},{"id":3,"name":"Gloriana Goldie","newsletter":true}]
```


## License
google-spreadsheet-to-json is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.