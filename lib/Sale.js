const Sale = function (
  saleDate,
  soldAssets,
  salePriceEur,
  saleExpensesEur
) {
  // A Sale. Invested value becomes realized and thus taxable.
  //
  if (!saleDate || typeof saleDate !== 'string') {
    throw new Error('Invalid sale date. Must be a string.')
  }
  if (!Array.isArray(soldAssets)) {
    throw new Error('Invalid sold assets. Must be an array.')
  }
  if (soldAssets.length < 1) {
    throw new Error('No sold assets. Must have at least one asset.')
  }
  const hasSameUnit = soldAssets.every(asset => {
    return asset.unit === soldAssets[0].unit
  })
  if (!hasSameUnit) {
    throw new Error('Unexpected sold assets. Must have identical unit.')
  }
  if (typeof salePriceEur !== 'number' || isNaN(salePriceEur)) {
    throw new Error('Invalid sale price. Must be a number.')
  }
  if (salePriceEur < 0) {
    throw new Error('Unexpected sale price. Must be zero or positive.')
  }
  if (typeof saleExpensesEur !== 'number' || isNaN(saleExpensesEur)) {
    throw new Error('Invalid sale expenses. Must be a number.')
  }
  if (saleExpensesEur < 0) {
    throw new Error('Unexpected sale expenses. Must be zero or positive.')
  }

  this.saleDate = saleDate
  this.soldAssets = soldAssets
  this.soldUnit = soldAssets[0].unit
  this.salePriceEur = salePriceEur
  this.saleExpensesEur = saleExpensesEur
}

module.exports = Sale
const proto = Sale.prototype

proto.getCapitalGainEur = function () {
  // Compute the capital gain. Negative value means capital loss.
  //
  // Return
  //   a number.
  //
  const purchasePriceEur = this.getPurchasePriceEur()
  const purchaseExpensesEur = this.getPurchaseExpensesEur()
  const expenses = purchaseExpensesEur + this.saleExpensesEur
  return this.salePriceEur - purchasePriceEur - expenses
}

proto.getSaleAmount = function () {
  // Compute the total amount of the unit sold.
  //
  // Return
  //   a number.
  //
  let total = 0
  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total += asset.amount
  }

  return total
}

proto.getPurchasePriceEur = function () {
  // Compute the total purchase price.
  //
  // Return
  //   a number. The total price in EUR.
  //
  let total = 0
  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total += asset.getPurchaseValueEur()
  }

  return total
}

proto.getPurchaseExpensesEur = function () {
  // Compute the total purchase expenses.
  //
  // Return
  //   a number. The total purchase expenses in EUR.
  //
  let total = 0
  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total += asset.purchaseExpensesEur
  }

  return total
}
