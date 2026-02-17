const test = require('tape')
const path = require('path')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const readRows = require('../lib/readRows')
const processRows = require('../lib/processRows')
const AccountCollection = require('../lib/AccountCollection')
const EventCollection = require('../lib/EventCollection')
const collectTaxReport = require('../lib/reports/collectTaxReport')

test('processRows: ensure accounts match', async (t) => {
  // Read the prices
  const ledgerPath = path.resolve(__dirname, 'data', 'test-ledger.csv')
  const rows = await readRows(ledgerPath)

  t.equal(rows.length, 5, 'should have expected num of rows')

  const accounts = new AccountCollection()
  const events = new EventCollection()
  processRows(accounts, events, rows)

  t.ok(accounts.hasAccount('Wallet EUR', 'EUR'), 'has eur wallet')
  t.ok(accounts.hasAccount('Wallet BTC', 'BTC'), 'has btc wallet')
  t.ok(accounts.hasAccount('Paper Wallet BTC', 'BTC'), 'has paper wallet')

  const { salesData, rewardsData } = collectTaxReport(accounts, events, 2026)

  t.equal(salesData.length, 2, 'expected num of asset sales')
  t.equal(rewardsData.length, 1, 'expected num of rewards')

  const totalGain = salesData.reduce((acc, x) => {
    return acc.plus(x.capitalGainEur).minus(x.capitalLossEur)
  }, ZERO)

  // Acquistion cost 102 eur per 0.002 btc => 51000 eur / btc.
  // Sell 0.0011 at 80000 eur / btc => sale price 88 eur, expenses 3 eur.
  // Cost basis for 0.0011 btc = 51000 * 0.0011 = 56.1 eur
  // Total gain should be = 88 - 56.1 - 3 = 28.9 eur
  const expectedGain = new BigNumber('28.9')
  t.ok(totalGain.eq(expectedGain), 'should compute gain ok')

  const totalRewardIncome = rewardsData.reduce((acc, x) => {
    return acc.plus(x.capitalIncomeEur)
  }, ZERO)

  // Receive total 0.000012 BTC at 82000 eur / btc => 0.984 eur
  // Directly subtract the fee 0.000002 BTC at 82k eur/btc => 0.164 eur
  // Thus net 0.82 eur
  const expectedRewardIncome = new BigNumber('0.82')
  t.ok(totalRewardIncome.eq(expectedRewardIncome), 'should compute rewards ok')

  t.end()
})
