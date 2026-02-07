const readLedger = require('./lib/ledger/readLedger')
const convertToRows = require('./lib/ledger/convertToRows')
const joinSimilarRows = require('./lib/ledger/joinSimilarRows')
const writeTransactionHistory = require('./lib/writeTransactionHistory')

const main = async function () {
  const ledgerRows = await readLedger('ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.
  const rows = convertToRows(ledgerRows)

  // Join similar rows so that the resulting spreadsheet is more manageable.
  const denseRows = joinSimilarRows(rows)
  // Write a CSV file.
  writeTransactionHistory(rows, 'ledger-history.csv')
}

main()
