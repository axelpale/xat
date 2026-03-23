const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectAcquisitionsData = require('./collectAcquisitionsData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, beginDate, endDate) {
  // Print a readable report of all acquisitions in the given date range.
  // The range is inclusive for the begin date and exclusive for the end date.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of financial events
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //
  const reportData = collectAcquisitionsData(
    accounts,
    events,
    beginDate,
    endDate
  )

  if (reportData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const filename = 'acquisitions_' + rangeLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
