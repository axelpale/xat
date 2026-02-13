const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const Sale = function (
  saleDate,
  soldAssets,
  saleUnitPriceEur,
  saleExpensesEur,
  saleOrigin
) {
  // A Sale. Invested value becomes realized and thus taxable.
  // Sale consists of a set of assets with various purchase prices.
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
  if (!(saleUnitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid sale unit price. Must be a BigNumber.')
  }
  if (saleUnitPriceEur.lt(0)) {
    throw new Error('Unexpected sale unit price. Must be zero or positive.')
  }
  if (!(saleExpensesEur instanceof BigNumber)) {
    throw new Error('Invalid sale expenses (' + saleExpensesEur + '). ' +
      'Must be a BigNumber.')
  }
  if (saleExpensesEur.lt(0)) {
    throw new Error('Unexpected sale expenses (' + saleExpensesEur + '). ' +
      'Must be zero or positive.')
  }

  if (!saleOrigin || typeof saleOrigin !== 'string') {
    throw new Error('Invalid sale origin. Must be a string.')
  }

  this.date = saleDate
  this.soldAssets = soldAssets
  this.soldUnit = soldAssets[0].unit
  this.saleUnitPriceEur = saleUnitPriceEur
  this.saleExpensesEur = saleExpensesEur
  this.saleOrigin = saleOrigin
}

module.exports = Sale
const proto = Sale.prototype

proto.getGainEur = function () {
  // Compute the capital gain. Negative value means capital loss.
  //
  // Return
  //   a BigNumber.
  //

  let totalGain = ZERO

  const saleDate = this.date
  const totalAmount = this.getSaleAmount()

  if (totalAmount.lte(ZERO)) {
    // Special case: sale amount is zero. Maybe fees took it all?
    const saleExp = this.saleExpensesEur
    const purchaseExp = this.getPurchaseExpensesEur()
    return ZERO.minus(saleExp).minus(purchaseExp)
  }

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]

    const salePriceEur = asset.amount.times(this.saleUnitPriceEur)
    const purchasePriceEur = asset.getPurchasePriceEur()
    const purchaseExpenses = asset.purchaseExpensesEur
    const ratio = asset.amount.div(totalAmount)
    const saleExpenses = this.saleExpensesEur.times(ratio)

    let gain = salePriceEur
      .minus(purchasePriceEur)
      .minus(saleExpenses)
      .minus(purchaseExpenses)

    const assetAgeYears = asset.getAgeInYears(saleDate)

    // Try Acquisition Cost Assumption.
    const costAssumptionPercentage = assetAgeYears < 10 ? 0.2 : 0.4
    const costAssumption = salePriceEur.times(costAssumptionPercentage)
    const cost = purchasePriceEur.plus(purchaseExpenses).plus(saleExpenses)

    if (cost.lt(costAssumption)) {
      // Assumption higher than actual cost.
      // Therefore we want to use the assumption.
      gain = salePriceEur.minus(costAssumption)
    }

    totalGain = totalGain.plus(gain)
  }

  return totalGain
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

proto.getPurchaseDate = function () {
  // Get purchase date if there is only one date.
  // Return 'various' if there is more than one date.
  //
  let purchaseDate = null

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    if (!purchaseDate) {
      // Init date
      purchaseDate = asset.purchaseDate
    } else {
      if (purchaseDate !== asset.purchaseDate) {
        // Different date. Thus there are various dates.
        purchaseDate = 'various'
        break
      } // else the same date
    }
  }

  return purchaseDate
}

proto.getPurchaseOrigin = function () {
  // Get purchase origin if there is only one origin.
  // Return 'various' if there is more than one origin.
  //
  let origin = null

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]
    if (!origin) {
      // Init
      origin = asset.purchaseOrigin
    } else {
      if (origin !== asset.purchaseOrigin) {
        // Different. Thus there are various.
        origin = 'various'
        break
      } // else the same origin
    }
  }

  return origin
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
    total = total.plus(asset.getPurchasePriceEur())
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

proto.getSalePriceEur = function () {
  // Get the total sale price in eur.
  //
  // Return
  //   a BigNumber
  //
  const amount = this.getSaleAmount()
  const unitPrice = this.saleUnitPriceEur
  return amount.times(unitPrice)
}
