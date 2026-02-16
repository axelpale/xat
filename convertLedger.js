const readLedger = require('./lib/ledger/readLedger')
const convertToRows = require('./lib/ledger/convertToRows')
const joinSimilarRows = require('./lib/ledger/joinSimilarRows')
const joinRewards = require('./lib/ledger/joinRewards')
const filterColumns = require('./lib/ledger/filterColumns')
const writeTransactionHistory = require('./lib/writeTransactionHistory')
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

const main = async function () {
  const ledgerRows = await readLedger('data/ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.
  const rows = convertToRows(ledgerRows)

  // Join similar rows so that the resulting spreadsheet is more manageable.
  const denseRows = joinSimilarRows(rows)

  // Join reward rows until other actions on the account.
  const denserRows1 = joinRewards(denseRows)

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
  const denserRows2 = filterColumns(denserRows1, columns)

  // Normalize type
  const denserRows3 = denserRows2.map(row => {
    return Object.assign({}, row, {
      type: normalizeType(row.type)
    })
  })

  // Split date and time
  const denserRows4 = denserRows3.map(row => {
    return Object.assign({}, row, {
      date: getDateFromDateTime(row.date),
      time: getTimeFromDateTime(row.date)
    })
  })

  // Write a CSV file.
  writeTransactionHistory(denserRows4, 'data/ledger-normalized.csv')
}

main()
