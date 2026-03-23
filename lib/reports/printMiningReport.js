const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectMiningData = require('./collectMiningData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, beginDate, endDate) {
  // Print a readable report of mining income for the given date range.
  // The range is inclusive for the begin date and exclusive for the end date.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //
  const reportData = collectMiningData(accounts, events, beginDate, endDate)

  if (reportData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const filename = 'mining_' + rangeLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
