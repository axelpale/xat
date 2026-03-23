const test = require('tape')
const BigNumber = require('big.js')
const Asset = require('../lib/Asset')

const getDefaultAsset = () => {
  const amount = new BigNumber(10000)
  const unit = 'DOGE'
  const origin = 'Dogecoin Network'
  const docs = ['2023-04-20-00']
  const id = 1
  const date = '2023-04-20'
  const unitPrice = new BigNumber('0.08')
  const expense = new BigNumber('2.025')

  const asset = new Asset(amount, unit, origin, docs, id, date, unitPrice)
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

test('Asset: split', (t) => {
  const asset = getDefaultAsset()

  const shard = asset.split(new BigNumber('5000'))

  t.ok(shard instanceof Asset, 'should be correct instance type')
  t.ok(shard.amount.eq(new BigNumber('5000')), 'should be split in amount')
  t.equal(shard.acquisitionId, asset.acquisitionId, 'should share row id')

  const acqPrice = shard.getAcquisitionPriceEur('2023-04-20')
  t.ok(acqPrice.eq(new BigNumber('400.00')), 'share the unit price')

  t.end()
})
