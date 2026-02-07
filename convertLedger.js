const readLedger = require('./lib/ledger/readLedger')
const convertToRows = require('./lib/ledger/convertToRows')
const writeTransactionHistory = require('./lib/writeTransactionHistory')

const main = async function () {
  const ledgerRows = await readLedger('ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.
  const rows = convertToRows(ledgerRows)

  // Write a CSV file.
  writeTransactionHistory(rows, 'ledger-history.csv')
}

main()
