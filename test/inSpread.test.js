const test = require('tape')
const inSpread = require('../lib/utils/inSpread')

test('inSpread: ensure expected behavior', (t) => {
  t.ok(inSpread(10, 5, 1), 'should allow max value')
  t.ok(inSpread(0, 5, 1), 'should allow min value')

  t.ok(inSpread(6, 5, '0.20'), 'should allow decimal strings')
  t.ok(inSpread(4, 5, '0.20'), 'should allow decimal strings')
  t.notOk(inSpread(6, 5, 0.15), 'should allow decimal floats')
  t.notOk(inSpread(4, 5, 0.15), 'should allow decimal floats')

  t.ok(inSpread(-4, 5, 2), 'should support negative number')
  t.notOk(inSpread(-4, 5, 1.6), 'should support negative number')

  t.ok(inSpread(1, 0, 1), 'should pick largest magnitude')
  t.notOk(inSpread(1, 0, 0.8), 'should pick largest magnitude')

  t.ok(inSpread(0, 0, 0), 'should understand trivial zero case')
  t.notOk(inSpread(0.01, 0, 0), 'should allow zero spread')

  t.ok(inSpread(101, 100, -0.02), 'should support negative spread')
  t.notOk(inSpread(103, 100, -0.02), 'should support negative spread')

  t.end()
})
