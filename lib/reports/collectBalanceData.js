const BigNumber = require('big.js')
const config = require('../readConfig')

const EXCLUDED_ACCOUNTS = config.REPORTS_EXCLUDE_ACCOUNTS
const DISPLAY_ZERO_BALANCE = config.REPORTS_DISPLAY_ZERO_BALANCE

const ZERO = new BigNumber(0)

module.exports = function (accounts, timeLabel) {
  // Record balances for the accounts in their current state.
  // Note that the time label is only for output readability and
  // does not affect the recorded balances.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   timeLabel
  //     a datetime string, the timestamp of balance recording.
  //

  const accountsData = []

  accounts.forEach((account) => {
    // Skip account if excluded
    if (EXCLUDED_ACCOUNTS.includes(account.name)) {
      return
    }

    // Skip zero balance accounts if needed
    const balance = account.getBalance()
    if (!DISPLAY_ZERO_BALANCE && balance.lte(ZERO)) {
      return
    }

    const datum = {
      dateTime: timeLabel,
      accountName: account.name,
      balance,
      unit: account.unit
    }

    accountsData.push(datum)
  })

  // Sort data by account name for readability.
  accountsData.sort((a, b) => {
    if (a.accountName === b.accountName) {
      return 0
    }
    if (a.accountName < b.accountName) {
      return -1
    }
    return 1
  })

  return accountsData
}
