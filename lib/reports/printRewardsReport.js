const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectRewardsData = require('./collectRewardsData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, year) {
  // Print a readable proof-of-stake rewards report for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //
  const reportData = collectRewardsData(accounts, events, year)

  if (reportData.length > 0) {
    const filename = 'rewards_report_' + year + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
