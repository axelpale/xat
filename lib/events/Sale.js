const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const diffDays = require('../utils/diffDays')
const unique = require('../utils/unique')
const config = require('../readConfig')

// Acquisition cost assumption ratios
const LESSER_ACA_RATIO = new BigNumber('0.2')
const GREATER_ACA_RATIO = new BigNumber('0.4')

// Allowed delay in days between an expense and either
// the purchase or sale of the asset so that the expense is deductible.
const EXPENSE_DAY_MARGIN = config.EXPENSE_DAY_MARGIN

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
  id,
  saleDate,
  soldAssets,
  saleUnitPriceEur,
  saleExpensesEur,
  saleOrigin,
  documents
) {
  // A Sale. Invested value becomes realized and thus taxable.
  // Sale consists of a set of assets with various acquisition costs.
  //
  // Parameters:
  //   id
  //     an integer
  //   saleDate
  //     a string
  //   soldAssets
  //     an array of Asset.
  //   saleUnitPriceEur
  //     a BigNumber
  //   saleExpensesEur
  //     a BigNumber
  //   saleOrigin
  //     a string
  //   documents
  //     an array of strings
  //
  if (typeof id !== 'number') {
    throw new Error('Invalid row ID for sale. Must be an integer.')
  }
  if (id !== parseInt(id)) {
    throw new Error('Unexpected row ID for sale. Must be an integer.')
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
  if (!Array.isArray(documents)) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }
  if (documents.some(d => typeof d !== 'string')) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }

  this.id = id
  this.date = saleDate
  this.soldAssets = soldAssets
  this.soldUnit = soldAssets[0].unit
  this.saleUnitPriceEur = saleUnitPriceEur
  this.saleExpensesEur = saleExpensesEur
  this.saleOrigin = saleOrigin
  this.documents = documents
}

module.exports = Sale
const proto = Sale.prototype
proto.type = 'sale'

proto.getIncomeEur = function () {
  // Compute the capital gain. Negative value means capital loss.
  //
  // Return
  //   a BigNumber.
  //

  let totalGain = ZERO

  const assetSales = this.getReportData()
  assetSales.forEach(assetSale => {
    const assetGain = assetSale.capitalGainEur.minus(assetSale.capitalLossEur)
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

proto.getReportData = function () {
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

    // Distribute sale expenses among assets.
    // In Finland, sale expenses can be deduced even if ACA is used.
    const ratio = asset.amount.div(totalAmount)
    let saleExpense = this.saleExpensesEur.times(ratio)

    // Add accumulated expenses from the asset.
    // Determine if the expense is a valid purchase or sale expense.
    let acquisitionExpense = ZERO
    const assetAgeInDays = diffDays(asset.acquisitionDate, this.date)
    for (let j = 0; j < asset.expenses.length; j++) {
      const expense = asset.expenses[j]
      const expenseAgeInDays = diffDays(expense.date, this.date)
      if (expenseAgeInDays <= EXPENSE_DAY_MARGIN) {
        // Recent enough to be considered a sale expense.
        saleExpense = saleExpense.plus(expense.amount)
      } else if (assetAgeInDays - expenseAgeInDays <= EXPENSE_DAY_MARGIN) {
        // The expense is old enough to be considered an acquisition expense.
        acquisitionExpense = acquisitionExpense.plus(expense.amount)
      }
      // Otherwise the expense cannot be connected to the sale.
    }

    // Handle acquisition cost assumption (ACA).
    const age = asset.getAgeInYears(this.date)
    const salePrice = asset.amount.times(this.saleUnitPriceEur)
    const trueAcqPrice = asset.getAcquisitionPriceEur(this.date)
    const trueAcqCost = trueAcqPrice.plus(acquisitionExpense)
    const assumedAcqCost = acquisitionCostAssumption(salePrice, age)
    const isAcqCostAssumptionUsed = assumedAcqCost.gt(trueAcqCost)
    // In Finland, if ACA is used, purchase expenses cannot be deducted.
    let acquisitionPrice = trueAcqPrice
    if (isAcqCostAssumptionUsed) {
      acquisitionPrice = assumedAcqCost
      acquisitionExpense = ZERO
    }

    // Compute capital gain / loss
    const expenses = acquisitionExpense.plus(saleExpense)
    const gain = salePrice.minus(acquisitionPrice).minus(expenses)
    let capitalGain, capitalLoss
    if (gain.gte(0)) {
      capitalGain = gain
      capitalLoss = ZERO
    } else {
      capitalGain = ZERO
      capitalLoss = gain.neg()
    }

    // Merge documents. Do not repeat same docs.
    const documents = unique([].concat(this.documents, asset.documents))

    assetSales.push({
      id: this.id,
      saleDate: this.date,
      documents: documents.join(';'),
      soldAmount: asset.amount,
      soldUnit: asset.unit,
      assetOrigin: asset.origin,
      soldTo: this.saleOrigin,
      acquisitionId: asset.acquisitionId,
      acquisitionDate: asset.acquisitionDate,
      ageInYears: age,
      isAcquisitionCostAssumptionUsed: isAcqCostAssumptionUsed,
      acquisitionPriceEur: acquisitionPrice,
      acquisitionExpensesEur: acquisitionExpense,
      acquisitionCostEur: acquisitionPrice.plus(acquisitionExpense),
      salePriceEur: salePrice,
      saleExpensesEur: saleExpense,
      capitalGainEur: capitalGain,
      capitalLossEur: capitalLoss
    })
  }

  return assetSales
}
