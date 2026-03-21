const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectAirdropsData = require('./collectAirdropsData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, year) {
  // Print a readable report of received airdrops for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //
  const reportData = collectAirdropsData(accounts, events, year)

  if (reportData.length > 0) {
    const filename = 'airdrops_report_' + year + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
