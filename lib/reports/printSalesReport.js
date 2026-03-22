const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectSalesData = require('./collectSalesData')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, events, beginDate, endDate) {
  // Print a readable sales report for the given date range.
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
  const reportData = collectSalesData(accounts, events, beginDate, endDate)

  if (reportData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const filename = 'sales_report_' + rangeLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
