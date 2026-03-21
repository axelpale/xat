const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectGiftsData = require('./collectGiftsData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, year) {
  // Print a readable report of received gifts for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //
  const reportData = collectGiftsData(accounts, events, year)

  if (reportData.length > 0) {
    const filename = 'gifts_report_' + year + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
