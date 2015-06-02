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

    -h, --help                   output usage information
    -V, --version                output the version number
    -u, --user [user]            User to login
    -p, --password [password]    Password to login
    -t, --token [token]          Auth token acquired externally
    -y, --tokentype [tokentype]  Type of the informed token (defaults to Bearer)
    -w, --worksheet <n>          Worksheet index
    -c, --hash [column]          Column to hash the final JSON
    -i, --vertical               Use the first column as header
    -l, --list-only              Ignore headers and just list the values in arrays
    -b, --beautify               Beautify final JSON
```


### Note

A spreadsheet ID can be extracted from its URL.


## Usage (public Spreadsheets)

```
gsjson abc123456789 data.json
```


## Usage (private Spreadsheets)

```
gsjson abc123456789 data.json -t authtoken
```


## Known issues

- Since Google now enforces OAuth 2.0, this module offers an argument for the auth token. One of the methods to acquire a temporary token:
  - Access Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
  - Enter the scope: https://spreadsheets.google.com/feeds/
  - Authorize and retrieve your access token

- Public spreadsheets can only be used without authentication if the option "File > Publish to the web" is used in the Google Spreadsheets GUI, even if the spreadsheet is visible to everyone. This problem won't occur when authenticated.


## Example 1 (array of objects):

| Id | Name | Age | Newsletter |
| -- | ---- | --- | ---------- |
| 1 | Joisse Wendell | 25 | TRUE |
| 2 | Brand Katelin | 16 | FALSE |
| 3 | Gloriana Goldie |  | TRUE |

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

| Id | Name | Age | Newsletter |
| -- | ---- | --- | ---------- |
| 1 | Joisse Wendell | 25 | TRUE |
| 2 | Brand Katelin | 16 | FALSE |
| 3 | Gloriana Goldie |  | TRUE |

Command:
```
gsjson abc123456789 data.json -b -c id
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


## Example 3 (list of values):

| Id | Name | Age | Newsletter |
| -- | ---- | --- | ---------- |
| 1 | Joisse Wendell | 25 | TRUE |
| 2 | Brand Katelin | 16 | FALSE |
| 3 | Gloriana Goldie |  | TRUE |

Command:
```
gsjson abc123456789 data.json -b -l
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


## Example 4 (vertical data, without beautifying):

| Id | 1 | 2 | 3 |
| -- | - | - | - |
| Name | Joisse Wendell | Brand Katelin | Gloriana Goldie |
| Age | 25 | 16 |  |
| Newsletter | TRUE | FALSE | TRUE |

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