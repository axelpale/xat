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

const normalizeType = (type) => {
  switch (type) {
    case 'trade_tradespot':
      return 'trade'
    case 'staking':
    case 'earn_reward':
    case 'transfer_spotfromfutures':
      return 'reward'
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

const main = async function () {
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

  // Write a CSV file.
  writeTransactionHistory(rows, 'data/exchange-ledger-normalized.csv')
}

main()
