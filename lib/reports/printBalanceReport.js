const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectBalanceData = require('./collectBalanceData')
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, dateLabel) {
  // Print a readable balance report for the accounts in their
  // current state. Note that the date label is only for readability
  // and does not affect the recorded balances.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   dateLabel
  //     a date string, label for filename and recorded balance.
  //

  const balanceData = collectBalanceData(accounts, dateLabel)

  if (balanceData.length > 0) {
    const filename = 'account_balances_' + dateLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(balanceData, filepath)
  }
}
