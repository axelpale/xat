const readLedger = require('./lib/ledger/readLedger')
const convertToRows = require('./lib/ledger/convertToRows')
const joinSimilarRows = require('./lib/ledger/joinSimilarRows')
const joinRewards = require('./lib/ledger/joinRewards')
const filterColumns = require('./lib/ledger/filterColumns')
const writeTransactionHistory = require('./lib/writeTransactionHistory')

const main = async function () {
  const ledgerRows = await readLedger('ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.
  const rows = convertToRows(ledgerRows)

  // Join similar rows so that the resulting spreadsheet is more manageable.
  const denseRows = joinSimilarRows(rows)

  // Join reward rows until other actions on the account.
  const denserRows = joinRewards(denseRows)

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
  const denserrRows = filterColumns(denserRows, columns)

  // Write a CSV file.
  writeTransactionHistory(denserrRows, 'ledger-history.csv')
}

main()
