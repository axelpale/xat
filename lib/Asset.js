const Asset = function () {
  this.amount = 0.0001
  this.unit = 'BTC'
  // Carry acquisition event data and divide.
  this.purchaseDateTime = Date.now()
  this.purchaseUnitPriceEur = 10000
  this.purchaseExpensesEur = 0.1 // Collect fees.
  // Vouchers for the purchase and expenses.
  this.vouchers = []
}

module.exports = Asset
