'use strict'

var should = require('should') // eslint-disable-line no-unused-vars
var helper = require('../helper')

describe('cells to json', function() {

    before(function(done) {
        done()
    })

    var cells = [
        { row: 1, col: 1, value: 'name', numericValue: undefined },
        { row: 1, col: 2, value: 'year', numericValue: undefined },
        { row: 2, col: 1, value: 'Forrest Gump', numericValue: undefined },
        { row: 2, col: 2, value: '1994', numericValue: '1994.0' },
        { row: 3, col: 1, value: 'Matrix', numericValue: undefined },
        { row: 3, col: 2, value: '1999', numericValue: '1999.0' },
    ]

    it('converts cells to json with default values', function(done) {
        var json = helper.cellsToJson(cells)
        json.should.be.instanceOf.Array
        json.should.have.lengthOf(2)
        json[0].should.have.property('name', 'Forrest Gump')
        json[1].should.have.property('name', 'Matrix')
        done()
    })

    it('converts cells to json vertically', function(done) {
        var json = helper.cellsToJson(cells, { vertical: true })
        json.should.be.instanceOf.Array
        json.should.have.lengthOf(1)
        json[0].should.have.property('name', 'year')
        done()
    })

})
