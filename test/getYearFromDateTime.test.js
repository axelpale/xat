const test = require('tape')
const getYear = require('../lib/utils/getYearFromDateTime')

test('getYearFromDateTime: ensure expected behavior', (t) => {
  t.equal(getYear('2022-02-02'), 2022, 'should return correct integer')

  t.throws(() => {
    getYear(null)
  }, /invalid/i, 'should detect invalid date')

  t.throws(() => {
    getYear('2020202020')
  }, /unexpected/i, 'should detect invalid date')

  t.throws(() => {
    getYear('hello')
  }, /unexpected/i, 'should detect invalid date')

  t.end()
})
