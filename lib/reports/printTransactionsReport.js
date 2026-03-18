const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectTransactionsData = require('./collectTransactionsData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, year) {
  // Print a readable transactions report for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of financial events
  //   year
  //     a string or integer
  //
  const reportData = collectTransactionsData(accounts, events, year)

  if (reportData.length > 0) {
    const filename = 'transactions_' + year + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
