const { expect } = require('chai')
const helper = require('../../helper')

describe('Cells to JSON', function () {
  const cells = [
    { rowIndex: 1, columnIndex: 1, value: 'name', numericValue: undefined },
    { rowIndex: 1, columnIndex: 2, value: 'year', numericValue: undefined },
    { rowIndex: 2, columnIndex: 1, value: 'Forrest Gump', numericValue: undefined },
    { rowIndex: 2, columnIndex: 2, value: '1994', numericValue: '1994.0' },
    { rowIndex: 3, columnIndex: 1, value: 'Matrix', numericValue: undefined },
    { rowIndex: 3, columnIndex: 2, value: '1999', numericValue: '1999.0' }
  ]

  it('converts cells to JSON with default values', function () {
    const json = helper.cellsToJson(cells)
    expect(json).to.be.instanceof(Array)
    expect(json).to.have.property('length', 2)
    expect(json).to.deep.equal([
      { name: 'Forrest Gump', year: 1994 },
      { name: 'Matrix', year: 1999 }
    ])
  })

  it('converts cells to JSON vertically', function () {
    const json = helper.cellsToJson(cells, { vertical: true })
    expect(json).to.be.instanceof(Array)
    expect(json).to.have.property('length', 1)
    expect(json[0]).to.deep.equal({
      name: 'year',
      forrestGump: 1994,
      matrix: 1999
    })
  })
})
