// This file reads Kraken-ledger and outputs a xat ledger.
// - Merges the rows into executed orders.
// - Converts the row and fees into xat ledger format.
// - Groups proof-of-stake rewards a bit.
//
const readLedger = require('./lib/ledger/readLedger')
const convertToRows = require('./lib/ledger/convertToRows')
const joinSimilarRows = require('./lib/ledger/joinSimilarRows')
const filterColumns = require('./lib/ledger/filterColumns')
const writeTransactionHistory = require('./lib/ledger/writeTransactionHistory')
const getDateFromDateTime = require('./lib/utils/getDateFromDateTime')
const getTimeFromDateTime = require('./lib/utils/getTimeFromDateTime')
const prices = require('./lib/prices')

const normalizeType = (type) => {
  switch (type) {
    case 'trade_tradespot':
      return 'trade'
    case 'staking':
    case 'earn_reward':
      return 'reward'
    case 'transfer_spotfromfutures':
      return 'airdrop'
    case 'transfer_stakingfromspot':
    case 'transfer_stakingtospot':
    case 'transfer_spotfromstaking':
    case 'transfer_spottostaking':
    case 'earn_allocation':
    case 'earn_deallocation':
    case 'earn_migration':
    case 'deposit':
    case 'withdrawal':
      return 'move'
    default:
      return type
  }
}

const normalizeUnit = (unit) => {
  switch (unit) {
    case 'ADA.S': return 'ADA'
    case 'ETH2': return 'ETH'
    case 'FLOW.S': return 'FLOW'
    case 'GRT28.S': return 'GRT'
    case 'GRT.S': return 'GRT'
    case 'MATIC04.S': return 'MATIC'
    case 'USDC.M': return 'USDC'
    case 'USDT.M': return 'USDT'
    case 'XTZ.S': return 'XTZ'
    default: return unit
  }
}

const findUnitPrice = (unit, date) => {
  // Find EUR price for the given unit on the given date.
  //
  // Return
  //   a BigNumber or null if no data can be found.
  //
  if (!unit || typeof unit !== 'string' || unit === '') {
    return null
  }
  if (!date || typeof date !== 'string') {
    return null
  }
  return prices.getPriceEur(unit, date)
}

const main = async function () {
  // Preload price history data.
  await prices.loadPriceHistory('ADA')
  await prices.loadPriceHistory('BTC')
  await prices.loadPriceHistory('ETH')
  await prices.loadPriceHistory('FLOW')
  await prices.loadPriceHistory('GRT')
  await prices.loadPriceHistory('LUNA2')
  await prices.loadPriceHistory('MATIC')
  await prices.loadPriceHistory('MINA')
  await prices.loadPriceHistory('POL')
  await prices.loadPriceHistory('SOL')
  await prices.loadPriceHistory('TRX')
  await prices.loadPriceHistory('USDC')
  await prices.loadPriceHistory('USDT')

  const ledgerRows = await readLedger('data/exchange-ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.
  let rows = convertToRows(ledgerRows)

  // Simplify PoS units.
  rows = rows.map(row => {
    return Object.assign({}, row, {
      sentUnit: normalizeUnit(row.sentUnit),
      receivedUnit: normalizeUnit(row.receivedUnit),
      feeUnit: normalizeUnit(row.feeUnit)
    })
  })

  // Join similar rows so that the resulting spreadsheet is more manageable.
  rows = joinSimilarRows(rows)

  // Join reward rows until other actions on the account.
  // const denserRows1 = joinRewards(denseRows)

  // Strip unnecessary columns for easier debugging.
  const columns = [
    'date',
    'type',
    'desc',
    'fromAccount',
    'toAccount',
    'sentAmount',
    'sentUnit',
    'receivedAmount',
    'receivedUnit',
    'feeAmount',
    'feeUnit',
    'senderBalance',
    'receiverBalance'
  ]
  rows = filterColumns(rows, columns)

  // Normalize type
  rows = rows.map(row => {
    return Object.assign({}, row, {
      type: normalizeType(row.type)
    })
  })

  // Split date and time
  rows = rows.map(row => {
    return Object.assign({}, row, {
      date: getDateFromDateTime(row.date),
      time: getTimeFromDateTime(row.date)
    })
  })

  // Add unit prices
  rows = rows.map(row => {
    return Object.assign({}, row, {
      sentUnitPriceEur: findUnitPrice(row.sentUnit, row.date),
      receivedUnitPriceEur: findUnitPrice(row.receivedUnit, row.date)
    })
  })

  // Arrange columns and fill in missing
  rows = rows.map(row => {
    return {
      date: row.date,
      voucher: '2024-12-31-06',
      type: row.type,
      desc: row.desc,
      protocol: 'Kraken Exchange',
      txid: null,
      fromAddress: null,
      toAddress: null,
      fromAccount: row.fromAccount,
      toAccount: row.toAccount,
      sentAmount: row.sentAmount,
      sentUnit: row.sentUnit,
      receivedAmount: row.receivedAmount,
      receivedUnit: row.receivedUnit,
      feeAmount: row.feeAmount,
      feeUnit: row.feeUnit,
      feeAccount: null,
      exRate: null,
      exRateUnit: null,
      usdeurRate: null,
      sentUnitPriceEur: row.sentUnitPriceEur,
      receivedUnitPriceEur: row.receivedUnitPriceEur,
      feeUnitPriceEur: null,
      senderBalance: row.senderBalance,
      senderUnit: row.sentUnit,
      receiverBalance: row.receiverBalance,
      receiverUnit: row.receivedUnit
    }
  })

  // Write a CSV file.
  writeTransactionHistory(rows, 'data/exchange-ledger-normalized.csv')
}

main()
