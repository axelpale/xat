const Sale = require('../Sale')

module.exports = function (row, accounts, events) {
  // Handle a payment that is made with assets
  // that are subject to capital gain.

  // find source account
  const name = row.fromAccount
  const unit = row.sentUnit
  const account = accounts.findAccount(name, unit)
  if (!account) {
    throw new Error('Account not found: ' + name)
  }

  // remove asset
  const amount = row.sentAmount
  const sentAssets = account.popAssets(amount)

  // add capital_gain
  const salePrice = amount * row.sentUnitPriceEur
  const saleExpenses = row.feeValueEur
  const sale = new Sale(row.date, sentAssets, salePrice, saleExpenses)
  events.saleEvents.push(sale)
}
