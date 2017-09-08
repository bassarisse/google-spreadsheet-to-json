google-spreadsheet-to-json (usage examples)
===========================================

## Example 1 (array of objects)

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


## Example 2 (hashed object, with pascal case properties)

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


## Example 3 (list of values, selecting the second worksheet)

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


## Example 4 (selecting multiple worksheets by title)

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


## Example 5 (vertical data, without beautifying)

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
