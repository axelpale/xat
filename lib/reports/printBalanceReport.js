const path = require('path')
const arrayToCsv = require('./arrayToCsv')

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')

module.exports = function (accounts, date) {
  // Print a readable balance report for the accounts.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   date
  //     a date string
  //

  const accountsData = []

  accounts.forEach((account) => {
    const datum = {
      date: date,
      accountName: account.name,
      balance: account.getBalance(),
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

  if (accountsData.length > 0) {
    const filename = 'account_balances_' + date + '.csv'
    const filepath = path.join(DATA_DIR, filename)
    arrayToCsv(accountsData, filepath)
  }
}
