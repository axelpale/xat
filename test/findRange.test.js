const test = require('tape')
const BigNumber = require('big.js')
const findRange = require('../lib/utils/findRange')

test('findRange: ensure expected behavior', (t) => {
  t.throws(() => {
    findRange([])
  }, /empty array/, 'should detect empty array')

  const one = findRange([4])
  t.ok(one.min.eq(4), 'should support one-element arrays')
  t.ok(one.max.eq(4), 'should support one-element arrays')

  const three = findRange([-2, 3, 10000, 0, -1])
  t.ok(three.min.eq(-2), 'should support negative numberes')
  t.ok(three.max.eq(10000), 'should find correct max')

  const bigs = findRange([new BigNumber(-2), new BigNumber(10000), -2])
  t.ok(bigs.min.eq(new BigNumber(-2)), 'should support BigNumber')
  t.ok(bigs.max.eq(new BigNumber(10000)), 'should find correct max')

  t.end()
})
