const Sale = require('../Sale')

module.exports = function (row, accounts, events) {
  // Handle a payment that is made with assets
  // that are subject to capital gain.
  //

  // Find source account
  const name = row.fromAccount
  const unit = row.sentUnit
  const account = accounts.findAccount(name, unit)
  if (!account) {
    throw new Error('Account not found: ' + name)
  }

  // Remove asset
  const amount = row.sentAmount
  const sentAssets = account.popAssets(amount)

  // Add capital gain and sale expenses.
  const unitPriceEur = row.sentUnitPriceEur
  const saleExpenses = row.feeValueEur
  const sale = new Sale(row.date, sentAssets, unitPriceEur, saleExpenses)
  events.saleEvents.push(sale)
}
