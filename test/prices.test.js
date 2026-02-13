const test = require('tape')
const prices = require('../lib/prices')

test('prices: ensure module structure', (t) => {
  t.ok(typeof prices.getPriceEur === 'function', 'should have methods')
  t.ok(typeof prices.loadPriceHistory === 'function', 'should have methods')

  t.end()
})

test('prices:getPriceEur behavior', async (t) => {
  // Read the prices
  await prices.loadPriceHistory('USDC')

  // Should be 0.918735090591478
  const p = prices.getPriceEur('USDC', '2020-04-20')
  t.ok(p.lt('0.919'), 'should be in range')
  t.ok(p.gt('0.912'), 'should be in range')

  const q = prices.getPriceEur('hello', '2020-04-20')
  t.ok(q === null, 'missing unit should not throw')

  t.end()
})
