const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectTaxReport = require('./collectTaxReport')

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')

module.exports = function (accounts, events, year) {
  // Print a readable tax report for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //

  const { salesData, rewardsData } = collectTaxReport(accounts, events, year)

  if (salesData.length > 0) {
    const salesFilename = 'tax_report_sales_' + year + '.csv'
    const salesFilepath = path.join(DATA_DIR, salesFilename)
    arrayToCsv(salesData, salesFilepath)
  }

  if (rewardsData.length > 0) {
    const rewardsFilename = 'tax_report_rewards_' + year + '.csv'
    const rewardsFilepath = path.join(DATA_DIR, rewardsFilename)
    arrayToCsv(rewardsData, rewardsFilepath)
  }
}
