const test = require('tape')
const BigNumber = require('big.js')
const Asset = require('../lib/Asset')

const getDefaultAsset = () => {
  const amount = new BigNumber(10000)
  const unit = 'DOGE'
  const origin = 'Dogecoin Network'
  const date = '2023-04-20'
  const unitPrice = new BigNumber('0.08')
  const expense = new BigNumber('2.025')

  const asset = new Asset(amount, unit, origin, date, unitPrice)
  asset.addExpenseEur(date, expense)

  return asset
}

test('Asset: ensure methods available', (t) => {
  // Class methods
  t.ok(
    typeof Asset.createFromReceived === 'function',
    'createFromReceived available'
  )

  // Instance methods
  const asset = getDefaultAsset()
  t.ok(typeof asset.split === 'function', 'split available')
  t.ok(typeof asset.addExpenseEur === 'function', 'addExpenseEur available')

  t.end()
})

test('Asset: getAgeInYears', (t) => {
  const asset = getDefaultAsset()
  t.ok(asset.getAgeInYears('2024-04-19') < 1, 'less than a year')
  t.ok(asset.getAgeInYears('2024-04-20') >= 1, 'exactly one year')
  t.ok(asset.getAgeInYears('2024-04-21') >= 1, 'more than a year')
  t.end()
})
