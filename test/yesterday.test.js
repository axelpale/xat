const test = require('tape')
const yesterday = require('../lib/utils/yesterday')

test('yesterday: ensure expected behavior', (t) => {
  t.equal(yesterday('2022-02-02'), '2022-02-01', 'should print yesterday')
  t.equal(yesterday('2020-02-01'), '2020-01-31', 'should roll month')
  t.equal(yesterday('2021-01-01'), '2020-12-31', 'should roll year')

  t.end()
})
