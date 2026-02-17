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

  t.equal(rows.length, 7, 'should have expected num of rows')

  const accounts = new AccountCollection()
  const events = new EventCollection()
  processRows(accounts, events, rows)

  t.ok(accounts.hasAccount('Wallet EUR', 'EUR'), 'has eur wallet')
  t.ok(accounts.hasAccount('Wallet BTC', 'BTC'), 'has btc wallet')
  t.ok(accounts.hasAccount('Paper Wallet BTC', 'BTC'), 'has paper wallet')

  const { salesData, rewardsData } = collectTaxReport(accounts, events, 2026)

  t.equal(salesData.length, 4, 'expected num of asset sales')
  t.equal(rewardsData.length, 1, 'expected num of rewards')

  const totalGain = salesData.reduce((acc, x) => {
    return acc.plus(x.capitalGainEur).minus(x.capitalLossEur)
  }, ZERO)

  // 2026-02-02: Purchase, 100 eur for 0.002 btc => 50000 eur/btc.
  //   Expense 2 eur, thus true rate 51000 eur/btc
  // 2026-02-03: Purchase, 120 eur for 0.002 btc => 60000 eur/btc
  //   Expense 0.00008 btc => 4.8 eur.
  //   120 for 0.00192 btc thus true cost basis is 62500 eur/btc
  // 2026-04-02: Sell 0.001 at 80000 eur/btc => price 80 eur, expenses 3 eur.
  //   Cost basis for 0.001 btc = 51000 * 0.001 = 51.00 eur
  //   Gain = 80 - 51 - 3 = 26.00 eur
  // 2026-04-02: Move oldest 0.001, expenses 0.0001
  //   0.0001 is disposed as fee at 80000 eur/btc = 8 eur
  //   Cost basis for 0.0001 is 51000 eur/btc => 5.1 eur
  //   Gain = 8 - 5.1 = 2.9 eur
  // 2026-04-03: Receive reward 0.000012 BTC at 82000 eur/btc => 0.984 eur
  //   subtract the fee 0.000002 BTC at 82k eur/btc => 0.164 eur, net 0.82 eur
  // 2026-04-10: Sell 0.00193 at 36000 eur/btc
  //   Cost basis for 0.00192 is 62500 eur/btc = 120 eur
  //   Cost basis for 0.00001 is 82000 eur/btc = 0.82 eur
  //   Sale price = 0.00193 * 36000 = 69.48 eur, sale expenses 3.48 eur
  //   Gain = 69.48 - 120 - 0.82 - 3.48 = -54.82 eur
  // Total gain should be = 26.00 + 2.9 - 54.82 = -25.92 eur
  const expectedGain = new BigNumber('-25.92')
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
