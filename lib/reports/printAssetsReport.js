const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const config = require('../readConfig')
const EXCLUDED_ACCOUNTS = config.REPORTS_EXCLUDE_ACCOUNTS
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (accounts, date) {
  // Print a readable report that lists all unspent asset acquisitions
  // in every account.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   date
  //     a date string
  //

  // Sort accounts by name for readability.
  const accountArray = []
  accounts.forEach(a => accountArray.push(a))
  accountArray.sort((a, b) => {
    if (a.name === b.name) {
      return 0
    }
    if (a.name < b.name) {
      return -1
    }
    return 1
  })

  const assetsData = []

  accountArray.forEach((account) => {
    // Skip account if excluded
    if (EXCLUDED_ACCOUNTS.includes(account.name)) {
      return
    }

    account.assets.forEach(asset => {
      const datum = {
        date,
        accountName: account.name,
        amount: asset.amount,
        unit: asset.unit,
        acquisitionId: asset.acquisitionId,
        acquisitionDate: asset.acquisitionDate,
        acquisitionOrigin: asset.origin
      }

      assetsData.push(datum)
    })
  })

  if (assetsData.length > 0) {
    const filename = 'account_assets_' + date + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(assetsData, filepath)
  }
}
