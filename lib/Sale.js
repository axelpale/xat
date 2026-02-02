const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

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
  if (!(salePriceEur instanceof BigNumber)) {
    throw new Error('Invalid sale price. Must be a BigNumber.')
  }
  if (salePriceEur.lt(0)) {
    throw new Error('Unexpected sale price. Must be zero or positive.')
  }
  if (!(saleExpensesEur instanceof BigNumber)) {
    throw new Error('Invalid sale expenses (' + saleExpensesEur + '). ' +
      'Must be a BigNumber.')
  }
  if (saleExpensesEur.lt(0)) {
    throw new Error('Unexpected sale expenses (' + saleExpensesEur + '). ' +
      'Must be zero or positive.')
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
  //   a BigNumber.
  //
  const purchasePriceEur = this.getPurchasePriceEur()
  const purchaseExpensesEur = this.getPurchaseExpensesEur()
  const expenses = purchaseExpensesEur.plus(this.saleExpensesEur)
  return this.salePriceEur.minus(purchasePriceEur).minus(expenses)
}

proto.getSaleAmount = function () {
  // Compute the total amount of the unit sold.
  //
  // Return
  //   a BigNumber.
  //
  let total = ZERO

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total = total.plus(asset.amount)
  }

  return total
}

proto.getPurchasePriceEur = function () {
  // Compute the total purchase price.
  //
  // Return
  //   a BigNumber. The total price in EUR.
  //
  let total = ZERO

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total = total.plus(asset.getPurchaseValueEur())
  }

  return total
}

proto.getPurchaseExpensesEur = function () {
  // Compute the total purchase expenses.
  //
  // Return
  //   a BigNumber. The total purchase expenses in EUR.
  //
  let total = ZERO

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    total = total.plus(asset.purchaseExpensesEur)
  }

  return total
}
