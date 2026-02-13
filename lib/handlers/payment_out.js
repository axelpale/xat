const BigNumber = require('big.js')
const Sale = require('../events/Sale')
const handleFee = require('./fee')
const ZERO = new BigNumber(0)

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

  const feeAmount = row.feeAmount
  const feeUnit = row.feeUnit
  const feeUnitPriceEur = row.feeUnitPriceEur

  // Determine fee total
  let feePriceEur = ZERO
  if (feeUnit && feeAmount.gt(0)) {
    feePriceEur = feeAmount.times(feeUnitPriceEur)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent unit.
  handleFee(row, accounts, events)

  // Remove sent asset
  const amount = row.sentAmount
  const sentAssets = account.popAssets(amount)

  if (unit !== 'EUR') {
    // Add capital gain and sale expenses.
    const unitPriceEur = row.sentUnitPriceEur
    const saleExpenses = feePriceEur
    const saleOrigin = row.protocol
    const sale = new Sale(
      row.date,
      sentAssets,
      unitPriceEur,
      saleExpenses,
      saleOrigin
    )
    events.pushEvent('sale', sale)
  }
}
