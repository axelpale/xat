const test = require('tape')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const EventCollection = require('../lib/EventCollection')
const Reward = require('../lib/events/Reward')
const Asset = require('../lib/Asset')

const createReward = (id, amount, date) => {
  const bigAmount = new BigNumber(amount)
  const unit = 'DOGE'
  const docs = []
  const origin = 'Dogecoin Network'
  const unitPrice = new BigNumber('0.1')
  const expense = bigAmount.times(new BigNumber(0.02))

  const asset = new Asset(bigAmount, unit, origin, docs, id, date, unitPrice)
  asset.addExpenseEur(date, expense)

  return new Reward(id, date, [asset], ZERO)
}

test('EventCollection:findByDateRange', (t) => {
  const events = new EventCollection()

  events.pushEvent(createReward(1, 1000, '2021-10-10'))
  events.pushEvent(createReward(2, 2000, '2021-10-12'))
  events.pushEvent(createReward(3, 1000, '2021-10-14'))

  const evsA = events.findByDateRange('reward', '2020-01-01', '2021-10-10')
  const evsB = events.findByDateRange('reward', '2021-10-10', '2021-10-13')
  const evsC = events.findByDateRange('reward', '2021-10-10', '2021-10-14')
  const evsD = events.findByDateRange('reward', '2021-10-12', '2021-10-15')

  t.equal(evsA.length, 0, 'endDate should be exclusive')
  t.equal(evsB.length, 2, 'beginDate should be inclusive')
  t.equal(evsC.length, 2, 'endDate should be exclusive')
  t.equal(evsD.length, 2, 'beginDate should be inclusive')

  t.end()
})
