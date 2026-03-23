const test = require('tape')
const tomorrow = require('../lib/utils/tomorrow')

test('tomorrow: ensure expected behavior', (t) => {
  t.equal(tomorrow('2022-02-02'), '2022-02-03', 'should print tomorrow')
  t.equal(tomorrow('2020-01-31'), '2020-02-01', 'should roll month')
  t.equal(tomorrow('2020-12-31'), '2021-01-01', 'should roll year')

  t.end()
})
