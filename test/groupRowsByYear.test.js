const test = require('tape')
const groupRowsByYear = require('../lib/rows/groupRowsByYear')

test('groupRowsByYear: ', (t) => {
  const mockRows = [
    { date: '2014-01-01' },
    { date: '2014-03-13' },
    { date: '2015-05-15' },
    { date: '2020-02-20' }
  ]

  const groups = groupRowsByYear(mockRows)

  t.equal(groups.length, 3, 'should divide to groups')
  t.equal(groups[0].length, 2, 'should maintain order')
  t.equal(groups[2].length, 1, 'should maintain order')

  t.end()
})
