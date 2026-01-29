const BigNumber = require('big.js')

const Asset = function (
  amount,
  unit,
  purchaseOrigin,
  purchaseDate,
  purchaseUnitPriceEur,
  purchaseExpensesEur
) {
  // Parameters:
  //   amount
  //     numerical value, without expenses i.e. expenses removed if any.
  //   unit
  //     a string, the ticker like 'EUR', 'BTC'.
  //     Will be converted to upper case, for example 'eur' is read as 'EUR'.
  //   origin
  //     a string. The name of the person or organization from where the
  //     asset was bought.
  //   purchaseDate
  //     a string
  //   purchaseUnitPriceEur
  //     a number
  //   purchaseExpensesEur
  //     a number
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount. Must be a BigNumber.')
  }
  if (amount.lte(0)) {
    throw new Error('Asset amount cannot be zero or negative.')
  }
  if (typeof unit !== 'string') {
    throw new Error('Invalid unit. Unit must be a string.')
  }
  if (unit.length < 2) {
    throw new Error('Invalid unit: ' + unit)
  }
  if (typeof purchaseOrigin !== 'string') {
    throw new Error('Invalid purchase origin. Must be a string.')
  }
  if (purchaseOrigin.length < 2) {
    throw new Error('Unexpected purchase origin ' + purchaseOrigin + '. ' +
      'Must be a long enough string. (' + purchaseDate + ')')
  }
  if (typeof purchaseDate !== 'string') {
    throw new Error('Invalid purchaseDate. Must be a string.')
  }
  if (purchaseDate.length < 10) {
    throw new Error('Unexpected purchaseDate string. Must be an ISO date.')
  }
  if (!(purchaseUnitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid purchase price. Must be a BigNumber.')
  }
  if (purchaseUnitPriceEur.lt(0)) {
    throw new Error('Unexpected purchase price. Must be zero or positive.')
  }
  if (!(purchaseExpensesEur instanceof BigNumber)) {
    throw new Error('Invalid purchase expenses. Must be a BigNumber')
  }
  if (purchaseExpensesEur.lt(0)) {
    throw new Error('Unexpected purchase expenses. Must be zero or positive.')
  }

  this.amount = amount
  this.unit = unit.toUpperCase()

  // Carry acquisition event data to splits.
  this.purchaseOrigin = purchaseOrigin
  this.purchaseDate = purchaseDate
  this.purchaseUnitPriceEur = purchaseUnitPriceEur

  // Divide expenses to splits.
  this.purchaseExpensesEur = purchaseExpensesEur

  // Vouchers for the purchase and expenses.
  this.vouchers = []
}

Asset.createFromReceived = function (row) {
  // Create an Asset object from row
  //

  // Expenses must be added explicitly.
  const feePriceEur = new BigNumber(0)

  return new Asset(
    row.receivedAmount,
    row.receivedUnit,
    row.protocol,
    row.date,
    row.receivedUnitPriceEur,
    feePriceEur
  )
}

module.exports = Asset
const proto = Asset.prototype

proto.addExpenseEur = function (amount) {
  // Add to asset acquisition cost.
  //
  // Parameters:
  //   amount
  //     a BigNumber
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount (' + amount + ')')
  }
  if (amount.lt(0)) {
    throw new Error('Unexpected amount (' + amount + '). ' +
      'Must be zero or positive.')
  }
  this.purchaseExpensesEur = this.purchaseExpensesEur.plus(amount)
}

proto.getPurchaseValueEur = function () {
  // Compute purchase value in EUR.
  //
  // Return
  //   a BigNumber
  //
  return this.amount.times(this.purchaseUnitPriceEur)
}

proto.split = function (amount) {
  // Split the asset into two.
  // The original is modified in place
  // and the new one contains the given amount.
  //
  // Parameters:
  //   amount
  //     a BigNumber, the amount to take out from the asset.
  //
  // Return
  //   an Asset, the new asset.
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount. Must be a BigNumber.')
  }
  if (amount.lte(0)) {
    throw new Error('Amount to split cannot be zero or negative.')
  }
  if (amount.gte(this.amount)) {
    throw new Error('Amount to split cannot be equal to or greater than ' +
      'the original amount')
  }

  // Split amount
  const originalAmount = this.amount
  this.amount = originalAmount.minus(amount)

  // Split expenses
  const ratio = amount.div(originalAmount)

  const originalExpenses = this.purchaseExpensesEur
  const splitExpenses = originalExpenses.times(ratio)
  this.purchaseExpensesEur = originalExpenses.minus(splitExpenses)

  return new Asset(
    amount,
    this.unit,
    this.purchaseOrigin,
    this.purchaseDate,
    this.purchaseUnitPriceEur,
    splitExpenses
  )
}
