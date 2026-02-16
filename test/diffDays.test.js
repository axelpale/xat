const test = require('tape')
const diffDays = require('../lib/utils/diffDays')

test('diffDays: ensure expected behavior', (t) => {
  t.equal(diffDays('2022-02-02', '2022-02-03'), 1, 'should be one day diff')
  t.equal(diffDays('2022-02-03', '2022-02-02'), -1, 'should go negative')
  t.equal(diffDays('2022-02-02', '2022-02-02'), 0, 'should be zero diff')

  t.equal(diffDays('2024-01-01', '2025-01-01'), 366, 'should respect leap year')

  t.end()
})
