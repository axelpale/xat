const test = require('tape')
const BigNumber = require('big.js')
const GiftAsset = require('../lib/GiftAsset')

const getDefaultAsset = () => {
  const amount = new BigNumber(10000)
  const unit = 'DOGE'
  const origin = 'Dogecoin Network'
  const docs = ['2023-04-20-00']
  const id = 1
  const date = '2023-04-20'
  const unitPrice = new BigNumber('0.08')
  const original = new BigNumber('0.01') // Original unit price
  const expense = new BigNumber('2.00')

  const asset = new GiftAsset(
    amount,
    unit,
    origin,
    docs,
    id,
    date,
    unitPrice,
    original
  )
  asset.addExpenseEur(date, expense)

  return asset
}

test('GiftAsset: ensure acquisition price follows year rule', (t) => {
  const asset = getDefaultAsset()

  const acqPriceA = asset.getAcquisitionPriceEur('2023-04-21')
  t.ok(acqPriceA.eq(new BigNumber('100.00')), 'should be the original')

  const acqPriceB = asset.getAcquisitionPriceEur('2024-04-20')
  t.ok(acqPriceB.eq(new BigNumber('800.00')), 'should be at receiving')

  t.end()
})

test('GiftAsset: split', (t) => {
  const asset = getDefaultAsset()

  const shard = asset.split(new BigNumber('5000'))

  t.ok(shard instanceof GiftAsset, 'should be correct instance type')
  t.ok(shard.amount.eq(new BigNumber('5000')), 'should be split in amount')
  t.equal(shard.acquisitionId, asset.acquisitionId, 'should share row id')

  const acqPrice = shard.getAcquisitionPriceEur('2023-04-21')
  t.ok(acqPrice.eq(new BigNumber('50.00')), 'carry the original unit price')

  t.end()
})
