const config = require('../readConfig')
const EXCLUDED_ACCOUNTS = config.REPORTS_EXCLUDE_ACCOUNTS

module.exports = function (accounts, dateLabel) {
  // Record unspent assets in each account in their current state.
  // Note that the date label is only for output readability and
  // does not affect the recorded assets or their amounts.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   dateLabel
  //     a date string, the date of collection.
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
        date: dateLabel,
        accountName: account.name,
        amount: asset.amount,
        unit: asset.unit,
        acquisitionId: asset.acquisitionId,
        acquisitionDate: asset.acquisitionDate,
        acquisitionDocuments: asset.documents.join(';'),
        acquisitionOrigin: asset.origin
      }

      assetsData.push(datum)
    })
  })

  return assetsData
}
