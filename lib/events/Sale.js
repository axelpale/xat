const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const LESSER_ACA_RATIO = new BigNumber('0.2')
const GREATER_ACA_RATIO = new BigNumber('0.4')

const acquisitionCostAssumption = (salePrice, assetAgeYears) => {
  // Get the acquisition cost assumption for an asset sale given the age.
  //
  // Parameters:
  //   salePrice
  //     a BigNumber
  //   assetAgeInYears
  //     an integer
  //
  // Return
  //   a BigNumber
  //
  if (!(salePrice instanceof BigNumber)) {
    throw new Error('Invalid sale price. Must be a BigNumber.')
  }
  if (typeof assetAgeYears !== 'number' || isNaN(assetAgeYears)) {
    throw new Error('Invalid asset age. Must be a number.')
  }

  if (assetAgeYears < 10) {
    return salePrice.times(LESSER_ACA_RATIO)
  }
  return salePrice.times(GREATER_ACA_RATIO)
}

const Sale = function (
  transactionId,
  saleDate,
  soldAssets,
  saleUnitPriceEur,
  saleExpensesEur,
  saleOrigin
) {
  // A Sale. Invested value becomes realized and thus taxable.
  // Sale consists of a set of assets with various purchase prices.
  //
  if (typeof transactionId !== 'string') {
    throw new Error('Invalid transaction ID for sale. Must be a string.')
  }
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

  this.transactionId = transactionId
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

  const assetSales = this.getAssetSales()
  assetSales.forEach(assetSale => {
    const assetGain = assetSale.capitalGain.minus(assetSale.capitalLoss)
    totalGain = totalGain.plus(assetGain)
  })

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

proto.getAssetSales = function () {
  // Get the per-purchase sales. Use this in order to report
  // the sales per-purchase instead of per-sale.
  //
  // Return
  //   an array of AssetSale objects
  //

  const assetSales = []

  // Get total amount in order to distribute the sale expense among assets.
  const totalAmount = this.getSaleAmount()
  if (totalAmount.lte(ZERO)) {
    // TODO maybe fees took it all?
    throw new Error('Unexpected zero amount of sold assets.')
  }

  const len = this.soldAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.soldAssets[i]

    // Handle acquisition cost assumption (ACA).
    const age = asset.getAgeInYears(this.date)
    const salePrice = asset.amount.times(this.saleUnitPriceEur)
    const truePurchasePrice = asset.amount.times(asset.purchaseUnitPriceEur)
    const trueAcqCost = truePurchasePrice.plus(asset.purchaseExpensesEur)
    const assumedAcqCost = acquisitionCostAssumption(salePrice, age)
    const isAcqCostAssumptionUsed = assumedAcqCost.gt(trueAcqCost)
    // In Finland, if ACA is used, purchase expenses cannot be deducted.
    let purchasePrice = truePurchasePrice
    let purchaseExpense = asset.purchaseExpensesEur
    if (isAcqCostAssumptionUsed) {
      purchasePrice = assumedAcqCost
      purchaseExpense = ZERO
    }

    // Distribute expenses.
    // In Finland, sale expenses can be deduced even if ACA is used.
    const ratio = asset.amount.div(totalAmount)
    const saleExpense = this.saleExpensesEur.times(ratio)

    // Compute capital gain / loss
    const expenses = purchaseExpense.plus(saleExpense)
    const gain = salePrice.minus(purchasePrice).minus(expenses)
    let capitalGain, capitalLoss
    if (gain.gte(0)) {
      capitalGain = gain
      capitalLoss = ZERO
    } else {
      capitalGain = ZERO
      capitalLoss = gain.neg()
    }

    assetSales.push({
      saleDate: this.date,
      soldAmount: asset.amount,
      soldUnit: asset.unit,
      soldTo: this.saleOrigin,
      // transactionId: this.transactionId,
      assetOrigin: asset.purchaseOrigin,
      purchaseDate: asset.purchaseDate,
      ageInYears: age,
      isAcquisitionCostAssumptionUsed: isAcqCostAssumptionUsed,
      purchasePriceEur: purchasePrice,
      salePriceEur: salePrice,
      purchaseExpensesEur: purchaseExpense,
      saleExpensesEur: saleExpense,
      capitalGainEur: capitalGain,
      capitalLossEur: capitalLoss
    })
  }

  return assetSales
}
