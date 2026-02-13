const test = require('tape')
const prices = require('../lib/prices')

test('prices: ensure module structure', (t) => {
  t.ok(typeof prices.getPriceEur === 'function', 'should have methods')

  t.end()
})

test('prices:getPriceEur behavior', async (t) => {
  // Should be 0.918735090591478
  const p = await prices.getPriceEur('USDC', '2020-04-20')
  t.ok(p.lt('0.919'), 'should be in range')
  t.ok(p.gt('0.912'), 'should be in range')

  const q = await prices.getPriceEur('hello', '2020-04-20')
  t.ok(q === null, 'missing unit should not throw')

  t.end()
})
